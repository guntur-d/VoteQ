
// import m from 'mithril'; // Use global 'm' from CDN instead
import { i18n } from '../i18n.js';

export default {
  name: '',
  email: '',
  password: '',
  error: '',
  view() {
    return m('main.container', [
      m('h2', i18n.register),
      m('form', {
        onsubmit: e => {
          e.preventDefault();
          m.request({
            method: 'POST',
            url: '/api/auth/register',
            body: { name: this.name, email: this.email, password: this.password },
          }).then(() => {
            m.route.set('/app/login');
          }).catch(err => {
            this.error = err.response?.error || i18n.registrationFailed;
          });
        }
      }, [
        m('input[type=text][placeholder=' + i18n.name + '][required]', {
          oninput: e => this.name = e.target.value,
          value: this.name
        }),
        m('input[type=email][placeholder=' + i18n.email + '][required]', {
          oninput: e => this.email = e.target.value,
          value: this.email
        }),
        m('input[type=password][placeholder=' + i18n.password + '][required]', {
          oninput: e => this.password = e.target.value,
          value: this.password
        }),
        m('button[type=submit]', i18n.register),
        m('button[type=button]', {
          onclick: () => m.route.set('/app/login')
        }, i18n.login),
        this.error && m('p.error', this.error)
      ])
    ]);
  }
};
