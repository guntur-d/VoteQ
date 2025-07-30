// /public/js/components/Login.js
import { i18n } from '../i18n.js';

export default {
  phoneNumber: '',
  password: '',
  loading: false,
  error: '',
  login() {
    this.loading = true;
    this.error = '';
    m.request({
      method: 'POST',
      url: '/api/auth/login',
      body: {
        phoneNumber: this.phoneNumber,
        password: this.password
      },
      headers: { 'Content-Type': 'application/json' }
    }).then(response => {
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      m.route.set('/app/dashboard');
    }).catch(error => {
      this.error = error.error || i18n.loginError;
      this.loading = false;
      m.redraw();
    });
  },
  view() {
    return m('main.container', [
      m('h1', i18n.login),
      m('form', {
        onsubmit: e => {
          e.preventDefault();
          this.login();
        }
      }, [
        m('label', { for: 'phoneNumber' }, i18n.phoneNumber),
        m('input', {
          id: 'phoneNumber',
          type: 'tel',
          value: this.phoneNumber,
          oninput: e => { this.phoneNumber = e.target.value; },
          required: true
        }),
        m('label', { for: 'password' }, i18n.password),
        m('input', {
          id: 'password',
          type: 'password',
          value: this.password,
          oninput: e => { this.password = e.target.value; },
          required: true
        }),
        m('button[type=submit]', { disabled: this.loading }, i18n.login),
        this.error && m('div.error', this.error)
      ]),
      m('p', [
        'Belum punya akun? ',
        m('a', { href: '#!/app/register' }, i18n.register)
      ])
    ]);
  }
};
