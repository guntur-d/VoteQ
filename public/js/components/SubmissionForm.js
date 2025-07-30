// /public/js/components/SubmissionForm.js
import { i18n } from '../i18n.js';

export default {
  tps: '',
  village: '',
  district: '',
  totalVotes: '',
  calegVotes: '',
  photo: null,
  latitude: '',
  longitude: '',
  loading: false,
  error: '',
  success: '',
  hideFields: [],
  
  oninit(vnode) {
    if (vnode.attrs && vnode.attrs.prefill) {
      this.village = vnode.attrs.prefill.village || '';
      this.district = vnode.attrs.prefill.district || '';
    }
    if (vnode.attrs && vnode.attrs.hideFields) {
      this.hideFields = vnode.attrs.hideFields;
    }
  },
  
  getLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          this.latitude = position.coords.latitude;
          this.longitude = position.coords.longitude;
          m.redraw();
        },
        error => {
          console.error('Error getting location:', error);
        }
      );
    }
  },
  
  handleFileUpload(e) {
    const file = e.target.files[0];
    if (file) {
      this.photo = file;
    }
  },
  
  submit() {
    this.loading = true;
    this.error = '';
    this.success = '';
    
    const formData = new FormData();
    formData.append('tps', this.tps);
    formData.append('village', this.village);
    formData.append('district', this.district);
    formData.append('totalVotes', this.totalVotes);
    formData.append('calegVotes', this.calegVotes);
    formData.append('latitude', this.latitude);
    formData.append('longitude', this.longitude);
    if (this.photo) {
      formData.append('photo', this.photo);
    }
    
    m.request({
      method: 'POST',
      url: '/api/submissions',
      body: formData,
      headers: { 
        Authorization: 'Bearer ' + localStorage.getItem('token')
      }
    }).then(response => {
      this.success = 'Data berhasil dikirim!';
      this.resetForm();
      this.loading = false;
      m.redraw();
    }).catch(error => {
      this.error = error.error || 'Gagal mengirim data';
      this.loading = false;
      m.redraw();
    });
  },
  
  resetForm() {
    this.tps = '';
    this.totalVotes = '';
    this.calegVotes = '';
    this.photo = null;
    this.latitude = '';
    this.longitude = '';
    if (!this.hideFields.includes('village')) this.village = '';
    if (!this.hideFields.includes('district')) this.district = '';
    
    const fileInput = document.querySelector('#photo');
    if (fileInput) fileInput.value = '';
  },
  
  view() {
    return m('form', {
      onsubmit: e => {
        e.preventDefault();
        this.submit();
      }
    }, [
      !this.hideFields.includes('village') && [
        m('label', { for: 'village' }, i18n.village),
        m('input', {
          id: 'village',
          type: 'text',
          value: this.village,
          oninput: e => { this.village = e.target.value; },
          required: true
        })
      ],
      
      !this.hideFields.includes('district') && [
        m('label', { for: 'district' }, i18n.district),
        m('input', {
          id: 'district',
          type: 'text',
          value: this.district,
          oninput: e => { this.district = e.target.value; },
          required: true
        })
      ],
      
      m('label', { for: 'tps' }, i18n.tps),
      m('input', {
        id: 'tps',
        type: 'text',
        value: this.tps,
        oninput: e => { this.tps = e.target.value; },
        required: true
      }),
      
      m('label', { for: 'totalVotes' }, i18n.totalVotes),
      m('input', {
        id: 'totalVotes',
        type: 'number',
        value: this.totalVotes,
        oninput: e => { this.totalVotes = e.target.value; },
        required: true
      }),
      
      m('label', { for: 'calegVotes' }, i18n.calegVotes),
      m('input', {
        id: 'calegVotes',
        type: 'number',
        value: this.calegVotes,
        oninput: e => { this.calegVotes = e.target.value; },
        required: true
      }),
      
      m('label', { for: 'photo' }, i18n.photo),
      m('input', {
        id: 'photo',
        type: 'file',
        accept: 'image/*',
        onchange: e => this.handleFileUpload(e)
      }),
      
      m('div', [
        m('label', 'Lokasi GPS'),
        m('button', {
          type: 'button',
          onclick: () => this.getLocation()
        }, 'Dapatkan Lokasi'),
        this.latitude && this.longitude && m('p', `Lat: ${this.latitude}, Lng: ${this.longitude}`)
      ]),
      
      m('button[type=submit]', { disabled: this.loading }, 
        this.loading ? 'Mengirim...' : i18n.submit
      ),
      
      this.success && m('div.success', this.success),
      this.error && m('div.error', this.error)
    ]);
  }
};
