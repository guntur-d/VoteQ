import { i18n } from '../i18n.js';
import SubmissionForm from './SubmissionForm.js';
import { apiRequest, logout } from '../utils.js';

const cardStyle = {
  cursor: 'pointer',
  textAlign: 'center',
  padding: 'calc(var(--spacing) * 1.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '8rem'
};

const cardHeaderStyle = {
  margin: 0,
  fontWeight: 400 // Use a lighter font weight than the default bold for h3
};

export default {
  area: null,
  calegName: '',
  kecamatanList: [],
  desaList: [],
  selectedKecamatan: null, // { code, name }
  selectedDesa: null, // { code, name }
  loading: true,
  loadingDesa: false,
  loadingSubmissions: false,
  userSubmissions: [],
  error: '',
  isModalOpen: false,
  modalImageUrl: '',
  isEditModalOpen: false,
  editingSubmissionId: null,

  async oninit() {
    this.loading = true;
    this.error = '';
    try {
      // Fetch area setting and caleg name in parallel
      const [area, calegData] = await Promise.all([
        apiRequest({ method: 'GET', url: '/api/area-setting' }),
        apiRequest({ method: 'GET', url: '/api/caleg' }).catch(() => ({})) // Don't fail if caleg isn't set
      ]);

      this.area = area;
      if (calegData && calegData.name) {
        this.calegName = calegData.name;
      }

      if (this.area && this.area.kabupatenKota && this.area.provinsi && this.calegName) {
        // PATCH: Use POST with body for kecamatan fetch
        this.kecamatanList = await apiRequest({
          method: 'POST',
          url: '/api/kecamatan',
          body: {
            kabupatenCode: this.area.kabupatenKota,
            provinsiCode: this.area.provinsi
          },
          headers: { 'Content-Type': 'application/json' }
        });
      } else {
        this.kecamatanList = [];
      }
    } catch (e) {
      this.error = e.response?.error || 'Gagal memuat data dasbor.';
      if (e.code === 401 || e.code === 403) {
        logout();
      }
    } finally {
      this.loading = false;
      m.redraw();
    }
  },

  async selectKecamatan(kecamatan) {
    if (!this.calegName) {
      return;
    }
    this.selectedKecamatan = kecamatan;
    this.desaList = [];
    this.loadingDesa = true;
    this.error = '';
    m.redraw();

    try {
      const { provinsi, kabupatenKota } = this.area;
      // PATCH: Use POST with body for desa fetch
      this.desaList = await apiRequest({
        method: 'POST',
        url: '/api/kelurahan',
        body: {
          provinsiCode: provinsi,
          kabupatenCode: kabupatenKota,
          kecamatanCode: kecamatan.code
        },
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (e) {
      this.error = e.response?.error || 'Gagal memuat daftar desa.';
      if (e.code === 401 || e.code === 403) {
        logout();
      }
    } finally {
      this.loadingDesa = false;
      m.redraw();
    }
  },

  async selectDesa(desa) {
    this.selectedDesa = desa;
    this.fetchUserSubmissions(desa.code);
  },

  async fetchUserSubmissions(desaCode) {
    console.log('fetchUserSubmissions called with desaCode:', desaCode);
    console.log('selectedKecamatan:', this.selectedKecamatan);
    console.log('selectedDesa:', this.selectedDesa);

    this.loadingSubmissions = true;
    this.userSubmissions = [];
    m.redraw();
    try {
      // PATCH: Use POST with body for user submissions fetch
      const response = await apiRequest({
        method: 'POST',
        url: '/api/mysubs',
        body: { kelurahanDesaCode: desaCode },
        headers: { 'Content-Type': 'application/json' }
      });

      this.userSubmissions = response || [];
      console.log('userSubmissions set to:', this.userSubmissions);
    } catch (e) {
      console.error("Could not fetch user's submissions", e);
      console.error("Error details:", e.response);
      this.userSubmissions = [];
    } finally {
      this.loadingSubmissions = false;
      m.redraw();
    }
  },

  // PATCH: Use POST with body for kecamatan fetch
  fetchKecamatan() {
    if (!this.area.kabupatenKota || !this.area.provinsi) return Promise.resolve([]);
    return m.request({
      method: 'POST',
      url: '/api/kecamatan',
      body: {
        kabupatenCode: this.area.kabupatenKota,
        provinsiCode: this.area.provinsi
      },
      headers: { 'Content-Type': 'application/json' }
    });
  },

  // PATCH: Use POST with body for desa/kelurahan fetch
  fetchDesa() {
    if (!this.area.kabupatenKota || !this.area.provinsi || !this.area.kecamatan) return Promise.resolve([]);
    return m.request({
      method: 'POST',
      url: '/api/kelurahan',
      body: {
        provinsiCode: this.area.provinsi,
        kabupatenCode: this.area.kabupatenKota,
        kecamatanCode: this.area.kecamatan
      },
      headers: { 'Content-Type': 'application/json' }
    });
  },

  renderCalegInfoBox() {
    if (!this.calegName) return null;
    return m('div', { style: { marginBottom: '1rem', background: '#f5f5f5', padding: '0.75rem', borderRadius: '6px', textAlign: 'center' } },
      m('strong', `Caleg: ${this.calegName}`)
    );
  },

  renderEditModal() {
    if (!this.isEditModalOpen) return null;
    // You can customize the modal content as needed
    return m('dialog', { open: true }, [
      m('article', [
        m('header', [
          m('a.close', {
            href: '#', 'aria-label': 'Close',
            onclick: (e) => { e.preventDefault(); this.isEditModalOpen = false; m.redraw(); }
          })
        ]),
        m('div', 'Edit form/modal content here...')
      ])
    ]);
  },

  renderPhotoModal() {
    if (!this.isModalOpen) return null;
    
    return m('dialog', { open: true }, [
      m('article', [
        m('header', [
          m('a.close', {
            href: '#', 'aria-label': 'Close',
            onclick: (e) => { e.preventDefault(); this.isModalOpen = false; m.redraw(); }
          })
        ]),
        m('div', { style: { textAlign: 'center' } }, [
          m('img', { 
            src: this.modalImageUrl, 
            style: { maxWidth: '100%', maxHeight: '70vh' },
            alt: 'Bukti Foto',
            onerror: (e) => {
              e.target.parentNode.innerHTML = '<p class="error">Gagal memuat gambar</p>';
            }
          })
        ])
      ])
    ]);
  },

  openEditModal(submissionId) {
    this.isEditModalOpen = true;
    this.editingSubmissionId = submissionId;
    m.redraw();
  },

  async openPhotoModal(submissionId, photoUrl = null) {
    this.isModalOpen = true;
    
    if (photoUrl) {
      // Use the provided URL if available
      this.modalImageUrl = photoUrl;
    } else {
      // Otherwise fetch it
      const fetchedUrl = await this.fetchPhotoData(submissionId);
      this.modalImageUrl = fetchedUrl || `/api/submissions/photo/${submissionId}`;
    }
    
    m.redraw();
  },

  // Add this new method to fetch photo data properly
  async fetchPhotoData(submissionId) {
    const response = await apiRequest({
      method: 'POST',
      url: '/api/photo',
      body: { id: submissionId },
      headers: { 'Content-Type': 'application/json' },
      extract: true
    });
    
    // Create a blob URL from the response
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  },

  view() {
    // Get user from localStorage to check role
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isAdmin = user.role === 'admin';

    if (this.loading) {
      return m('main.container', m('p', i18n.loading));
    }

    if (this.error && !this.loadingDesa) {
      return m('main.container', [
        m('h2', i18n.dashboard),
        m('p.error', this.error),
        isAdmin && m('button', { onclick: () => {m.route.set('/app/admin')}, style: { marginRight: '1rem' } , }, 'Ke Halaman Admin'),
        m('button', { onclick: logout }, i18n.logout)
      ]);
    }

    if (!this.area || !this.area.kabupatenKota) {
      return m('main.container', [
        m('h2', i18n.dashboard),
        m('p', 'Area belum diatur oleh admin.'),
        isAdmin && m('button', { onclick: () => {m.route.set('/app/admin')}, style: { marginRight: '1rem' } }, 'Ke Halaman Admin'),
        m('button', { onclick: logout }, i18n.logout)
      ]);
    }

    if (this.selectedKecamatan && this.selectedDesa) {
      // Show submission form
      return m('main.container', [
        m('h4', { style: { marginTop: 'var(--spacing)' } }, 'Data Terkirim di Desa Ini'),
        this.loadingSubmissions
          ? m('p', i18n.loading)
          : this.userSubmissions.length > 0 ?
            m('table', { role: 'grid' }, [
              m('thead', m('tr', [
                m('th', 'TPS'),
                m('th', 'Suara'),
                m('th', 'Foto'),
                m('th', 'GPS'),
                m('th', '')
              ])),
              m('tbody', this.userSubmissions.map(s => m('tr', [
                m('td', s.tpsNumber),
                m('td', s.votes),
                m('td', 
                  m('div', { 
                    style: { 
                      width: '40px', 
                      height: '40px', 
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center' 
                    },
                    onclick: async () => {
                      const photoUrl = await this.fetchPhotoData(s._id);
                      if (photoUrl) {
                        this.openPhotoModal(s._id, photoUrl);
                      } else {
                        alert('Gagal memuat foto');
                      }
                    }
                  }, 
                  s._id ? m('img', { 
                    // Don't use direct URL, but a placeholder that will be replaced with fetchPhotoData
                    src: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
                    style: { maxHeight: '40px', maxWidth: '40px', display: 'none' },
                    alt: 'Bukti Foto',
                    oncreate: async (vnode) => {
                      const photoUrl = await this.fetchPhotoData(s._id);
                      if (photoUrl) {
                        vnode.dom.src = photoUrl;
                        vnode.dom.style.display = 'block';
                      } else {
                        vnode.dom.parentNode.innerHTML = '❌';
                      }
                    }
                  }) : '❌')),
                m('td', s.hasLocation ? '✅' : '❌'),
                m('td', m('button', {
                  class: 'outline secondary',
                  style: {
                    margin: 0, padding: '0.25rem 0.75rem', fontSize: '0.8rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  },
                  onclick: () => this.openEditModal(s._id), title: 'Edit'
                }, '✏️')),
              ])))
            ])
            : m('p', 'Belum ada data yang dikirim untuk desa ini.'),
        m('hr'),
        m('h3', `Input Data untuk ${this.selectedDesa.name}`),
        this.calegName && m('p', { style: { fontStyle: 'italic', textAlign: 'center', marginTop: 'calc(var(--spacing) * -0.5)', marginBottom: 'var(--spacing)' } },
          `(Suara untuk Caleg: ${this.calegName})`),
        m(SubmissionForm, {
          prefill: {
            village: this.selectedDesa.name,
            district: this.selectedKecamatan.name,
            provinsiCode: this.area.provinsi,
            kabupatenKotaCode: this.area.kabupatenKota,
            kecamatanCode: this.selectedKecamatan.code,
            kelurahanDesaCode: this.selectedDesa.code
          },
          onsuccess: () => {
            console.log('SubmissionForm success callback called');
            console.log('About to fetch submissions for desa code:', this.selectedDesa.code);
            // Add a small delay to ensure data is committed to database
            setTimeout(() => {
              this.fetchUserSubmissions(this.selectedDesa.code);
            }, 500);
          }
        }),
        m('footer', { style: { paddingTop: 'var(--spacing)' } },
          m('.grid',
            m('button', { class: 'secondary', onclick: () => this.backToDesaList() }, 'Kembali ke Daftar Desa'),
            m('button', { class: 'contrast', onclick: logout }, i18n.logout),
          ), this.renderEditModal()),
        this.renderPhotoModal()
      ]);
    }

    if (this.selectedKecamatan) {
      // Show desa/kelurahan cards
      return m('main.container', [
        m('h2', i18n.dashboard),
        this.renderCalegInfoBox(),
        m('h3', `Pilih Desa/Kelurahan di Kecamatan ${this.selectedKecamatan.name}`),
        this.loadingDesa
          ? m('p', i18n.loading)
          : m('.grid', { style: { gridTemplateColumns: 'repeat(auto-fit, minmax(12rem, 1fr))' } }, this.desaList.map(d =>
            m('article', {
              onclick: () => this.selectDesa(d), style: cardStyle
            },
              m('h3', { style: cardHeaderStyle }, d.name))
          )
          ),
        this.error && m('p.error', this.error),
        m('footer', { style: { paddingTop: 'var(--spacing)' } },
          m('.grid',
            m('button', { class: 'secondary', onclick: () => this.backToKecamatanList() }, 'Kembali ke Daftar Kecamatan'),
            m('button', { class: 'contrast', onclick: logout }, i18n.logout)
          ))
      ]);
    }

    // Show kecamatan cards, but disable selection if calegName is not set
    return m('main.container', [
      m('h2', i18n.dashboard),
      this.renderCalegInfoBox(),
      m('h3', 'Pilih Kecamatan'),
      !this.calegName && m('p', { style: { color: 'var(--pico-color-red-500)', fontWeight: 500, marginBottom: '1rem' } }, 'Nama caleg belum diatur. Silakan hubungi admin.'),
      m('.grid', { style: { gridTemplateColumns: 'repeat(auto-fit, minmax(12rem, 1fr))' } }, this.kecamatanList.map(k =>
        m('article', {
          onclick: this.calegName ? () => this.selectKecamatan(k) : null,
          style: Object.assign({}, cardStyle, !this.calegName ? { opacity: 0.5, pointerEvents: 'none', cursor: 'not-allowed' } : {})
        },
          m('h3', { style: cardHeaderStyle }, k.name))
      )
      ),
      m('footer', { style: { paddingTop: 'var(--spacing)' } },
        [
          isAdmin && m('button', { style: { marginRight: '1rem' },onclick: () => m.route.set('/app/admin') }, 'Ke Halaman Admin'), 
          m('button', {  class: 'contrast', onclick: logout }, i18n.logout),
        ]
      )
    ]);
  }
};
