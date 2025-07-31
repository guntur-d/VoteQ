import { i18n } from '../i18n.js';

export default {
  caleg: '',
  showEdit: false,
  editSecret: '',
  editSecretError: '',
  loading: false,
  error: '',
  oninit() {
    const token = localStorage.getItem('token');
    const authHeader = token ? { Authorization: `Bearer ${token}` } : {};
    m.request({ method: 'GET', url: '/api/caleg', headers: authHeader })
      .then(data => {
        if (data && data.name) {
          this.caleg = data.name;
        } else {
          this.showEdit = true;
        }
        m.redraw();
      });
  },
  save(name) {
    this.loading = true;
    this.error = '';
    const token = localStorage.getItem('token');
    const authHeader = token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
    m.request({
      method: 'POST',
      url: '/api/caleg',
      body: { name },
      headers: authHeader
    }).then(res => {
      this.caleg = res.name;
      this.showEdit = false;
      this.editSecret = '';
      this.editSecretError = '';
      this.loading = false;
      m.redraw();
    }).catch(() => {
      this.error = i18n.saveError || 'Gagal menyimpan';
      this.loading = false;
      m.redraw();
    });
  },
  view(vnode) {
    const hasSubmissions = vnode.attrs.hasSubmissions || false;

    if (this.caleg && !this.showEdit) {
      return m('section', [
        m('h3', i18n.calegSetting || 'Caleg'),
        m('div', [
          m('strong', i18n.currentCaleg || 'Caleg Saat Ini:'), ' ', this.caleg
        ]),
        m('button', {
          onclick: () => { this.showEdit = true; },
          disabled: hasSubmissions
        }, i18n.editCaleg || 'Ubah Caleg'),
        hasSubmissions && m('p', { style: { fontSize: '0.8rem', fontStyle: 'italic', marginTop: '0.5rem', color: 'var(--pico-color-red-500)' } },
          'Pengaturan tidak dapat diubah karena sudah ada data suara yang masuk.')
      ]);
    }
    // Remove secret prompt logic, just show input form below
    // Show input form
    return m('section', [
      m('h3', i18n.calegSetting || 'Caleg'),
      m('form', {
        onsubmit: e => {
          e.preventDefault();
          const name = e.target.elements.caleg.value;
          this.save(name);
        }
      }, [
        m('label', { for: 'caleg' }, i18n.calegName || 'Nama Caleg'),
        m('input[type=text][name=caleg][id=caleg][autocomplete=off]'),
        m('button[type=submit]', { disabled: this.loading }, i18n.save || 'Simpan'),
        this.error && m('div.error', this.error)
      ])
    ]);
  }
};
