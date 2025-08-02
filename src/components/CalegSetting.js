import { i18n } from '../i18n.js';

export default {
  caleg: '',
  showEdit: false,
  editSecret: '',
  editSecretError: '',
  loading: false,
  error: '',
  oninit() {
    this.loading = true;
    const token = localStorage.getItem('token');
    const authHeader = token ? { Authorization: `Bearer ${token}` } : {};
    m.request({ method: 'GET', url: '/api/caleg', headers: authHeader })
        .then(data => {
            if (data && data.name) {
                this.caleg = data.name;
                this.showEdit = false;
            } else {
                this.caleg = '';
                this.showEdit = true;
            }
            this.loading = false;
            m.redraw();
        }).catch(() => {
            this.caleg = '';
            this.showEdit = true;
            this.loading = false;
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

    // Show loading state while fetching caleg setting
    if (this.loading && !this.showEdit) {
        return m('section', [m('p', 'Memuat...')]);
    }

    // If caleg is set and not editing, show summary with edit button
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

    // Show input form if no caleg set or editing
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
            m('input[type=text][name=caleg][id=caleg][autocomplete=off]', { value: this.caleg || '', oninput: e => { this.caleg = e.target.value; } }),
            m('button[type=submit]', { disabled: this.loading }, i18n.save || 'Simpan'),
            this.error && m('div.error', this.error)
        ])
    ]);
  }
};
