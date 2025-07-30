// /public/js/components/CalegSetting.js
import { i18n } from '../i18n.js';

export default {
  calegName: '',
  loading: false,
  success: '',
  error: '',
  calegSet: false,
  showEdit: false,
  
  oninit() {
    // Fetch current caleg setting
    const token = localStorage.getItem('token');
    const authHeader = token ? { Authorization: `Bearer ${token}` } : {};
    m.request({
      method: 'GET',
      url: '/api/caleg',
      headers: authHeader
    }).then(caleg => {
      console.log('Fetched caleg setting:', caleg);
      if (caleg && caleg.name) {
        this.calegName = caleg.name;
        this.calegSet = true;
      } else {
        this.calegSet = false;
      }
      m.redraw();
    }).catch(err => {
      console.error('Error fetching caleg:', err);
      this.calegSet = false;
      m.redraw();
    });
  },
  
  save() {
    this.loading = true;
    this.success = '';
    this.error = '';
    const token = localStorage.getItem('token');
    const authHeader = token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
    m.request({
      method: 'POST',
      url: '/api/caleg',
      body: {
        name: this.calegName
      },
      headers: authHeader
    }).then(() => {
      this.loading = false;
      this.success = 'Caleg berhasil disimpan';
      this.error = '';
      this.showEdit = false;
      this.calegSet = true;
      m.redraw();
    }).catch(() => {
      this.error = 'Gagal menyimpan caleg';
      this.loading = false;
      m.redraw();
    });
  },
  
  view() {
    if (this.calegSet && !this.showEdit) {
      // Show current caleg and edit button
      return m('section', [
        m('h3', i18n.calegSetting || 'Pengaturan Caleg'),
        m('div', [
          m('strong', i18n.currentCaleg || 'Caleg Saat Ini:'), ' ',
          this.calegName
        ]),
        m('button', {
          onclick: () => { this.showEdit = true; }
        }, i18n.editCaleg || 'Ubah Caleg')
      ]);
    }
    
    // Show caleg form
    return m('section', [
      m('h3', i18n.calegSetting || 'Pengaturan Caleg'),
      m('form', {
        onsubmit: e => { e.preventDefault(); this.save(); }
      }, [
        m('label', { for: 'calegName' }, i18n.calegName || 'Nama Caleg'),
        m('input', {
          id: 'calegName',
          type: 'text',
          value: this.calegName,
          oninput: e => { this.calegName = e.target.value; },
          required: true
        }),
        m('button[type=submit]', { disabled: this.loading }, i18n.save || 'Simpan'),
        this.success && m('div.success', this.success),
        this.error && m('div.error', this.error)
      ])
    ]);
  }
};
