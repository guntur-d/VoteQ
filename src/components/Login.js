import { i18n } from '../i18n.js';

export default {
  email: '',
  password: '',
  error: '',
  message: '',
  loading: false,
  oninit() {
    // Check for a message passed from another route, e.g., registration
    const routeState = m.route.param('state');
    if (routeState && routeState.message) {
      this.message = routeState.message;
    }
  },
  async login() {
    this.loading = true;
    this.error = '';
    this.message = ''; // Clear message on new attempt
    try {
      const res = await m.request({
        method: 'POST',
        url: '/api/auth/login',
        body: { email: this.email, password: this.password },
      });
      localStorage.setItem('token', res.token);
      m.route.set('/app/dashboard');
    } catch (err) {
      this.error = err.response?.error || i18n.loginFailed;
    } finally {
      this.loading = false;
      m.redraw();
    }
  },
  view() {
    return m('main.container', [
      m('h2', i18n.login),
      m('form', {
        onsubmit: e => { e.preventDefault(); this.login(); }
      }, [
        this.message && m('p', { style: { color: 'var(--pico-color-green-500)' } }, this.message),
        m('input[type=email][placeholder=' + i18n.email + '][required]', {
          oninput: e => this.email = e.target.value,
          value: this.email
        }),
        m('input[type=password][placeholder=' + i18n.password + '][required]', {
          oninput: e => this.password = e.target.value,
          value: this.password
        }),
        m('.grid',
          m('button[type=submit]', { disabled: this.loading, 'aria-busy': this.loading }, this.loading ? 'Masuk...' : i18n.login),
          m('button[type=button].secondary', { disabled: this.loading, onclick: () => m.route.set('/app/register') }, i18n.register)
        ),
        this.error && m('p', { style: { color: 'var(--pico-color-red-500)' } }, this.error)
      ])
    ]);
  }
};
