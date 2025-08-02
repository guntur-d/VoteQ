// src/components/Register.js
import { i18n } from '../i18n.js';

export default {
  fullName: '',
  email: '', // Add this
  phoneNumber: '',
  password: '',
  loading: false,
  error: '',
  success: '',
  register() {
    if (!this.fullName || !this.email || !this.phoneNumber || !this.password) {
      this.error = 'Semua field wajib diisi';
      return;
    }
    this.loading = true;
    this.error = '';
    this.success = '';
    m.request({
      method: 'POST',
      url: '/api/register', // PATCHED: use Vercel-compatible endpoint
      body: {
        fullName: this.fullName,
        email: this.email, // Add this
        phoneNumber: this.phoneNumber,
        password: this.password
      },
      headers: { 'Content-Type': 'application/json' }
    }).then(response => {
      this.success = response.message || i18n.registerSuccess;
      this.fullName = '';
      this.email = ''; // Add this
      this.phoneNumber = '';
      this.password = '';
      this.loading = false;
      m.redraw();
    }).catch(error => {
      this.error = error.error || 'Pendaftaran gagal';
      this.loading = false;
      m.redraw();
    });
  },
  view() {
    return m('main.container', [
      m('h1', i18n.register),
      m('form', {
        onsubmit: e => {
          e.preventDefault();
          this.register();
        }
      }, [
        m('label', { for: 'fullName' }, i18n.fullName),
        m('input', {
          id: 'fullName',
          type: 'text',
          value: this.fullName,
          oninput: e => { this.fullName = e.target.value; },
          required: true
        }),
        m('label', { for: 'email' }, i18n.email), // Add this
        m('input', {
          id: 'email',
          type: 'email',
          value: this.email,
          oninput: e => { this.email = e.target.value; },
          required: true
        }),
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
        m('button[type=submit]', { disabled: this.loading }, i18n.register),
        this.success && m('div.success', this.success),
        this.error && m('div.error', this.error)
      ]),
      m('p', [
        'Sudah punya akun? ',
        m('a', { href: '#!/app/login' }, i18n.login)
      ])
    ]);
  }
};
