import Login from './components/Login.js';
import Register from './components/Register.js';
import Dashboard from './components/Dashboard.js';
import SubmissionForm from './components/SubmissionForm.js';
import AdminPanel from './components/AdminPanel.js';

const isAuthenticated = () => !!localStorage.getItem('token');

m.route.prefix = '#!';
m.route(document.body, '/app/login', {
  '/app/login': {
    render: () => m(Login)
  },
  '/app/register': {
    render: () => m(Register)
  },
  '/app/dashboard': {
    onmatch: () => isAuthenticated() ? undefined : m.route.set('/app/login'),
    render: () => m(Dashboard)
  },
  '/app/submit': {
    onmatch: () => isAuthenticated() ? undefined : m.route.set('/app/login'),
    render: () => m(SubmissionForm)
  },
  '/app/admin': {
    onmatch: () => isAuthenticated() ? undefined : m.route.set('/app/login'),
    render: () => m(AdminPanel)
  }
});
