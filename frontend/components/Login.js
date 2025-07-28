import { i18n } from '../i18n.js';

export default {
  email: '',
  password: '',
  error: '',
  view() {
    return m('main.container', [
      m('h2', i18n.login),
      m('form', {
        onsubmit: e => {
          e.preventDefault();
          m.request({
            method: 'POST',
            url: '/api/auth/login',
            body: { email: this.email, password: this.password },
          }).then(res => {
            localStorage.setItem('token', res.token);
            m.route.set('/app/dashboard');
          }).catch(err => {
            this.error = err.response?.error || i18n.loginFailed;
          });
        }
      }, [
        m('input[type=email][placeholder=' + i18n.email + '][required]', {
          oninput: e => this.email = e.target.value,
          value: this.email
        }),
        m('input[type=password][placeholder=' + i18n.password + '][required]', {
          oninput: e => this.password = e.target.value,
          value: this.password
        }),
        m('button[type=submit]', i18n.login),
        m('button[type=button]', {
          onclick: () => m.route.set('/app/register')
        }, i18n.register),
        this.error && m('p.error', this.error)
      ])
    ]);
  }
};
