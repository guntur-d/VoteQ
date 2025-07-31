
import { i18n } from '../i18n.js';

export default {
    provinsiList: [],
    kabupatenList: [],
    selectedProvinsi: '',
    selectedKabupaten: '',
    loading: false,
    provinsiLoading: true,
    kabupatenLoading: false,
    success: '',
    error: '',
    areaSet: false,
    areaDisplay: '',
    showEdit: false,
    editSecret: '',
    editSecretError: '',
    oninit() {
        // Fetch provinsi list from API
        this.provinsiLoading = true;
        m.request({ method: 'GET', url: '/api/provinsi' })
            .then(data => {
                this.provinsiList = data;
                this.provinsiLoading = false;
                m.redraw();
                // After provinsiList is loaded, fetch area setting
                const token = localStorage.getItem('token');
                const authHeader = token ? { Authorization: `Bearer ${token}` } : {};
                m.request({
                    method: 'GET',
                    url: '/api/admin/area-setting',
                    headers: authHeader
                }).then(setting => {
                    console.log('Fetched area setting:', setting);
                    if (setting && setting.provinsi && setting.kabupatenKota) {
                        this.selectedProvinsi = setting.provinsi;
                        this.selectedKabupaten = setting.kabupatenKota;
                        this.areaSet = true;
                        const prov = this.provinsiList.find(p => p.code === setting.provinsi);
                        // Always fetch kabupatenList for selected provinsi
                        if (prov) {
                            m.request({
                                method: 'GET',
                                url: `/api/kabupatenkota?provinsiCode=${prov.code}`
                            }).then(kabupatenList => {
                                this.kabupatenList = kabupatenList;
                                const kab = this.kabupatenList.find(k => k.code === setting.kabupatenKota);
                                const provName = prov ? prov.name : setting.provinsi;
                                const kabName = kab ? kab.name : setting.kabupatenKota;
                                this.areaDisplay = `${provName} / ${kabName}`;
                                m.redraw();
                            });
                        } else {
                            // Provinsi not found in list, fallback to code
                            this.areaDisplay = `${setting.provinsi} / ${setting.kabupatenKota}`;
                            m.redraw();
                        }
                    } else {
                        this.areaSet = false;
                    }
                });
            }).catch(() => {
                this.provinsiLoading = false;
                m.redraw();
            });
    },
    fetchKabupaten() {
        if (!this.selectedProvinsi) return;
        this.kabupatenLoading = true;
        // Fetch kabupaten list for selected provinsi from API
        console.log('Fetching kabupaten for provinsi:', this.selectedProvinsi);
        m.request({ method: 'GET', url: `/api/kabupatenkota?provinsiCode=${this.selectedProvinsi}` })
            .then(data => {
                console.log('Fetched kabupaten list:', data);
                this.kabupatenList = data;
                this.kabupatenLoading = false;
                m.redraw();
            }).catch(() => {
                this.kabupatenList = [];
                this.kabupatenLoading = false;
                m.redraw();
            });
    },
    save() {
        this.loading = true;
        this.success = '';
        this.error = '';
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        console.log('[AREA SETTING] User from localStorage:', user);
        const authHeader = token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
        const postBody = {
            provinsi: this.selectedProvinsi,
            kabupatenKota: this.selectedKabupaten,
            admin: user.id || user._id
        };
        console.log('[AREA SETTING] Sending POST body:', postBody);
        m.request({
            method: 'POST',
            url: '/api/admin/area-setting',
            body: postBody,
            headers: authHeader
        }).then(() => {
            // After save, re-fetch area setting and show summary
            this.loading = false;
            this.success = '';
            this.error = '';
            this.showEdit = false;
            this.editSecret = '';
            // Find provinsi name for display
            const prov = this.provinsiList.find(p => p.code === this.selectedProvinsi);
            this.areaDisplay = `${prov ? prov.name : this.selectedProvinsi} / ${this.kabupatenList.find(k => k.code === this.selectedKabupaten)?.name || this.selectedKabupaten}`;
            this.areaSet = true;
            m.redraw();
        }).catch(() => {
            this.error = i18n.saveError || 'Gagal menyimpan';
            this.loading = false;
            m.redraw();
        });
    },
    view(vnode) {
        const hasSubmissions = vnode.attrs.hasSubmissions || false;

        // Show only loading indicator before area setting has been fetched
        if (this.provinsiLoading || this.selectedProvinsi === '' && !this.areaSet) {
            return m('section', [m('p', 'Memuat...')]);
        }

        if (this.areaSet && !this.showEdit) {
            // Show current area and edit button
            return m('section', [
                m('h3', i18n.areaSetting || 'Pengaturan Area'),
                m('div', [
                    m('strong', i18n.currentArea || 'Area Saat Ini:'), ' ',
                    this.areaDisplay? m('span', this.areaDisplay) : m('span', 'memuat..')
                ]),
                m('button', { onclick: () => { this.showEdit = true; }, disabled: hasSubmissions }, i18n.editArea || 'Ubah Area'),
                hasSubmissions && m('p', { style: { fontSize: '0.8rem', fontStyle: 'italic', marginTop: '0.5rem', color: 'var(--pico-color-red-500)' } },
                  'Pengaturan tidak dapat diubah karena sudah ada data suara yang masuk.'
                )
            ]);
        }
        // Show select area form
        return m('section', [
            m('h3', i18n.areaSetting || 'Pengaturan Area'),
            m('form', {
                onsubmit: e => { e.preventDefault(); this.save(); }
            }, [
                m('label', { for: 'provinsi' }, i18n.province || 'Provinsi'),
                m('select', {
                    id: 'provinsi',
                    onchange: e => {
                        this.selectedProvinsi = e.target.value;
                        this.selectedKabupaten = '';
                        this.kabupatenList = [];
                        if (this.selectedProvinsi) this.fetchKabupaten();
                        m.redraw();
                    },
                    value: this.selectedProvinsi,
                    disabled: this.provinsiLoading
                }, [
                    this.provinsiLoading
                        ? m('option', { value: '' }, 'Memuat...') 
                        : [
                            m('option', { value: '' }, i18n.selectProvince || 'Pilih Provinsi'),
                            this.provinsiList.map(p => m('option', { value: p.code }, p.name))
                        ]
                ]),
                m('label', { for: 'kabupaten' }, i18n.kabupatenKota || 'Kabupaten/Kota'),
                m('select', {
                    id: 'kabupaten',
                    onchange: e => { this.selectedKabupaten = e.target.value; },
                    value: this.selectedKabupaten,
                    disabled: !this.selectedProvinsi || this.kabupatenLoading
                }, [
                    this.kabupatenLoading
                        ? m('option', { value: '' }, 'Memuat...')
                        : [
                            m('option', { value: '' }, i18n.selectKabupaten || 'Pilih Kabupaten/Kota'),
                            this.kabupatenList.map(k => m('option', { value: k.code }, k.name))
                        ]
                ]),
                m('button[type=submit]', { disabled: this.loading }, i18n.save || 'Simpan'),
                this.success && m('div.success', this.success),
                this.error && m('div.error', this.error)
            ])
        ]);
    }
};
