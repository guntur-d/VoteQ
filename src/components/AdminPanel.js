// src/components/AdminPanel.js
import { i18n } from '../i18n.js';
import AreaSetting from './AreaSetting.js';
import CalegSetting from './CalegSetting.js';
import SubmissionForm from './SubmissionForm.js';

export default {
  currentView: 'dashboard',
  unverifiedUsers: [],
  allSubmissions: [], // Holds all submissions for summary and filtering
  voteSummary: {
    byKabupaten: {},
    byKecamatan: {},
    byDesa: {}
  },
  // Add filter state
  filters: {
    selectedKabupaten: 'all',
    selectedKecamatan: 'all',
    selectedDesa: 'all'
  },
  availableOptions: {
    kabupaten: [],
    kecamatan: [],
    desa: []
  },
  // Pagination state
  currentPage: 1,
  itemsPerPage: 20, // You can adjust this value
  totalPages: 1,
  // Granular loading states
  loading: {
    initial: true,
    users: false,
    submissions: false,
    summary: false
  },
  error: '',
  isMapModalOpen: false,
  mapModalUrl: '',
  // New state for summary table and details modal
  summaryFilterLevel: 'all', // 'all', 'kecamatan', 'desa'
  summaryFilterKecamatan: 'all', // kecamatan name for desa filtering
  isDetailsModalOpen: false,
  detailsModalTitle: '',
  submissionsForModal: [],
  // Add state for edit modal
  isEditModalOpen: false, 
  editingSubmission: null, // Will hold the full submission object
  
  // Add loading states for individual submissions
  submissionLoadingStates: {}, // Will track loading state for each submission ID
  
  // Add area data for displaying names instead of codes
  areaData: {
    kecamatanList: [],
    desaList: []
  },
    
  oninit() {
    this.checkAdminAccess();
  },
    
checkAdminAccess() {
  const token = localStorage.getItem('token');
  if (!token) {
    m.route.set('/app/login');
    return;
  }

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (!user || user.role !== 'admin') {
    m.route.set('/app/dashboard');
    return;
  }

  // Optional: Add token expiration check here if JWT has exp claim
  this.loadDashboardData();
},
    
  async loadDashboardData() {
    this.loading.initial = true;
    this.error = '';
    m.redraw();
    try {
      // Wait for all data to be fetched in parallel before processing.
      const [users, submissions, areaData] = await Promise.all([
        this.loadUnverifiedUsers(),
        this.loadSubmissions(),
        this.loadAreaData()
      ]);

      this.unverifiedUsers = users || [];
      this.allSubmissions = submissions || [];
      this.areaData = areaData || { kecamatanList: [], desaList: [] };
      
      this.totalPages = Math.ceil(this.allSubmissions.length / this.itemsPerPage);
      this.calculateVoteSummary(this.allSubmissions);
  } catch (err) {
  this.error = 'Gagal memuat data dashboard.';
  console.error('Error loading initial dashboard data:', err);
  if (err.response) console.error('Response:', err.response);
  if (err.message) console.error('Message:', err.message);
} finally {
      this.loading.initial = false;
      m.redraw();
    }
  },

  async refreshUsers() {
    this.loading.users = true;
    m.redraw();
    try {
      this.unverifiedUsers = await this.loadUnverifiedUsers();
    } catch (err) {
      this.error = 'Gagal memuat pengguna.';
    } finally {
      this.loading.users = false;
      m.redraw();
    }
  },

  async refreshSubmissionsAndSummary() {
    this.loading.submissions = true;
    this.loading.summary = true; // Both sections use this data
    m.redraw();
    try {
      this.allSubmissions = await this.loadSubmissions();
      this.totalPages = Math.ceil(this.allSubmissions.length / this.itemsPerPage);
      this.calculateVoteSummary(this.allSubmissions);
    } catch (err) {
      this.error = 'Gagal memuat data submission.';
    } finally {
      this.loading.submissions = false;
      this.loading.summary = false;
      m.redraw();
    }
  },

  // New method to load area data (kecamatan and desa names)
async loadAreaData() {
  try {
    const areaSetting = await m.request({
      method: 'GET',
      url: '/api/admin/area-setting',
      headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
    });

    if (areaSetting && areaSetting.kabupatenKota) {
      try {
        const [kecamatanList, desaList] = await Promise.all([
          m.request({
            method: 'GET',
            url: `/api/kecamatan?kabupatenCode=${areaSetting.kabupatenKota}&provinsiCode=${areaSetting.provinsi}`
          }),
          m.request({
            method: 'GET',
            url: `/api/kelurahan_desa?kabupatenCode=${areaSetting.kabupatenKota}&provinsiCode=${areaSetting.provinsi}`
          })
        ]);
        return { kecamatanList, desaList };
      } catch (apiErr) {
        console.warn('Failed to load kecamatan/desa:', apiErr);
        // Return empty lists instead of failing entirely
        return { kecamatanList: [], desaList: [] };
      }
    }
  } catch (err) {
    console.error('Error loading area setting:', err);
  }
  return { kecamatanList: [], desaList: [] };
},

  loadUnverifiedUsers() {
    return m.request({
      method: 'GET',
      url: '/api/admin/unverified-users',
      headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
    });
  },
    
  loadSubmissions() {
    // Fetch all submissions for admin
    return m.request({
      method: 'GET',
      url: '/api/admin/submissions',
      headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
    });
  },

  // Centralized helper to resolve area names consistently
  _getResolvedAreaName(type, sub) {
    if (type === 'kecamatan') {
      const code = sub.kecamatanCode;
      if (!code) return sub.district || 'N/A'; // Handle missing code
      const fromApi = this.areaData.kecamatanList.find(k => k.code === code);
      if (fromApi) return fromApi.name;
      // Fallback logic
      return sub.district || this.getKecamatanName(code) || code || 'N/A';
    }
    if (type === 'desa') {
      const code = sub.kelurahanDesaCode;
      if (!code) return sub.village || 'N/A'; // Handle missing code
      const fromApi = this.areaData.desaList.find(d => d.code === code);
      if (fromApi) return fromApi.name;
      // Fallback logic
      return sub.village || this.getDesaName(code) || code
    }
    return 'N/A';
  },

  calculateVoteSummary(submissions) {
    const byKecamatan = {};
    const byDesa = {};
        
    submissions.forEach(sub => {
      const kecName = this._getResolvedAreaName('kecamatan', sub);
      const desaName = this._getResolvedAreaName('desa', sub);
            
      // Group by Kecamatan (using name as key)
      if (!byKecamatan[kecName]) {
        byKecamatan[kecName] = { 
          calegVotes: 0, 
          totalVotes: 0, 
          submissions: 0,
          kecamatanName: kecName
        };
      }
      byKecamatan[kecName].submissions += 1; 
      // Only add votes if the submission is approved
      if (sub.status === 'approved') {
        byKecamatan[kecName].calegVotes += parseInt(sub.calegVotes) || 0;
        byKecamatan[kecName].totalVotes += parseInt(sub.totalVotes || sub.votes) || 0;
      }
            
      // Group by Desa (using name as key)
      const desaKey = `${kecName}-${desaName}`;
      if (!byDesa[desaKey]) {
        byDesa[desaKey] = { 
          calegVotes: 0, 
          totalVotes: 0, 
          submissions: 0,
          kecamatanName: kecName,
          desaName: desaName
        };
      }
      byDesa[desaKey].submissions += 1; 
      // Only add votes if the submission is approved
      if (sub.status === 'approved') {
        byDesa[desaKey].calegVotes += parseInt(sub.calegVotes) || 0;
        byDesa[desaKey].totalVotes += parseInt(sub.totalVotes || sub.votes) || 0;
      }
    });
        
    // After grouping, derive the available filter options from the summary keys
    const kecamatanSet = new Set(Object.keys(byKecamatan));
    const desaMap = new Map();
    Object.values(byDesa).forEach(desaData => {
      if (!desaMap.has(desaData.kecamatanName)) {
        desaMap.set(desaData.kecamatanName, new Set());
      }
      desaMap.get(desaData.kecamatanName).add(desaData.desaName);
    });

    this.availableOptions = {
      kecamatan: Array.from(kecamatanSet).sort(),
      desa: desaMap
    };
    this.voteSummary = { byKecamatan, byDesa };
    console.log('Vote summary calculated:', this.voteSummary);
    console.log('Available options:', this.availableOptions);
  },

  // Helper methods to convert codes to readable names
  getKecamatanName(code) {
    const kecamatanNames = {
      '010': 'DENPASAR SELATAN',
      '020': 'DENPASAR UTARA', 
      '030': 'DENPASAR BARAT',
      '040': 'DENPASAR TIMUR'
      // Add more mappings as needed
    };
    return kecamatanNames[code];
  },

  getDesaName(code) {
    const desaNames = {
      '001': 'SIDAKARYA', // Corrected based on common regional data
      '002': 'SANUR KAJA', 
      '003': 'SANUR KAUH',
      '004': 'RENON',
      '005': 'SERANGAN',
      '006': 'RENON',
      '007': 'PANJER',
      '008': 'KESIMAN',
      '009': 'KESIMAN KERTALANGU',
      '010': 'KESIMAN PETILAN'
      // Add more mappings as needed
    };
    return desaNames[code];
  },

  // Get filtered data based on current selections
  getFilteredVoteSummary() {
    const { selectedKecamatan, selectedDesa } = this.filters;
        
    let filteredKecamatan = {};
    let filteredDesa = {};
        
    // Filter Kecamatan
    if (selectedKecamatan === 'all') {
      filteredKecamatan = { ...this.voteSummary.byKecamatan };
    } else {
      filteredKecamatan[selectedKecamatan] = this.voteSummary.byKecamatan[selectedKecamatan];
    }
        
    // Filter Desa
    Object.entries(this.voteSummary.byDesa).forEach(([key, data]) => {
      const matchesKecamatan = selectedKecamatan === 'all' || data.kecamatanName === selectedKecamatan;
      const matchesDesa = selectedDesa === 'all' || data.desaName === selectedDesa;
            
      if (matchesKecamatan && matchesDesa) {
        filteredDesa[key] = data;
      }
    });
        
    return {
      byKecamatan: filteredKecamatan,
      byDesa: filteredDesa
    };
  },

  // Get available desa for selected kecamatan
  getAvailableDesa() {
    const kecName = this.filters.selectedKecamatan;
        
    if (kecName === 'all') {
      const allDesa = new Set();
      this.availableOptions.desa.forEach((desaSet) => {
        desaSet.forEach(desa => allDesa.add(desa));
      });
      return Array.from(allDesa).sort();
    } else {
      const desaSet = this.availableOptions.desa.get(kecName);
      return desaSet ? Array.from(desaSet).sort() : [];
    }
  },

  // Handle filter changes
  onKecamatanChange(value) {
    this.filters.selectedKecamatan = value;
    this.filters.selectedDesa = 'all'; // Reset dependent filter
    m.redraw();
  },

  onDesaChange(value) {
    this.filters.selectedDesa = value;
    m.redraw();
  },

  // --- Map Modal Methods ---
  openMapModal(coordinates) {
    if (!coordinates || coordinates.length !== 2) return;
    const [lng, lat] = coordinates;
    this.isMapModalOpen = true;
    // Use a Google Maps embed URL that doesn't require an API key
    this.mapModalUrl = `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`;
    m.redraw();
  },

  closeMapModal() {
    this.isMapModalOpen = false;
    this.mapModalUrl = '';
    m.redraw();
  },

  renderMapModal() {
    if (!this.isMapModalOpen) return null;
    return m('dialog', { open: true, onclick: () => this.closeMapModal() }, [
      m('article', { 
        style: { padding: '0', maxWidth: '800px', width: '90vw' },
        onclick: (e) => e.stopPropagation() // Prevent modal from closing when clicking inside
      }, [
        m('header', { style: { padding: '0.5rem 1rem', display: 'flex', justifyContent: 'flex-end' } },
          m('a.close', { href: '#', 'aria-label': 'Close', onclick: (e) => { e.preventDefault(); this.closeMapModal(); } })
        ),
        m('div', { style: { padding: '0 1rem 1rem 1rem' } },
          m('iframe', {
            src: this.mapModalUrl,
            width: '100%', height: '500', style: { border: 0, display: 'block' },
            allowfullscreen: '', loading: 'lazy', referrerpolicy: 'no-referrer-when-downgrade'
          })
        )
      ])
    ]);
  },

  renderStatsCards() {
    const filteredSummary = this.getFilteredVoteSummary();
    
    const totalCalegVotes = Object.values(filteredSummary.byKecamatan)
      .reduce((sum, data) => sum + data.calegVotes, 0);
    const totalSahVotes = Object.values(filteredSummary.byKecamatan)
      .reduce((sum, data) => sum + data.totalVotes, 0);

    return m('section.grid', [
      m('article', [
        m('h4', 'Pengguna Belum Terverifikasi'),
        m('h2', this.unverifiedUsers.length)
      ]),
      m('article', [
        m('h4', 'Total Submission'),
        m('h2', this.allSubmissions.length)
      ]),
      m('article', [
        m('h4', 'Total Suara Caleg'),
        m('h2', { style: { color: '#2563eb' } }, totalCalegVotes.toLocaleString('id-ID'))
      ]),
      m('article', [
        m('h4', 'Total Suara Sah'),
        m('h2', { style: { color: '#059669' } }, totalSahVotes.toLocaleString('id-ID'))
      ])
    ]);
  },

  renderUnverifiedUsersSection() {
    return m('section', [
      m('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' } }, [
        m('h4', { style: { margin: 0 } }, 'Pengguna Belum Terverifikasi'),
        m('button', { 
          class: 'outline secondary',
          style: { margin: 0, padding: '0.25rem 0.75rem' },
          onclick: () => this.refreshUsers(),
          'aria-busy': this.loading.users
        }, this.loading.users ? '' : '🔄 Refresh')
      ]),
      this.unverifiedUsers.length === 0 
        ? m('p', 'Tidak ada pengguna yang perlu diverifikasi')
        : m('table', [
          m('thead', m('tr', [
            m('th', 'Nama'),
            m('th', 'No. HP'),
            m('th', 'Tanggal Daftar'),
            m('th', 'Aksi')
          ])),
          m('tbody', this.unverifiedUsers.map(user => 
            m('tr', [
              m('td', user.fullName),
              m('td', user.phoneNumber),
              m('td', new Date(user.createdAt).toLocaleDateString('id-ID')),
              m('td', m('button', {
                onclick: () => this.verifyUser(user._id)
              }, 'Verifikasi'))
            ])
          ))
        ])
    ]);
  },

  renderSubmissionsSection() {
    return m('section', [
      m('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' } }, [
        m('h4', { style: { margin: 0 } }, 'Submission Terbaru'),
        m('button', { 
          class: 'outline secondary',
          style: { margin: 0, padding: '0.25rem 0.75rem' },
          onclick: () => this.refreshSubmissionsAndSummary(), 
          'aria-busy': this.loading.submissions
        }, this.loading.submissions ? '' : '🔄 Refresh')
      ]),
      this.allSubmissions.length === 0
        ? m('p', 'Belum ada submission')
        : m('table', [
          m('thead', m('tr', [
            m('th', 'Volunteer'),
            m('th', 'TPS'),
            m('th', 'Kecamatan'),
            m('th', 'Desa/Kelurahan'),
            m('th', 'Suara'),
            m('th', 'Foto'),
            m('th', 'GPS'),
            m('th', 'Status'),
            m('th', 'Aksi')
          ])),
          m('tbody', this.getPaginatedSubmissions().map(sub => {
            const kecamatanName = this._getResolvedAreaName('kecamatan', sub);
            const desaName = this._getResolvedAreaName('desa', sub);
            
            // Check loading states for this submission
            const isApproving = this.submissionLoadingStates[sub._id]?.approving;
            const isFlagging = this.submissionLoadingStates[sub._id]?.flagging;
                            
            return m('tr', [
                m('td', sub.volunteerDisplayName || 'Unknown'),
                m('td', sub.tps || sub.tpsNumber),
                m('td', kecamatanName),
                m('td', desaName),
                m('td', `${sub.calegVotes || ''}/${sub.totalVotes || sub.votes || ''}`),
                m('td', sub.hasPhoto
                  ? m('button', {
                      onclick: () => this.viewPhoto(sub._id),
                      style: { fontSize: '12px', padding: '4px 8px', background: '#007bff', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }
                    }, 'Lihat')
                  : m('span', { style: { color: '#999' } }, '❌')),
                m('td', (sub.location && sub.location.coordinates && sub.location.coordinates.length === 2)
                  ? m('button', {
                      onclick: () => this.openMapModal(sub.location.coordinates),
                      title: 'Lihat Peta',
                      class: 'outline secondary',
                      style: { margin: 0, padding: '0.25rem 0.5rem', fontSize: '1.1rem', lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }
                    }, '📍')
                  : m('span', { style: { color: '#999' } }, '❌')),
                m('td', sub.status || '-'),
                m('td', [
                  m('button', {
                    onclick: () => this.openEditModal(sub._id),
                    class: 'outline secondary',
                    style: { marginRight: '0.5rem', padding: '0.25rem 0.5rem' },
                    title: 'Edit'
                  }, '✏️'),
                  sub.status !== 'approved' && m('button', { 
                    onclick: () => this.approveSubmission(sub._id), 
                    style: { marginRight: '0.5rem' },
                    disabled: isApproving || isFlagging,
                    'aria-busy': isApproving ? 'true' : null
                  }, isApproving ? 'Memproses...' : 'Setujui'),
                  sub.status !== 'flagged' && m('button', { 
                    onclick: () => this.flagSubmission(sub._id), 
                    class: 'secondary', 
                    style: { marginLeft: '0.5rem' },
                    disabled: isFlagging || isApproving,
                    'aria-busy': isFlagging ? 'true' : null 
                  }, isFlagging ? 'Memproses...' : 'Tandai')
                ])
              ]);
          }))
        ]),
      this.renderPaginationControls()
    ]);
  },

  // --- Edit Modal Methods ---
  async openEditModal(submissionId) {
    this.editingSubmissionId = submissionId;
    this.editingSubmission = null; // Reset previous submission data
        
    // Ensure area data is loaded
    if (this.areaData.kecamatanList.length === 0 || this.areaData.desaList.length === 0) {
      await this.loadAreaData();
    }
        
    // Fetch the submission data
    try {
      const submission = await m.request({
        method: 'GET',
        url: `/api/submissions/${submissionId}`,
        headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
      });
      console.log('AdminPanel: Fetched submission data:', submission);
      console.log('AdminPanel: Available areaData:', this.areaData);
      this.editingSubmission = submission;
    } catch (error) {
      console.error('Error fetching submission data:', error);
      this.error = 'Failed to load submission data for editing';
    }
        
    this.isEditModalOpen = true;
    m.redraw();
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
        this.editingSubmission
          ? m(SubmissionForm, {
              submission: this.editingSubmission, // Pass the full submission object
              areaData: this.areaData, // Pass area data for name lookups
              onsuccess: () => {
                this.closeEditModal();
                this.refreshSubmissionsAndSummary(); // Refresh the list after edit
              }
            })
          : m('div', { 'aria-busy': 'true' }, 'Memuat data submission...')
      ])
    ]);
  },

  // Add a method to handle photo viewing
  viewPhoto(submissionId) {
    // Open photo in a new window/tab
    window.open(`/api/submissions/photo/${submissionId}`, '_blank');
  },

  // --- Details Modal Methods ---
  openDetailsModal(filterType, identifier) {
    this.isDetailsModalOpen = true;
    let filtered = [];

    if (filterType === 'all') {
      this.detailsModalTitle = 'Semua Submission';
      filtered = this.allSubmissions;
    } else if (filterType === 'kecamatan') {
      this.detailsModalTitle = `Submission untuk Kecamatan: ${identifier}`;
      filtered = this.allSubmissions.filter(sub => 
        (this.areaData.kecamatanList.find(k => k.code === sub.kecamatanCode)?.name || sub.district || sub.kecamatanCode) === identifier
      );
    } else if (filterType === 'desa') {
      const { kecamatanName, desaName } = identifier;
      this.detailsModalTitle = `Submission untuk Desa: ${desaName} (Kec. ${kecamatanName})`;
      filtered = this.allSubmissions.filter(sub => {
        const subKecName = this.areaData.kecamatanList.find(k => k.code === sub.kecamatanCode)?.name || sub.district || sub.kecamatanCode;
        const subDesaName = this.areaData.desaList.find(d => d.code === sub.kelurahanDesaCode)?.name || sub.village || sub.kelurahanDesaCode;
        return subKecName === kecamatanName && subDesaName === desaName;
      });
    }
        
    this.submissionsForModal = filtered;
    m.redraw();
  },

  closeDetailsModal() {
    this.isDetailsModalOpen = false;
    this.detailsModalTitle = '';
    this.submissionsForModal = [];
    m.redraw();
  },

  renderDetailsModal() {
    if (!this.isDetailsModalOpen) return null;
        
    return m('dialog', { open: true }, [
      m('article', { style: { maxWidth: '95vw', width: '1200px' } }, [
        m('header', [
          m('h5', this.detailsModalTitle),
          m('a.close', { href: '#', 'aria-label': 'Close', onclick: (e) => { e.preventDefault(); this.closeDetailsModal(); } })
        ]),
        m('div', { style: { overflowX: 'auto' } },
          m('table', [
            m('thead', m('tr', [
              m('th', 'Volunteer'), m('th', 'TPS'), m('th', 'Kecamatan'), m('th', 'Desa/Kelurahan'),
              m('th', 'Suara'), m('th', 'Foto'), m('th', 'GPS'), m('th', 'Status'), m('th', 'Aksi')
            ])),
            m('tbody', this.submissionsForModal.map(sub => {
              const kecamatanName = this.areaData.kecamatanList.find(k => k.code === sub.kecamatanCode)?.name || sub.district || sub.kecamatanCode || 'N/A';
              const desaName = this.areaData.desaList.find(d => d.code === sub.kelurahanDesaCode)?.name || sub.village || sub.kelurahanDesaCode || 'N/A';
              const isApproving = this.submissionLoadingStates[sub._id]?.approving;
              const isFlagging = this.submissionLoadingStates[sub._id]?.flagging;
              
              return m('tr', [
                m('td', sub.volunteerDisplayName || 'Unknown'),
                m('td', sub.tps || sub.tpsNumber),
                m('td', kecamatanName),
                m('td', desaName),
                m('td', `${sub.calegVotes || ''}/${sub.totalVotes || sub.votes || ''}`),
                m('td', sub.hasPhoto ? m('button', { onclick: () => this.viewPhoto(sub._id) }, 'Lihat') : '❌'),
                m('td', (sub.location && sub.location.coordinates) ? m('button', { onclick: () => this.openMapModal(sub.location.coordinates), class:'outline secondary', style:{padding:'0.25rem 0.5rem'} }, '📍') : '❌'),
                m('td', sub.status || '-'),
                m('td', [
                    sub.status !== 'approved' && m('button', { 
                      onclick: () => this.approveSubmission(sub._id), 
                      style: { marginRight: '0.5rem' },
                      disabled: isApproving || isFlagging,
                      'aria-busy': isApproving ? 'true' : null
                    }, isApproving ? 'Memproses...' : 'Setujui'),
                    sub.status !== 'flagged' && m('button', { 
                      onclick: () => this.flagSubmission(sub._id), 
                      class: 'secondary', 
                      style: { marginLeft: '0.5rem' },
                      disabled: isFlagging || isApproving,
                      'aria-busy': isFlagging ? 'true' : null
                    }, isFlagging ? 'Memproses...' : 'Tandai')
                ])
              ]);
            }))
          ])
        )
      ])
    ]);
  },

  renderSummarySection() {
    const summaryByKecamatan = Object.values(this.voteSummary.byKecamatan);
    const summaryByDesa = Object.values(this.voteSummary.byDesa);

    let tableData = [];
    const tableHeaders = ['Area', 'Total Submission', 'Total Suara Sah', 'Total Suara Caleg', 'Aksi'];

    if (this.summaryFilterLevel === 'all') {
      const totalSubmissions = this.allSubmissions.length;
      const totalSah = summaryByKecamatan.reduce((sum, kec) => sum + kec.totalVotes, 0);
      const totalCaleg = summaryByKecamatan.reduce((sum, kec) => sum + kec.calegVotes, 0);
      tableData.push({ area: 'Semua Area', submissions: totalSubmissions, totalVotes: totalSah, calegVotes: totalCaleg, filterType: 'all', identifier: 'all' });
    } else if (this.summaryFilterLevel === 'kecamatan') {
      tableData = summaryByKecamatan.map(kec => ({ area: kec.kecamatanName, submissions: kec.submissions, totalVotes: kec.totalVotes, calegVotes: kec.calegVotes, filterType: 'kecamatan', identifier: kec.kecamatanName }));
    } else if (this.summaryFilterLevel === 'desa') {
      const filteredDesa = this.summaryFilterKecamatan === 'all' ? summaryByDesa : summaryByDesa.filter(d => d.kecamatanName === this.summaryFilterKecamatan);
      tableData = filteredDesa.map(desa => {
        // Only show Kecamatan name if 'Semua Kecamatan' is selected
        const areaName = this.summaryFilterKecamatan === 'all'
          ? `${desa.desaName} (Kec. ${desa.kecamatanName})`
          : desa.desaName;
                
        return { area: areaName, submissions: desa.submissions, totalVotes: desa.totalVotes, calegVotes: desa.calegVotes, filterType: 'desa', identifier: { kecamatanName: desa.kecamatanName, desaName: desa.desaName } };
      });
    }

    return m('section', { style: { marginTop: '2rem', borderTop: '1px solid var(--pico-muted-border-color)', paddingTop: '1.5rem' } }, [
      m('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' } }, [
        m('h4', { style: { margin: 0 } }, 'Ringkasan Suara Berdasarkan Area'),
        m('button', {
          class: 'outline secondary',
          style: { margin: 0, padding: '0.25rem 0.75rem' },
          onclick: () => this.refreshSubmissionsAndSummary(),
          'aria-busy': this.loading.summary
        }, this.loading.summary ? '' : '🔄 Refresh')
      ]),
      m('div.grid', [
        m('div', [
          m('label', { for: 'summary-level' }, 'Tampilkan Berdasarkan'),
          m('select#summary-level', { onchange: (e) => { this.summaryFilterLevel = e.target.value; this.summaryFilterKecamatan = 'all'; } }, [
            m('option', { value: 'all' }, 'Semua'),
            m('option', { value: 'kecamatan' }, 'Kecamatan'),
            m('option', { value: 'desa' }, 'Desa/Kelurahan')
          ])
        ]),
        this.summaryFilterLevel === 'desa' && m('div', [
          m('label', { for: 'summary-kecamatan' }, 'Pilih Kecamatan'),
          m('select#summary-kecamatan', { onchange: (e) => this.summaryFilterKecamatan = e.target.value }, [
            m('option', { value: 'all' }, 'Semua Kecamatan'),
            ...this.availableOptions.kecamatan.map(kecName => m('option', { value: kecName }, kecName))
          ])
        ])
      ]),
      m('table', { style: { marginTop: '1rem' } }, [
        m('thead', m('tr', tableHeaders.map(h => m('th', h)))),
        m('tbody', tableData.map(row => m('tr', [
          m('td', row.area),
          m('td', row.submissions),
          m('td', row.totalVotes.toLocaleString('id-ID')),
          m('td', row.calegVotes.toLocaleString('id-ID')),
          m('td', m('button', { onclick: () => this.openDetailsModal(row.filterType, row.identifier) }, 'Lihat Detail'))
        ])))
      ])
    ]);
  },

  // --- Pagination Methods ---
  getPaginatedSubmissions() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.allSubmissions.slice(start, end);
  },

  renderPaginationControls() {
    if (this.totalPages <= 1) return null;
    return m('.pagination-controls', { style: { marginTop: '1rem', textAlign: 'center' } }, [
      m('button', { 
        onclick: () => this.currentPage--,
        disabled: this.currentPage === 1
      }, '‹ Sebelumnya'),
      m('span', { style: { margin: '0 1rem', verticalAlign: 'middle' } }, `Halaman ${this.currentPage} dari ${this.totalPages}`),
      m('button', { 
        onclick: () => this.currentPage++,
        disabled: this.currentPage >= this.totalPages
      }, 'Berikutnya ›')
    ]);
  },

  renderDashboard() {
    return [
      m('h3', 'Admin Dashboard'),
      this.error && m('div.error', this.error),
            
      this.renderStatsCards(),
      this.renderUnverifiedUsersSection(),
      this.renderSubmissionsSection(),
      this.renderEditModal(),
      this.renderDetailsModal(),
      this.renderSummarySection(),
      this.renderMapModal()
    ];
  },
    
  // Add missing methods
  verifyUser(userId) {
    return m.request({
      method: 'POST',
      url: `/api/admin/verify-user/${userId}`,
      headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
    }).then(() => {
      // Remove user from unverified list
      this.unverifiedUsers = this.unverifiedUsers.filter(user => user._id !== userId);
      m.redraw();
    }).catch(err => {
      console.error('Error verifying user:', err);
      this.error = 'Failed to verify user';
    });
  },

  approveSubmission(submissionId) {
    // Set loading state for this specific submission
    if (!this.submissionLoadingStates[submissionId]) {
      this.submissionLoadingStates[submissionId] = {};
    }
    this.submissionLoadingStates[submissionId].approving = true;
    m.redraw();

    return m.request({
      method: 'POST',
      url: `/api/admin/approve/${submissionId}`,
      headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
    }).then(() => {
      // Update submission status in local array
      const submission = this.allSubmissions.find(s => s._id === submissionId);
      if (submission) {
        submission.status = 'approved';
      }
      // Recalculate summaries to reflect the change
      this.calculateVoteSummary(this.allSubmissions);
    }).catch(err => {
      console.error('Error approving submission:', err);
      this.error = 'Failed to approve submission';
    }).finally(() => {
      // Clear loading state
      if (this.submissionLoadingStates[submissionId]) {
        this.submissionLoadingStates[submissionId].approving = false;
      }
      m.redraw();
    });
  },

  flagSubmission(submissionId) {
    // Set loading state for this specific submission
    if (!this.submissionLoadingStates[submissionId]) {
      this.submissionLoadingStates[submissionId] = {};
    }
    this.submissionLoadingStates[submissionId].flagging = true;
    m.redraw();

    return m.request({
      method: 'POST',
      url: `/api/admin/flag/${submissionId}`,
      headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
    }).then(() => {
      // Update submission status in local array
      const submission = this.allSubmissions.find(s => s._id === submissionId);
      if (submission) {
        submission.status = 'flagged';
      }
      // Recalculate summaries to reflect the change
      this.calculateVoteSummary(this.allSubmissions);
    }).catch(err => {
      console.error('Error flagging submission:', err);
      this.error = 'Failed to flag submission';
    }).finally(() => {
      // Clear loading state
      if (this.submissionLoadingStates[submissionId]) {
        this.submissionLoadingStates[submissionId].flagging = false;
      }
      m.redraw();
    });
  },

  renderNavigation() {
    return m('nav', [
      m('ul', [
        m('li', m('button', {
          class: this.currentView === 'dashboard' ? 'active' : '',
          onclick: () => this.currentView = 'dashboard'
        }, 'Dashboard')),
        m('li', m('button', {
          class: this.currentView === 'area-setting' ? 'active' : '',
          onclick: () => this.currentView = 'area-setting'
        }, 'Pengaturan Area')),
        m('li', m('button', {
          class: this.currentView === 'caleg-setting' ? 'active' : '',
          onclick: () => this.currentView = 'caleg-setting'
        }, 'Pengaturan Caleg'))
      ])
    ]);
  },

  view() {
    if (this.loading.initial) {
      return m('div.container-fluid', {style:{textAlign:'center', marginTop:'5rem' }},m("span", {"aria-busy":"true"},    "Memuat..." ));
    }

    return m('div.container-fluid', [
      m('h2', 'Admin Panel'),
            
      // Navigation
      this.renderNavigation(),
            
      // Content based on current view
      this.currentView === 'dashboard' ? this.renderDashboard() :
      this.currentView === 'area-setting' ? m(AreaSetting) :
      this.currentView === 'caleg-setting' ? m(CalegSetting) :
      m('div', 'Unknown view')
    ]);
  }
};