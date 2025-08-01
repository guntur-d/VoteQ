// src/components/SubmissionForm.js
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
  provinsiCode: '',
  kabupatenKotaCode: '',
  kecamatanCode: '',
  kelurahanDesaCode: '',
  loading: false,
  error: '',
  success: '',
  photoPreview: null,
  hideFields: [],
  editMode: false,
  submissionId: null,
  prefillData: null, // Store prefill data
  
  async oninit(vnode) {
    // Check if we're in edit mode
    this.submissionId = vnode.attrs.id;
    this.editMode = !!this.submissionId;
    
    if (vnode.attrs && vnode.attrs.prefill) {
      this.prefillData = vnode.attrs.prefill; // Store prefill data
      this.village = vnode.attrs.prefill.village || '';
      this.district = vnode.attrs.prefill.district || '';
      this.provinsiCode = vnode.attrs.prefill.provinsiCode || '';
      this.kabupatenKotaCode = vnode.attrs.prefill.kabupatenKotaCode || '';
      this.kecamatanCode = vnode.attrs.prefill.kecamatanCode || '';
      this.kelurahanDesaCode = vnode.attrs.prefill.kelurahanDesaCode || '';
      this.tps = vnode.attrs.prefill.tps || '';
      // Prefill photo preview if provided
      if (vnode.attrs.prefill.photoUrl) {
        this.photoPreview = vnode.attrs.prefill.photoUrl;
      }
    } else {
      // fallback: get from route params if not present in prefill
      this.village = m.route.param('village') || '';
      this.district = m.route.param('district') || '';
      // Prefill photo preview from params if available
      const photoParam = m.route.param('photoUrl') || m.route.param('photo');
      if (photoParam) {
        this.photoPreview = photoParam;
      }
    }
    if (vnode.attrs && vnode.attrs.hideFields) {
      this.hideFields = vnode.attrs.hideFields;
    }
    // Store the success callback
    this.onsuccess = vnode.attrs.onsuccess;
    
    // If in edit mode, fetch the existing submission data
    if (this.editMode) {
      await this.fetchSubmissionData();
    }
  },
  
  async fetchSubmissionData() {
    try {
      this.loading = true;
      const response = await m.request({
        method: 'GET',
        url: `/api/submissions/${this.submissionId}`,
        headers: {
          Authorization: 'Bearer ' + localStorage.getItem('token')
        }
      });
      
      // Populate form with existing data - handle both old and new field names
      this.tps = response.tps || response.tpsNumber || '';
      // Only overwrite if backend actually provides them
      if (response.village) this.village = response.village;
      if (response.district) this.district = response.district;
      this.totalVotes = response.totalVotes || response.votes || '';
      this.calegVotes = response.calegVotes || '';
      
      // Handle location data - check both formats
      if (response.location && response.location.coordinates && response.location.coordinates.length === 2) {
        this.longitude = response.location.coordinates[0];
        this.latitude = response.location.coordinates[1];
      } else if (response.latitude && response.longitude) {
        this.latitude = response.latitude;
        this.longitude = response.longitude;
      }
      
      // Handle area codes
      this.provinsiCode = response.provinsiCode || '';
      this.kabupatenKotaCode = response.kabupatenKotaCode || '';
      this.kecamatanCode = response.kecamatanCode || '';
      this.kelurahanDesaCode = response.kelurahanDesaCode || '';
      
      // Set photo preview if photo exists
      if (response.hasPhoto) {
        this.photoPreview = `/api/submissions/photo/${this.submissionId}`;
      }
    } catch (error) {
      console.error('Error fetching submission data:', error);
      this.error = 'Gagal memuat data untuk diedit: ' + (error.response?.error || error.message || 'Unknown error');
    } finally {
      this.loading = false;
      m.redraw();
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
      const reader = new FileReader();
      reader.onload = ev => {
        this.photoPreview = ev.target.result; // Full data URL for the preview
        this.photoBase64 = ev.target.result.split(',')[1]; // Remove data:image/...;base64,
        this.photoMime = file.type;
        m.redraw();
      };
      reader.readAsDataURL(file);
      this.photo = file;
    } else {
      this.photoBase64 = null;
      this.photoMime = null;
      this.photo = null;
      this.photoPreview = null;
    }
  },
  
  async submit() {
    this.loading = true;
    this.error = '';
    this.success = '';

    // Client-side validation for required photo (only for new submissions)
    if (!this.editMode && !this.photo) {
      this.error = 'Foto bukti wajib diunggah.';
      this.loading = false;
      m.redraw();
      return;
    }

    // Wait for photoBase64 if file is selected and not yet loaded
    if (this.photo && !this.photoBase64) {
      this.error = 'Gambar masih diproses, mohon tunggu.';
      this.loading = false;
      m.redraw();
      return;
    }

    const totalVotesNum = parseInt(this.totalVotes, 10) || 0;
    const calegVotesNum = parseInt(this.calegVotes, 10) || 0;

    if (calegVotesNum > totalVotesNum) {
      this.error = 'Jumlah suara caleg tidak boleh melebihi total suara.';
      this.loading = false;
      m.redraw();
      return;
    }

    const payload = {
      tps: this.tps,
      totalVotes: totalVotesNum,
      calegVotes: calegVotesNum,

      provinsiCode: this.provinsiCode,
      kabupatenKotaCode: this.kabupatenKotaCode,
      kecamatanCode: this.kecamatanCode,
      kelurahanDesaCode: this.kelurahanDesaCode,

      latitude: this.latitude,
      longitude: this.longitude
    };

    // Only include photo data if a new photo was uploaded
    if (this.photoBase64) {
      payload.photoBase64 = this.photoBase64;
      payload.photoContentType = this.photoMime;
    }

    const url = this.editMode ? `/api/submissions/${this.submissionId}` : '/api/submissions';
    const method = this.editMode ? 'PUT' : 'POST';

    m.request({
      method: method,
      url: url,
      body: payload,
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + localStorage.getItem('token')
      }
    }).then(response => {
      this.success = this.editMode ? 'Data berhasil diperbarui!' : 'Data berhasil dikirim!';
      if (!this.editMode) {
        this.resetForm();
      }
      this.loading = false;
      // Call the success callback if provided
      if (this.onsuccess && typeof this.onsuccess === 'function') {
        this.onsuccess();
      }
      m.redraw();
    }).catch(error => {
      // The `error` object from m.request is an Error instance.
      // The server's JSON response is in `error.response`.
      const responseBody = error.response || error;

      if (responseBody && typeof responseBody === 'object' && responseBody.error) {
        let errorMessage = responseBody.error;
        
        // If the backend sends validation details, append them.
        // Mongoose validation `errors` is an object, so we use Object.values.
        if (responseBody.details && typeof responseBody.details === 'object') {
          const messages = Object.values(responseBody.details).map(detail => detail.message).join(', ');
          if (messages) errorMessage += `: ${messages}`;
        }
        this.error = errorMessage;
      } else {
        this.error = this.editMode ? 'Gagal memperbarui data' : 'Gagal mengirim data';
      }
      this.loading = false;
      m.redraw();
    });
  },
  
  resetForm() {
    this.tps = '';
    this.totalVotes = '';
    this.calegVotes = '';
    this.photo = null;
    this.photoBase64 = null;
    this.photoPreview = null;
    this.photoMime = null;
    this.latitude = '';
    this.longitude = '';
    
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
      // Show edit mode indicator
      this.editMode && m('div', { style: { marginBottom: '1rem', padding: '0.5rem', backgroundColor: '#e3f2fd', borderRadius: '4px' } }, [
        m('strong', 'Mode Edit - Memperbarui data submission'),
        m('br'),
        m('button', {
          type: 'button',
          class: 'secondary',
          style: { marginTop: '0.5rem' },
          onclick: () => m.route.set('/app/dashboard')
        }, 'Kembali ke Dashboard')
      ]),
      
      !this.hideFields.includes('village') && [
        m('label', { for: 'village' }, i18n.village),
        m('input', {
          id: 'village',
          type: 'text',
          value: this.village,
          disabled: true,
          required: true
        })
      ],
      
      !this.hideFields.includes('district') && [
        m('label', { for: 'district' }, i18n.district),
        m('input', {
          id: 'district',
          type: 'text',
          value: this.district,
          disabled: true,
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
        onchange: e => this.handleFileUpload(e),
        required: !this.editMode // Only required for new submissions
      }),
      
      this.photoPreview && m('img', {
        src: this.photoPreview,
        style: {
          maxWidth: '100%',
          maxHeight: '200px',
          marginTop: '1rem',
          display: 'block'
        },
        alt: 'Pratinjau Foto'
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
        this.loading 
          ? (this.editMode ? 'Memperbarui...' : 'Mengirim...') 
          : (this.editMode ? 'Perbarui Data' : i18n.submit)
      ),
      
      this.success && m('div.success', this.success),
      this.error && m('div.error', this.error)
    ]);
  }
};
