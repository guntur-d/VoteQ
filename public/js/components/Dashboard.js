// /public/js/components/Dashboard.js
import { i18n } from '../i18n.js';
import SubmissionForm from './SubmissionForm.js';

export default {
  area: null,
  kecamatanList: [],
  desaList: [],
  selectedKecamatan: null,
  selectedDesa: null,
  showForm: false,
  oninit() {
    // Fetch area setting (assume only one global area for now)
    m.request({
      method: 'GET',
      url: '/api/admin/area-setting',
      headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
    }).then(area => {
      console.log ('Fetched area setting:', area);
      this.area = area;
      if (area && area.kabupatenKota && area.provinsi) {
        // Fetch kecamatan for this kabupaten and provinsi
        m.request({
          method: 'GET',
          url: '/api/kecamatan?kabupatenCode=' + area.kabupatenKota + '&provinsiCode=' + area.provinsi
        }).then(list => {
          this.kecamatanList = list;
          m.redraw();
        });
      }
      m.redraw();
    });
  },
  view() {
    if (!this.area || !this.area.kabupatenKota) {
      return m('main.container', [
        m('h2', i18n.dashboard),
        m('p', 'Area belum diatur oleh admin.')
      ]);
    }
    if (!this.selectedKecamatan) {
      // Show kecamatan cards
      return m('main.container', [
        m('h2', i18n.dashboard),
        m('h3', 'Pilih Kecamatan'),
        m('.card-list',
          this.kecamatanList.map(k =>
            m('.card', {
              onclick: () => {
                this.selectedKecamatan = k;
                // Fetch desa/kelurahan for this kecamatan, supply provinsiCode and kabupatenCode
                const provinsiCode = this.area && this.area.provinsi ? this.area.provinsi : '';
                const kabupatenCode = this.area && this.area.kabupatenKota ? this.area.kabupatenKota : '';
                m.request({
                  method: 'GET',
                  url: '/api/kelurahan_desa?provinsiCode=' + provinsiCode + '&kabupatenCode=' + kabupatenCode + '&kecamatanCode=' + k.code
                }).then(list => {
                  this.desaList = list;
                  m.redraw();
                });
              }
            }, [
              m('div', k.name)
            ])
          )
        ),
        m('button', {
          onclick: () => {
            localStorage.removeItem('token');
            m.route.set('/app/login');
          }
        }, i18n.logout)
      ]);
    }
    if (!this.selectedDesa) {
      // Show desa/kelurahan cards
      return m('main.container', [
        m('h2', i18n.dashboard),
        m('h3', 'Pilih Desa/Kelurahan di Kecamatan ' + this.selectedKecamatan.name),
        m('.card-list',
          this.desaList.map(d =>
            m('.card', {
              onclick: () => {
                this.selectedDesa = d;
                this.showForm = true;
                m.redraw();
              }
            }, [
              m('div', d.name)
            ])
          )
        ),
        m('button', {
          onclick: () => {
            this.selectedKecamatan = null;
            this.desaList = [];
          }
        }, 'Kembali'),
        m('button', {
          onclick: () => {
            localStorage.removeItem('token');
            m.route.set('/app/login');
          }
        }, i18n.logout)
      ]);
    }
    // Show submission form with desa/kecamatan pre-filled and hidden
    return m('main.container', [
      m('h2', i18n.dashboard),
      m('h3', 'Input Data untuk ' + this.selectedDesa.name + ' (Kecamatan ' + this.selectedKecamatan.name + ')'),
      m(SubmissionForm, {
        prefill: {
          village: this.selectedDesa.name,
          district: this.selectedKecamatan.name
        },
        hideFields: ['village', 'district']
      }),
      m('button', {
        onclick: () => {
          this.selectedDesa = null;
        }
      }, 'Kembali'),
      m('button', {
        onclick: () => {
          localStorage.removeItem('token');
          m.route.set('/app/login');
        }
      }, i18n.logout)
    ]);
  }
};
