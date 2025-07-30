
import { i18n } from '../i18n.js';

export default {
  name: '',
  email: '',
  password: '',
  error: '',
  loading: false,
  async register() {
    this.loading = true;
    this.error = '';
    try {
      await m.request({
        method: 'POST',
        url: '/api/auth/register',
        body: { name: this.name, email: this.email, password: this.password },
      });
      // Redirect to login with a success message
      m.route.set('/app/login', { state: { message: 'Pendaftaran berhasil. Silakan masuk.' } });
    } catch (err) {
      this.error = err.response?.error || i18n.registrationFailed;
    } finally {
      this.loading = false;
      m.redraw();
    }
  },
  view() {
    return m('main.container', [
      m('h2', i18n.register),
      m('form', {
        onsubmit: e => { e.preventDefault(); this.register(); }
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
        m('.grid',
          m('button[type=submit]', { disabled: this.loading, 'aria-busy': this.loading }, this.loading ? 'Mendaftar...' : i18n.register),
          m('button[type=button].secondary', { disabled: this.loading, onclick: () => m.route.set('/app/login') }, i18n.login)
        ),
        this.error && m('p', { style: { color: 'var(--pico-color-red-500)' } }, this.error)
      ])
    ]);
  }
};
