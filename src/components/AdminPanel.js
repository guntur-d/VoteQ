
import CalegSetting from './CalegSetting.js';
import AreaSetting from './AreaSetting.js';
import { i18n } from '../i18n.js';
import { apiRequest, logout } from '../utils.js';

const actionButtonStyle = {
  margin: 0,
  padding: '0.25rem 0.75rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

export default {
  submissions: [],
  unverifiedUsers: [],
  kecamatanSummary: [],
  kecamatanList: [],
  desaList: [],
  areaSetting: null,
  viewMode: 'all', // 'all', 'byKecamatan', 'byDesa'
  selectedKecamatanCode: '',
  selectedDesaCode: '',
  totalVotes: 0,
  hasSubmissions: false,
  loading: true,
  error: '',

  buildSummary(submissions) {
    const summaryMap = new Map();
    submissions.forEach(s => {
      // Ensure we have a kecamatanCode to group by
      if (s.kecamatanCode) {
        const key = s.kecamatanCode;
        if (!summaryMap.has(key)) {
          summaryMap.set(key, {
            kecamatanCode: s.kecamatanCode,
            kecamatanName: s.district || 'N/A', // Fallback for name
            totalVotes: 0
          });
        }
        summaryMap.get(key).totalVotes += (Number(s.votes) || 0);
      }
    });
    return Array.from(summaryMap.values());
  },

  async oninit() {
    this.loading = true;
    this.error = '';
    try {
      // To ensure summary accuracy, we fetch all approved submissions and aggregate on the client.
      // This bypasses a potential backend issue of grouping by non-unique names.
      const [areaSetting, unverifiedUsers, allApprovedSubmissionsRes] = await Promise.all([
        apiRequest({ url: '/api/admin/area-setting' }),
        apiRequest({ method: 'GET', url: '/api/admin/unverified-users' }),
        // Fetch all approved submissions. A high limit is used as a substitute for pagination-less fetching.
        apiRequest({ method: 'GET', url: '/api/admin/submissions?approved=true&limit=99999' })
      ]);

      this.areaSetting = areaSetting;
      this.unverifiedUsers = unverifiedUsers;
      this.kecamatanSummary = this.buildSummary(allApprovedSubmissionsRes.submissions);

      // Check if there are any submissions with approved votes.
      const grandTotal = this.kecamatanSummary.reduce((sum, s) => sum + (Number(s.totalVotes) || 0), 0);
      this.hasSubmissions = grandTotal > 0;

      if (this.areaSetting && this.areaSetting.provinsi && this.areaSetting.kabupatenKota) {
        this.kecamatanList = await apiRequest({
          url: `/api/kecamatan?kabupatenCode=${this.areaSetting.kabupatenKota}&provinsiCode=${this.areaSetting.provinsi}`
        });
      }

      // Initial fetch for submissions
      await this.fetchSubmissions();
    } catch (e) {
      this.error = e.response?.error || 'Gagal memuat data admin.';
      if (e.code === 401 || e.code === 403) {
        logout();
      }
    } finally {
      this.loading = false;
      m.redraw();
    }
  },

  async fetchSubmissions() {
    // A separate loading state for the table could be used for better UX, but this is fine for now.
    this.loading = true;
    m.redraw();

    const params = new URLSearchParams();
    if (this.viewMode === 'byDesa') {
      if (this.selectedKecamatanCode) params.append('kecamatanCode', this.selectedKecamatanCode);
      if (this.selectedDesaCode) params.append('kelurahanDesaCode', this.selectedDesaCode);
    }

    try {
      const res = await apiRequest({
        url: `/api/admin/submissions?${params.toString()}`
      });
      console.log('[Frontend] Received from fetchSubmissions:', res);
      // Sanitize votes to be a number before assigning to the component state.
      res.submissions.forEach(s => {
        s.votes = Number(s.votes) || 0;
      });

      this.submissions = res.submissions;
      this.totalVotes = res.totalApprovedVotes;
    } catch (e) {
      this.error = 'Gagal memuat data masuk.';
    } finally {
      this.loading = false;
      m.redraw();
    }
  },

  view() {
    if (this.loading) {
      return m('main.container', m('p', i18n.loading));
    }

    if (this.error) {
      return m('main.container', [
        m('h2', i18n.adminPanel),
        m('p.error', this.error),
        m('button', { onclick: logout }, i18n.logout)
      ]);
    }

    return m('main.container', [
      m('h2', i18n.adminPanel),
      m('a', { href: '/#!/app/dashboard' }, i18n.backToDashboard),
      m('hr'),

      // Unverified users section
      m('section', [
        m('h3', i18n.unverifiedUsers || 'Pengguna Belum Diverifikasi'),
        this.unverifiedUsers.length === 0
          ? m('p', i18n.noUnverifiedUsers || 'Tidak ada pengguna baru yang menunggu verifikasi.')
          : m('ul',
            this.unverifiedUsers.map(u =>
              m('li', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' } }, [
                m('span', `${u.name || u.email} (${u.email})`),
                m('button', { class: 'primary', style: { margin: 0 }, onclick: () => this.verifyUser(u._id) }, i18n.verify || 'Verifikasi')
              ])
            ))
      ]),

      // Caleg Setting section
      m(CalegSetting, { hasSubmissions: this.hasSubmissions }),

      // Area Setting section
      m(AreaSetting, { hasSubmissions: this.hasSubmissions }),

      // Submissions section
      m('section', [
        m('h3', { style: { marginTop: 'var(--spacing)' } }, i18n.submissions || 'Data Masuk'),

        m('fieldset', { style: { paddingBottom: 'var(--spacing)' } }, [
          m('legend', 'Filter Tampilan'),
          m('.grid', [
            m('div', [
              m('label', { for: 'view-mode' }, 'Tampilkan Data'),
              m('select', { id: 'view-mode', onchange: e => this.handleViewModeChange(e.target.value), value: this.viewMode }, [
                m('option', { value: 'all' }, 'Semua Data Masuk'),
                m('option', { value: 'byKecamatan' }, 'Total Suara per Kecamatan'),
                m('option', { value: 'byDesa' }, 'Filter per Desa')
              ])
            ]),
            this.viewMode === 'byDesa' ? m('div', [
              m('label', { for: 'kecamatan-filter' }, 'Pilih Kecamatan'),
              m('select', { id: 'kecamatan-filter', onchange: e => this.handleKecamatanChange(e.target.value), value: this.selectedKecamatanCode }, [
                m('option', { value: '' }, 'Semua Kecamatan'),
                this.kecamatanList.map(k => m('option', { value: k.code }, k.name))
              ])
            ]) : null,
            (this.viewMode === 'byDesa' && this.selectedKecamatanCode) ? m('div', [
              m('label', { for: 'desa-filter' }, 'Pilih Desa'),
              m('select', { id: 'desa-filter', onchange: e => this.handleDesaChange(e.target.value), value: this.selectedDesaCode, disabled: this.desaList.length === 0 }, [
                m('option', { value: '' }, 'Semua Desa di Kecamatan ini'),
                this.desaList.map(d => m('option', { value: d.code }, d.name))
              ])
            ]) : null
          ])
        ]),

        this.viewMode === 'byKecamatan'
          ? this.renderKecamatanSummaryTable()
          : this.renderSubmissionsTable()
      ]),

      m('footer', { style: { marginTop: 'var(--spacing)' } },
        m('button', { class: 'contrast', onclick: logout }, i18n.logout)
      )
    ]);
  },

  renderKecamatanSummaryTable() {
    // Create a Set of valid kecamatan codes for the current area for efficient lookup.
    const validKecamatanCodes = new Set(this.kecamatanList.map(k => k.code));
    console.log('[Frontend] Valid kecamatan codes for area:', validKecamatanCodes);

    // Filter the summary data to only include kecamatans that are in the current area setting.
    // This is a client-side fix for a backend issue where the summary might include data from outside the area.
    // Using the code is more robust than matching by name, which can have inconsistencies.
    const filteredSummary = this.kecamatanSummary.filter(s => validKecamatanCodes.has(s.kecamatanCode));
    console.log('[Frontend] Filtered kecamatan summary:', filteredSummary);
    const grandTotal = filteredSummary.reduce((sum, s) => sum + (Number(s.totalVotes) || 0), 0);
    return m('div', { style: { overflowX: 'auto', height: 'auto' } },
      m('table', { role: 'grid' }, [
        m('thead', m('tr', [
          m('th', 'Kecamatan'),
          m('th', { style: { textAlign: 'right' } }, 'Total Suara Sah')
        ])),
        m('tbody', filteredSummary.map(s => m('tr', [
          m('td', s.kecamatanName),
          m('td', { style: { textAlign: 'right' } }, (s.totalVotes || 0).toLocaleString('id-ID'))
        ]))),
        m('tfoot', m('tr', [
          m('th', { style: { textAlign: 'right' } }, 'Grand Total:'),
          m('th', { style: { textAlign: 'right' } }, grandTotal.toLocaleString('id-ID'))
        ]))
      ])
    );
  },

  renderSubmissionsTable() {
    // This value now comes directly from the backend for the current filter
    const totalApprovedVotes = this.totalVotes;

    // Calculate subtotal for unapproved votes currently visible in the table
    const unapprovedVotesSubtotal = this.submissions
      .filter(s => !s.approved)
      .reduce((sum, s) => sum + (s.votes || 0), 0);

    return m('div', { style: { overflowX: 'auto', height: 'auto' } },
      m('table', { role: 'grid' }, [
        m('thead', m('tr', [
          m('th', 'Kecamatan'),
          m('th', 'Desa'),
          m('th', 'TPS'),
          m('th', { style: { textAlign: 'right' } }, 'Suara'),
          m('th', 'Status'),
          m('th', 'GPS'),
          m('th', 'Aksi')
        ])),
        m('tbody', this.submissions.map(s => m('tr', { key: s._id }, [
          m('td', { style: { verticalAlign: 'middle' } }, s.district),
          m('td', { style: { verticalAlign: 'middle' } }, s.village),
          m('td', { style: { verticalAlign: 'middle' } }, s.tpsNumber),
          m('td', { style: { verticalAlign: 'middle', textAlign: 'right' } }, s.votes),
          m('td', { style: { verticalAlign: 'middle', textAlign: 'center' } }, [
            s.approved ? m('span', { title: i18n.approve }, '✅ ') : '',
            s.flagged ? m('span', { title: i18n.flag }, '🚩') : ''
          ]),
          m('td', { style: { verticalAlign: 'middle', textAlign: 'center' } },
            (s.location && s.location.coordinates && s.location.coordinates.length === 2)
              ? m('a', {
                href: `https://www.google.com/maps?q=${s.location.coordinates[1]},${s.location.coordinates[0]}`,
                target: '_blank', title: 'Lihat di Peta'
              }, '📍')
              : 'N/A'
          ),
          m('td', { style: { verticalAlign: 'middle' } }, m('.grid', [
            m('button', { class: 'secondary outline', style: actionButtonStyle, onclick: () => m.route.set(`/app/submit/${s._id}`), title: 'Edit' }, '✏️'),
            !s.approved && m('button', { style: actionButtonStyle, onclick: () => this.approve(s._id), title: i18n.approve }, '✅'),
            !s.flagged && m('button', { class: 'contrast', style: actionButtonStyle, onclick: () => this.flag(s._id), title: i18n.flag }, '🚩')
          ]))
        ]))),
        m('tfoot', [
          m('tr', [
            m('th', { colspan: 3, style: { textAlign: 'right', fontWeight: 'normal' } }, 'Subtotal Suara Belum Disetujui (tampilan ini):'),
            m('th', { style: { textAlign: 'right', fontWeight: 'normal' } }, unapprovedVotesSubtotal.toLocaleString('id-ID')),
            m('td', { colspan: 3 }) // Empty cells for the remaining columns
          ]),
          m('tr', [
            m('th', { colspan: 3, style: { textAlign: 'right' } }, 'Total Suara Sah:'),
            m('th', { style: { textAlign: 'right' } }, totalApprovedVotes.toLocaleString('id-ID')),
            m('td', { colspan: 3 }) // Empty cells for the remaining columns
          ])
        ])
      ])
    );
  },

  handleViewModeChange(mode) {
    this.viewMode = mode;
    this.selectedKecamatanCode = '';
    this.selectedDesaCode = '';
    this.desaList = [];
    if (mode !== 'byKecamatan') {
      this.fetchSubmissions();
    }
  },

  async handleKecamatanChange(kecamatanCode) {
    this.selectedKecamatanCode = kecamatanCode;
    this.selectedDesaCode = '';
    this.desaList = [];
    this.fetchSubmissions(); // Filter by kecamatan immediately

    if (!kecamatanCode) return;

    try {
      const { provinsi, kabupatenKota } = this.areaSetting;
      this.desaList = await apiRequest({
        url: `/api/kelurahan_desa?provinsiCode=${provinsi}&kabupatenCode=${kabupatenKota}&kecamatanCode=${kecamatanCode}`
      });
    } catch (e) {
      this.error = 'Gagal memuat daftar desa.';
    } finally {
      m.redraw();
    }
  },

  handleDesaChange(desaCode) {
    this.selectedDesaCode = desaCode;
    this.fetchSubmissions();
  },

  async approve(id) {
    try {
      console.log(`[Frontend] Approving submission ID: ${id}`);
      await apiRequest({ method: 'POST', url: `/api/admin/approve/${id}` });
      // To ensure data consistency, we refetch everything from the backend,
      // which is the single source of truth for calculations.
      await this.fetchSubmissions();
      this.kecamatanSummary = await apiRequest({ method: 'GET', url: '/api/admin/summary/by-kecamatan' });
      // Re-evaluate after approval
      const grandTotal = this.kecamatanSummary.reduce((sum, s) => sum + (Number(s.totalVotes) || 0), 0);
      this.hasSubmissions = grandTotal > 0;

      m.redraw();
    } catch (e) {
      alert('Gagal menyetujui data. Silakan coba lagi.');
    }
  },

  async flag(id) {
    await apiRequest({ method: 'POST', url: `/api/admin/flag/${id}` });
    const submission = this.submissions.find(s => s._id === id);
    if (submission) submission.flagged = true;
    m.redraw();
  },

  async verifyUser(id) {
    await apiRequest({ method: 'POST', url: `/api/admin/verify-user/${id}` });
    this.unverifiedUsers = this.unverifiedUsers.filter(u => u._id !== id);
    m.redraw();
  }
};
