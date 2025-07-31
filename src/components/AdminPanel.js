// src/components/AdminPanel.js
import { i18n } from '../i18n.js';
import AreaSetting from './AreaSetting.js';
import CalegSetting from './CalegSetting.js';

export default {
  currentView: 'dashboard',
  unverifiedUsers: [],
  submissions: [],
  loading: false,
  error: '',
  
  oninit() {
    this.checkAdminAccess();
  },
  
  checkAdminAccess() {
    const token = localStorage.getItem('token');
    if (!token) {
      m.route.set('/app/login');
      return;
    }
    
    // Verify token and admin role
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role !== 'admin') {
      m.route.set('/app/dashboard');
      return;
    }
    
    this.loadDashboardData();
  },
  
  loadDashboardData() {
    this.loading = true;
    Promise.all([
      this.loadUnverifiedUsers(),
      this.loadSubmissions()
    ]).finally(() => {
      this.loading = false;
      m.redraw();
    });
  },
  
  loadUnverifiedUsers() {
    return m.request({
      method: 'GET',
      url: '/api/admin/unverified-users',
      headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
    }).then(users => {
      this.unverifiedUsers = users;
    }).catch(err => {
      this.error = 'Failed to load unverified users';
    });
  },
  
  loadSubmissions() {
    return m.request({
      method: 'GET',
      url: '/api/admin/submissions',
      headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
    }).then(submissions => {
      this.submissions = submissions;
    }).catch(err => {
      this.error = 'Failed to load submissions';
    });
  },
  
  verifyUser(userId) {
    m.request({
      method: 'POST',
      url: `/api/admin/verify-user/${userId}`,
      headers: { 
        Authorization: 'Bearer ' + localStorage.getItem('token'),
        'Content-Type': 'application/json'
      }
    }).then(() => {
      this.loadUnverifiedUsers();
    }).catch(err => {
      this.error = 'Failed to verify user';
      m.redraw();
    });
  },
  
  approveSubmission(submissionId) {
    m.request({
      method: 'POST',
      url: `/api/admin/approve/${submissionId}`,
      headers: { 
        Authorization: 'Bearer ' + localStorage.getItem('token'),
        'Content-Type': 'application/json'
      }
    }).then(() => {
      this.loadSubmissions();
    }).catch(err => {
      this.error = 'Failed to approve submission';
      m.redraw();
    });
  },
  
  flagSubmission(submissionId) {
    m.request({
      method: 'POST',
      url: `/api/admin/flag/${submissionId}`,
      headers: { 
        Authorization: 'Bearer ' + localStorage.getItem('token'),
        'Content-Type': 'application/json'
      }
    }).then(() => {
      this.loadSubmissions();
    }).catch(err => {
      this.error = 'Failed to flag submission';
      m.redraw();
    });
  },
  
  renderDashboard() {
    return [
      m('h3', 'Admin Dashboard'),
      this.error && m('div.error', this.error),
      
      // Stats
      m('div.grid', [
        m('article', [
          m('h4', 'Pengguna Belum Terverifikasi'),
          m('h2', this.unverifiedUsers.length)
        ]),
        m('article', [
          m('h4', 'Total Submission'),
          m('h2', this.submissions.length)
        ])
      ]),
      
      // Unverified Users
      m('section', [
        m('h4', 'Pengguna Belum Terverifikasi'),
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
      ]),
      
      // Recent Submissions
      m('section', [
        m('h4', 'Submission Terbaru'),
        this.submissions.length === 0
          ? m('p', 'Belum ada submission')
          : m('table', [
            m('thead', m('tr', [
              m('th', 'Volunteer'),
              m('th', 'TPS'),
              m('th', 'Desa'),
              m('th', 'Suara'),
              m('th', 'Status'),
              m('th', 'Aksi')
            ])),
            m('tbody', this.submissions.slice(0, 10).map(sub => 
              m('tr', [
                m('td', sub.volunteer?.fullName || 'Unknown'),
                m('td', sub.tps),
                m('td', sub.village),
                m('td', `${sub.calegVotes}/${sub.totalVotes}`),
                m('td', sub.status),
                m('td', [
                  sub.status === 'pending' && m('button', {
                    onclick: () => this.approveSubmission(sub._id),
                    style: { marginRight: '0.5rem' }
                  }, 'Setujui'),
                  m('button', {
                    onclick: () => this.flagSubmission(sub._id),
                    class: 'secondary'
                  }, 'Tandai')
                ])
              ])
            ))
          ])
      ])
    ];
  },
  
  view() {
    if (this.loading) {
      return m('main.container', m('p', 'Loading...'));
    }
    
    return m('main.container', [
      m('nav', [
        m('ul', [
          m('li', m('button', {
            onclick: () => { this.currentView = 'dashboard'; },
            class: this.currentView === 'dashboard' ? '' : 'outline'
          }, 'Dashboard')),
          m('li', m('button', {
            onclick: () => { this.currentView = 'area'; },
            class: this.currentView === 'area' ? '' : 'outline'
          }, 'Pengaturan Area')),
          m('li', m('button', {
            onclick: () => { this.currentView = 'caleg'; },
            class: this.currentView === 'caleg' ? '' : 'outline'
          }, 'Pengaturan Caleg'))
        ]),
        m('ul', [
          m('li', m('button', {
            onclick: () => {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              m.route.set('/app/login');
            },
            class: 'contrast'
          }, i18n.logout))
        ])
      ]),
      
      this.currentView === 'dashboard' && this.renderDashboard(),
      this.currentView === 'area' && m(AreaSetting),
      this.currentView === 'caleg' && m(CalegSetting)
    ]);
  }
};
