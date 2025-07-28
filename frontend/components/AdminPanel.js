
import { i18n } from '../i18n.js';

export default {
  submissions: [],
  oninit() {
    m.request({
      method: 'GET',
      url: '/api/admin/submissions',
      headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
    }).then(res => {
      this.submissions = res;
    });
  },
  view() {
    return m('main.container', [
      m('h2', i18n.adminPanel),
      m('a', { href: '/dashboard', oncreate: m.route.link }, i18n.backToDashboard),
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
          m.route.set('/login');
        }
      }, i18n.logout)
    ]);
  },
  approve(id) {
    m.request({
      method: 'POST',
      url: `/api/admin/approve/${id}`,
      headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
    }).then(() => {
      this.oninit();
    });
  },
  flag(id) {
    m.request({
      method: 'POST',
      url: `/api/admin/flag/${id}`,
      headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
    }).then(() => {
      this.oninit();
    });
  }
};
