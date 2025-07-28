import { i18n } from '../i18n.js';

export default {
  submissions: [],
  oninit() {
    m.request({
      method: 'GET',
      url: '/api/submissions',
      headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
    }).then(res => {
      this.submissions = res;
    });
  },
  view() {
    return m('main.container', [
      m('h2', i18n.dashboard),
      m('button', {
        onclick: () => m.route.set('/app/submit')
      }, i18n.newSubmission),
      m('ul',
        this.submissions.map(s =>
          m('li', `TPS: ${s.tpsNumber}, Desa: ${s.village}, Kecamatan: ${s.district}, Suara: ${s.votes}`)
        )
      ),
      m('button', {
        onclick: () => {
          localStorage.removeItem('token');
          m.route.set('/app/login');
        }
      }, i18n.logout)
    ]);
  }
};
