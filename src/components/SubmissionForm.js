// src/components/SubmissionForm.js - Fixed Photo Update Logic
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
  prefillData: null,
  areaData: { kecamatanList: [], desaList: [] },
  
  // Photo handling state
  photoBase64: null,
  photoMime: null,
  photoProcessing: false,
  photoChanged: false,
  hasExistingPhoto: false,

  async oninit(vnode) {
    this.onsuccess = vnode.attrs.onsuccess;
    this.hideFields = vnode.attrs.hideFields || [];
    this.areaData = vnode.attrs.areaData || { kecamatanList: [], desaList: [] };

    if (vnode.attrs.submission) {
      // Edit mode with submission object
      this.editMode = true;
      this.submissionId = vnode.attrs.submission._id;
      this.populateForm(vnode.attrs.submission);
    } else if (vnode.attrs.id) {
      // Edit mode with ID - fetch data
      this.editMode = true;
      this.submissionId = vnode.attrs.id;
      await this.fetchSubmissionData();
    } else if (vnode.attrs.prefill) {
      // Prefill mode for new submissions
      this.prefillData = vnode.attrs.prefill;
      this.village = vnode.attrs.prefill.village || '';
      this.district = vnode.attrs.prefill.district || '';
      this.provinsiCode = vnode.attrs.prefill.provinsiCode || '';
      this.kabupatenKotaCode = vnode.attrs.prefill.kabupatenKotaCode || '';
      this.kecamatanCode = vnode.attrs.prefill.kecamatanCode || '';
      this.kelurahanDesaCode = vnode.attrs.prefill.kelurahanDesaCode || '';
      this.tps = vnode.attrs.prefill.tps || '';
    }
  },

  onupdate(vnode) {
    if (vnode.attrs.submission && vnode.attrs.submission._id !== this.submissionId) {
      this.editMode = true;
      this.submissionId = vnode.attrs.submission._id;
      this.areaData = vnode.attrs.areaData || { kecamatanList: [], desaList: [] };
      this.populateForm(vnode.attrs.submission);
      m.redraw();
    }
  },

  populateForm(response) {
    console.log('SubmissionForm: populateForm called with:', response);
    
    // Reset photo state
    this.photoChanged = false;
    this.photoBase64 = null;
    this.photoMime = null;
    this.photo = null;
    this.hasExistingPhoto = false;

    // Populate form fields
    this.tps = response.tps || response.tpsNumber || '';
    this.totalVotes = response.totalVotes || response.votes || '';
    this.calegVotes = response.calegVotes || '';

    // Handle location data
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

    // Resolve area names
    const kec = this.areaData.kecamatanList.find(k => k.code === this.kecamatanCode);
    this.district = kec?.name || response.district || this.kecamatanCode || 'N/A';

    const desa = this.areaData.desaList.find(d => d.code === this.kelurahanDesaCode);
    this.village = desa?.name || response.village || this.kelurahanDesaCode || 'N/A';

    // Handle photo preview
    if (response.hasPhoto || response.photo || response.photoMime) {
      this.hasExistingPhoto = true;
      this.photoPreview = `/api/submissions/photo/${response._id || this.submissionId}?t=${Date.now()}`;
      console.log('SubmissionForm: Set photo preview:', this.photoPreview);
    } else {
      this.hasExistingPhoto = false;
      this.photoPreview = null;
    }

    m.redraw();
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

      if (response) {
        this.populateForm(response);
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

  async handleFileUpload(e) {
    const file = e.target.files[0];
    console.log('[PHOTO] File selected:', file?.name || 'No file');

    if (!file) {
      // User cleared the file input
      this.photo = null;
      this.photoBase64 = null;
      this.photoMime = null;
      this.photoProcessing = false;
      this.photoChanged = true;
      
      // In edit mode, this means removing the photo
      if (this.editMode) {
        this.photoPreview = null;
        this.hasExistingPhoto = false;
      }
      
      m.redraw();
      return;
    }

    // Start processing
    this.photo = file;
    this.photoProcessing = true;
    this.photoChanged = true;
    this.photoBase64 = null;
    this.photoPreview = URL.createObjectURL(file);
    m.redraw();

    console.log('[PHOTO] Started Base64 conversion...');

    try {
      const dataUrl = await this.fileToBase64(file);
      this.photoBase64 = dataUrl.split(',')[1]; // Remove data URL prefix
      this.photoMime = file.type;
      this.photoProcessing = false;
      console.log('[PHOTO] Base64 conversion completed');
      m.redraw();
    } catch (error) {
      console.error('[PHOTO] Conversion error:', error);
      this.error = 'Gagal memproses file gambar.';
      this.photo = null;
      this.photoBase64 = null;
      this.photoProcessing = false;
      this.photoChanged = false;
      m.redraw();
    }
  },

  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  },

  async submit() {
    this.loading = true;
    this.error = '';
    this.success = '';

    // Validation for new submissions
    if (!this.editMode && !this.photo) {
      this.error = 'Foto bukti wajib diunggah.';
      this.loading = false;
      m.redraw();
      return;
    }

    // Check if photo is processing
    if (this.photo && this.photoProcessing) {
      this.error = 'Gambar masih diproses, mohon tunggu...';
      this.loading = false;
      m.redraw();
      return;
    }

    // Check if photo selected but conversion failed
    if (this.photo && !this.photoBase64) {
      this.error = 'Gambar gagal diproses. Silakan unggah ulang.';
      this.loading = false;
      m.redraw();
      return;
    }

    // Vote validation
    const totalVotesNum = parseInt(this.totalVotes, 10) || 0;
    const calegVotesNum = parseInt(this.calegVotes, 10) || 0;

    if (calegVotesNum > totalVotesNum) {
      this.error = 'Jumlah suara caleg tidak boleh melebihi total suara.';
      this.loading = false;
      m.redraw();
      return;
    }

    // Build payload
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

    // Handle photo data
    if (this.photoChanged) {
      if (this.photoBase64) {
        // New photo uploaded
        payload.photoBase64 = `data:${this.photoMime};base64,${this.photoBase64}`;
        console.log('[SUBMIT] Including new photo in payload');
      } else if (!this.photo && this.editMode) {
        // Photo was cleared in edit mode
        payload.removePhoto = true;
        console.log('[SUBMIT] Removing photo in edit mode');
      }
    }
    // If photoChanged is false, don't include any photo data (keep existing)

    const url = this.editMode ? `/api/submissions/${this.submissionId}` : '/api/submissions';
    const method = this.editMode ? 'PUT' : 'POST';

    console.log(`Submitting to ${method} ${url}`, payload);

    try {
      const response = await m.request({
        method: method,
        url: url,
        body: payload,
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + localStorage.getItem('token')
        }
      });

      this.success = this.editMode ? 'Data berhasil diperbarui!' : 'Data berhasil dikirim!';

      if (!this.editMode) {
        this.resetForm();
      } else {
        // Reset photo change tracking after successful update
        this.photoChanged = false;
        // Update preview URL with new timestamp to force refresh
        if (this.hasExistingPhoto || this.photoBase64) {
          this.photoPreview = `/api/submissions/photo/${this.submissionId}?t=${Date.now()}`;
        }
      }

      this.loading = false;

      // Call success callback
      if (this.onsuccess && typeof this.onsuccess === 'function') {
        this.onsuccess();
      }

      m.redraw();
    } catch (error) {
      const responseBody = error.response || error;

      if (responseBody && typeof responseBody === 'object' && responseBody.error) {
        let errorMessage = responseBody.error;

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
    }
  },

  resetForm() {
    this.tps = '';
    this.totalVotes = '';
    this.calegVotes = '';
    this.photo = null;
    this.photoBase64 = null;
    this.photoPreview = null;
    this.photoMime = null;
    this.photoProcessing = false;
    this.photoChanged = false;
    this.hasExistingPhoto = false;
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
      // Edit mode indicator
      this.editMode && m('div', {
        style: {
          marginBottom: '1rem',
          padding: '0.5rem',
          backgroundColor: '#e3f2fd',
          borderRadius: '4px',
          textAlign: 'center'
        }
      }, [
        m('strong', 'Mode Edit - Memperbarui data submission')
      ]),

      // Village field
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

      // District field
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

      // TPS field
      m('label', { for: 'tps' }, i18n.tps),
      m('input', {
        id: 'tps',
        type: 'text',
        value: this.tps,
        oninput: e => { this.tps = e.target.value; },
        required: true
      }),

      // Total votes field
      m('label', { for: 'totalVotes' }, i18n.totalVotes),
      m('input', {
        id: 'totalVotes',
        type: 'number',
        value: this.totalVotes,
        oninput: e => { this.totalVotes = e.target.value; },
        required: true
      }),

      // Caleg votes field
      m('label', { for: 'calegVotes' }, i18n.calegVotes),
      m('input', {
        id: 'calegVotes',
        type: 'number',
        value: this.calegVotes,
        oninput: e => { this.calegVotes = e.target.value; },
        required: true
      }),

      // Photo field
      m('label', { for: 'photo' }, i18n.photo + (this.editMode ? ' (Kosongkan jika tidak ingin mengubah)' : '')),
      m('input', {
        id: 'photo',
        type: 'file',
        accept: 'image/*',
        onchange: e => this.handleFileUpload(e),
        required: !this.editMode
      }),

      // Show existing photo status in edit mode
      this.editMode && !this.photoChanged && this.hasExistingPhoto && m('div', {
        style: { marginTop: '0.5rem', padding: '0.5rem', backgroundColor: '#f5f5f5', borderRadius: '4px' }
      }, [
        m('small', 'Foto saat ini:'),
        m('br'),
        m('img', {
          src: this.photoPreview,
          style: { maxWidth: '100px', maxHeight: '100px', marginTop: '0.5rem' },
          alt: 'Foto saat ini',
          onerror: (e) => {
            console.error('Failed to load existing photo');
            e.target.style.display = 'none';
          }
        })
      ]),

      // Show photo preview for new/changed photos
      this.photoPreview && (this.photoChanged || !this.editMode) && m('img', {
        src: this.photoPreview,
        style: {
          maxWidth: '100%',
          maxHeight: '200px',
          marginTop: '1rem',
          display: 'block'
        },
        alt: 'Pratinjau Foto'
      }),

      // Processing indicator
      this.photoProcessing && m('div', {
        style: { marginTop: '0.5rem', color: '#666' }
      }, 'Memproses gambar...'),

      // Location section
      m('div', [
        m('label', 'Lokasi GPS'),
        m('button', {
          type: 'button',
          onclick: () => this.getLocation()
        }, 'Dapatkan Lokasi'),
        this.latitude && this.longitude && m('p', `Lat: ${this.latitude}, Lng: ${this.longitude}`)
      ]),

      // Submit button
      m('button[type=submit]', {
        disabled: this.loading || this.photoProcessing
      },
        this.loading
          ? (this.editMode ? 'Memperbarui...' : 'Mengirim...')
          : (this.editMode ? 'Perbarui Data' : i18n.submit)
      ),

      // Messages
      this.success && m('div.success', this.success),
      this.error && m('div.error', this.error)
    ]);
  }
};