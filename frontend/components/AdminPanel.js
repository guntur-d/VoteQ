
import CalegSetting from './CalegSetting.js';
import AreaSetting from './AreaSetting.js';


import { i18n } from '../i18n.js';

export default {
  submissions: [],
  unverifiedUsers: [],
  oninit() {
    this.fetchData();
  },
  fetchData() {
    const token = localStorage.getItem('token');
    const authHeader = token ? { Authorization: `Bearer ${token}` } : {};
    // Fetch submissions
    m.request({
      method: 'GET',
      url: '/api/admin/submissions',
      headers: authHeader
    }).then(res => {
      this.submissions = res;
      m.redraw();
    });
    // Fetch unverified users
    m.request({
      method: 'GET',
      url: '/api/admin/unverified-users',
      headers: authHeader
    }).then(res => {
      this.unverifiedUsers = res;
      m.redraw();
    });
  },
  view() {
    return m('main.container', [
      m('h2', i18n.adminPanel),
      m('a', { href: '/dashboard', oncreate: m.route.link }, i18n.backToDashboard),
      // Unverified users section
      m('section', [
        m('h3', i18n.unverifiedUsers || 'Pengguna Belum Diverifikasi'),
        this.unverifiedUsers.length === 0
          ? m('p', i18n.noUnverifiedUsers || 'Tidak ada pengguna baru yang menunggu verifikasi.')
          : m('ul',
              this.unverifiedUsers.map(u =>
                m('li', [
                  `${u.name || u.username || u.email} (${u.email})`,
                  m('button', {
                    onclick: () => this.verifyUser(u._id)
                  }, i18n.verify || 'Verifikasi')
                ])
              )
            )
      ]),
      // Caleg Setting section
      m(CalegSetting),
      // Area Setting section
      m(AreaSetting),
      // Submissions section
      m('h3', i18n.submissions || 'Data Masuk'),
      m('ul',
        this.submissions.map(s =>
          m('li', [
            `TPS: ${s.tpsNumber}, Desa: ${s.village}, Kecamatan: ${s.district}, Suara: ${s.votes} `,
            m('button', {
              onclick: () => this.approve(s._id)
            }, i18n.approve),
            m('button', {
              onclick: () => this.flag(s._id)
            }, i18n.flag)
          ])
        )
      ),
      m('button', {
        onclick: () => {
          localStorage.removeItem('token');
          window.location.href = '/app/login';
        }
      }, i18n.logout)
    ]);
  },
  approve(id) {
    const token = localStorage.getItem('token');
    const authHeader = token ? { Authorization: `Bearer ${token}` } : {};
    m.request({
      method: 'POST',
      url: `/api/admin/approve/${id}`,
      headers: authHeader
    }).then(() => {
      this.fetchData();
    });
  },
  flag(id) {
    const token = localStorage.getItem('token');
    const authHeader = token ? { Authorization: `Bearer ${token}` } : {};
    m.request({
      method: 'POST',
      url: `/api/admin/flag/${id}`,
      headers: authHeader
    }).then(() => {
      this.fetchData();
    });
  },
  verifyUser(id) {
    const token = localStorage.getItem('token');
    const authHeader = token ? { Authorization: `Bearer ${token}` } : {};
    m.request({
      method: 'POST',
      url: `/api/admin/verify-user/${id}`,
      headers: authHeader
    }).then(() => {
      this.fetchData();
    });
  }
};
