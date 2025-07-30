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

      if (this.area && this.area.kabupatenKota && this.area.provinsi) {
        // Fetch kecamatan for this kabupaten and provinsi
        this.kecamatanList = await apiRequest({
          method: 'GET',
          url: `/api/kecamatan?kabupatenCode=${this.area.kabupatenKota}&provinsiCode=${this.area.provinsi}`,
        });
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
    this.loadingSubmissions = true;
    this.userSubmissions = [];
    m.redraw();
    try {
      this.userSubmissions = await apiRequest({
        method: 'GET',
        url: `/api/submissions/mine?kelurahanDesaCode=${desaCode}`
      });
    } catch (e) {
      // Non-critical error, maybe just log it or show a small message
      console.error("Could not fetch user's submissions", e);
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

  renderCalegInfoBox() {
    if (!this.calegName) return null;

    return m('article', {
      style: {
        marginBottom: 'var(--spacing)',
        padding: 'var(--spacing)',
        backgroundColor: 'var(--pico-primary-background)',
        borderLeft: '4px solid var(--pico-primary)'
      }
    }, m('p', { style: { margin: 0, textAlign: 'center', color:"white" } }, [
      'Anda mengumpulkan suara untuk Caleg:',
      m('br'),
      m('strong', { style: { fontSize: '1.2rem' } }, this.calegName)
    ]));
  },

  view() {
    if (this.loading) {
      return m('main.container', m('p', i18n.loading));
    }

    if (this.error && !this.loadingDesa) {
      return m('main.container', [
        m('h2', i18n.dashboard),
        m('p.error', this.error),
        m('button', { onclick: logout }, i18n.logout)
      ]);
    }

    if (!this.area || !this.area.kabupatenKota) {
      return m('main.container', [
        m('h2', i18n.dashboard),
        m('p', 'Area belum diatur oleh admin.'),
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
                m('td', s.hasPhoto ? '✅' : '❌'),
                m('td', s.hasLocation ? '✅' : '❌'),
                m('td', m('button', {
                  class: 'outline secondary',
                  style: {
                    margin: 0, padding: '0.25rem 0.75rem', fontSize: '0.8rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  },
                  onclick: () => m.route.set(`/app/submit/${s._id}`), title: 'Edit'
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
          hideFields: ['village', 'district'],
          onsuccess: () => {
            this.fetchUserSubmissions(this.selectedDesa.code);
          }
        }),
        m('footer', { style: { paddingTop: 'var(--spacing)' } },
          m('.grid',
            m('button', { class: 'secondary', onclick: () => this.backToDesaList() }, 'Kembali ke Daftar Desa'),
            m('button', { class: 'contrast', onclick: logout }, i18n.logout)
          ))
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
                onclick: () => this.selectDesa(d), style: cardStyle },
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

    // Show kecamatan cards
    return m('main.container', [
      m('h2', i18n.dashboard),
      this.renderCalegInfoBox(),
      m('h3', 'Pilih Kecamatan'),
      m('.grid', { style: { gridTemplateColumns: 'repeat(auto-fit, minmax(12rem, 1fr))' } }, this.kecamatanList.map(k =>
          m('article', {
            onclick: () => this.selectKecamatan(k), style: cardStyle },
            m('h3', { style: cardHeaderStyle }, k.name))
        )
      ),
      m('footer', { style: { paddingTop: 'var(--spacing)' } },
        m('button', { class: 'contrast', onclick: logout }, i18n.logout)
      )
    ]);
  }
};
