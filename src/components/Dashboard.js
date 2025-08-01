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
        apiRequest({ method: 'GET', url: '/api/admin/area-setting' }),
        apiRequest({ method: 'GET', url: '/api/caleg' }).catch(() => ({})) // Don't fail if caleg isn't set
      ]);

      this.area = area;
      if (calegData && calegData.name) {
        this.calegName = calegData.name;
      }

      if (this.area && this.area.kabupatenKota && this.area.provinsi && this.calegName) {
        // Fetch kecamatan for this kabupaten and provinsi, only if calegName is set
        this.kecamatanList = await apiRequest({
          method: 'GET',
          url: `/api/kecamatan?kabupatenCode=${this.area.kabupatenKota}&provinsiCode=${this.area.provinsi}`,
        });
      } else {
        // Prevent loading kecamatan if area setting or calegName is not set
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
      // Prevent selecting kecamatan if calegName is not set
      return;
    }
    this.selectedKecamatan = kecamatan;
    this.desaList = [];
    this.loadingDesa = true;
    this.error = '';
    m.redraw();

    try {
      const { provinsi, kabupatenKota } = this.area;
      this.desaList = await apiRequest({
        method: 'GET',
        url: `/api/kelurahan_desa?provinsiCode=${provinsi}&kabupatenCode=${kabupatenKota}&kecamatanCode=${kecamatan.code}`
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
      // Try both filtering approaches - by names and by codes
      // The backend only needs the kelurahanDesaCode for this query.
      const url = `/api/submissions/mine?kelurahanDesaCode=${desaCode}`;
      console.log('Fetching from URL:', url);
      
      const response = await apiRequest({
        method: 'GET',
        url: url
      });
      
      console.log('Backend response:', response);
      console.log('Response type:', typeof response);
      console.log('Response length:', Array.isArray(response) ? response.length : 'Not an array');
      
      this.userSubmissions = response || [];
      console.log('userSubmissions set to:', this.userSubmissions);
    } catch (e) {
      // Non-critical error, maybe just log it or show a small message
      console.error("Could not fetch user's submissions", e);
      console.error("Error details:", e.response);
      this.userSubmissions = [];
    } finally {
      this.loadingSubmissions = false;
      m.redraw();
    }
  },

  backToKecamatanList() {
    this.selectedKecamatan = null;
    this.selectedDesa = null;
    this.desaList = [];
    this.error = '';
  },

  backToDesaList() {
    this.userSubmissions = [];
    this.selectedDesa = null;
  },

  openPhotoModal(submissionId) {
    this.isModalOpen = true;
    this.modalImageUrl = `/api/submissions/photo/${submissionId}`;
  },

  closePhotoModal() {
    this.isModalOpen = false;
    this.modalImageUrl = '';
  },

  renderPhotoModal() {
    if (!this.isModalOpen) return null;
    return m('dialog', { open: true }, [
      m('article', [
        m('header', 
          m('a.close', { 
            href: '#', 'aria-label': 'Close', 
            onclick: (e) => { e.preventDefault(); this.closePhotoModal(); } 
          })
        ),
        m('img', { src: this.modalImageUrl, alt: 'Full-size submission photo', style: { maxWidth: '100%' } }),
      ])
    ]);
  },

  openEditModal(submissionId) {
    this.editingSubmissionId = submissionId;
    this.isEditModalOpen = true;
  },

  closeEditModal() {
    this.isEditModalOpen = false;
    this.editingSubmissionId = null;
    m.redraw();
  },

  renderEditModal() {
    if (!this.isEditModalOpen) return null;

    return m('dialog', { open: true }, [
      m('article', [
        m('header',
          m('a.close', {
            href: '#', 'aria-label': 'Close',
            onclick: (e) => { e.preventDefault(); this.closeEditModal(); }
          })
        ),
        m(SubmissionForm, {
          id: this.editingSubmissionId,
          onsuccess: () => {
            this.closeEditModal();
            this.fetchUserSubmissions(this.selectedDesa.code);
          }
        })
      ])
    ]);
  },

  renderCalegInfoBox() {
    if (!this.calegName) return null;

    return m('article', {
      style: {
        marginBottom: 'var(--spacing)',
        padding: 'var(--spacing)',
        backgroundColor: 'var(--pico-primary-background)',
        borderLeft: '4px solid var(--pico-primary)'
      }
    }, m('p', { style: { margin: 0, textAlign: 'center', color: "white" } }, [
      'Anda mengumpulkan suara untuk Caleg:',
      m('br'),
      m('strong', { style: { fontSize: '1.2rem' } }, this.calegName)
    ]));
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
        isAdmin && m('button', { onclick: () => m.route.set('/app/admin') }, 'Ke Halaman Admin'),
        m('button', { onclick: logout }, i18n.logout)
      ]);
    }

    if (!this.area || !this.area.kabupatenKota) {
      return m('main.container', [
        m('h2', i18n.dashboard),
        m('p', 'Area belum diatur oleh admin.'),
        isAdmin && m('button', { onclick: () => m.route.set('/app/admin') }, 'Ke Halaman Admin'),
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
                m('td', s.hasPhoto 
                  ? m('img', { 
                      src: `/api/submissions/photo/${s._id}`, 
                      style: { maxHeight: '40px', maxWidth: '40px', display: 'block', cursor: 'pointer' },
                      alt: 'Bukti Foto',
                      onclick: () => this.openPhotoModal(s._id),
                      onerror: (e) => {
                        e.target.style.display = 'none';
                        e.target.parentNode.appendChild(document.createTextNode('❌'));
                      }
                    }) : '❌'),
                m('td', s.hasLocation ? '✅' : '❌'),
                m('td', m('button', {
                  class: 'outline secondary',
                  style: {
                    margin: 0, padding: '0.25rem 0.75rem', fontSize: '0.8rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  },
                  onclick: () => this.openEditModal(s._id), title: 'Edit'
                }, '✏️'))
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
