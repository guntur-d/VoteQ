// src/components/Login.js
import { i18n } from '../i18n.js';

export default {
  email: '',
  password: '',
  loading: false,
  error: '',
  login() {
    this.loading = true;
    this.error = '';
    const body = {
      email: this.email,
      password: this.password
    };
    console.log('[FRONTEND LOGIN] Sending body:', body);
    m.request({
      method: 'POST',
      url: '/api/auth/login',
      body,
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
        m('label', { for: 'email' }, i18n.email || 'Email'),
        m('input', {
          id: 'email',
          type: 'email',
          value: this.email,
          oninput: e => { this.email = e.target.value; },
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
