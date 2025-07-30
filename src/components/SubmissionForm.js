import { i18n } from '../i18n.js';
import { apiRequest, logout } from '../utils.js';

export default {
  isEditMode: false,
  submissionId: null,
  votes: '',
  tpsNumber: '',
  village: '',
  district: '',
  provinsiCode: '',
  kabupatenKotaCode: '',
  kecamatanCode: '',
  kelurahanDesaCode: '',
  photo: null,
  location: null, // { lat, lng }
  existingPhotoUrl: null,
  loading: false,
  error: '',
  message: '',
  locationLoading: false,
  locationError: '',
  checkingTps: false,

  oninit(vnode) {
    this.submissionId = vnode.attrs.id || null;
    this.isEditMode = !!this.submissionId;
    this.resetFormState();

    if (this.isEditMode) {
      this.loadSubmission(this.submissionId);
    } else if (vnode.attrs && vnode.attrs.prefill) {
      if (vnode.attrs.prefill.village) this.village = vnode.attrs.prefill.village;
      if (vnode.attrs.prefill.district) this.district = vnode.attrs.prefill.district;
      if (vnode.attrs.prefill.provinsiCode) this.provinsiCode = vnode.attrs.prefill.provinsiCode;
      if (vnode.attrs.prefill.kabupatenKotaCode) this.kabupatenKotaCode = vnode.attrs.prefill.kabupatenKotaCode;
      if (vnode.attrs.prefill.kecamatanCode) this.kecamatanCode = vnode.attrs.prefill.kecamatanCode;
      if (vnode.attrs.prefill.kelurahanDesaCode) this.kelurahanDesaCode = vnode.attrs.prefill.kelurahanDesaCode;
    }
  },

  onremove() {
    // Revoke the object URL to free up memory when the component is destroyed
    if (this.existingPhotoUrl && this.existingPhotoUrl.startsWith('blob:')) {
      URL.revokeObjectURL(this.existingPhotoUrl);
    }
  },

  resetFormState() {
    this.votes = '';
    this.tpsNumber = '';
    this.village = '';
    this.district = '';
    this.provinsiCode = '';
    this.kabupatenKotaCode = '';
    this.kecamatanCode = '';
    this.kelurahanDesaCode = '';
    this.photo = null;
    // Clean up old blob URL if it exists
    if (this.existingPhotoUrl && this.existingPhotoUrl.startsWith('blob:')) {
      URL.revokeObjectURL(this.existingPhotoUrl);
    }
    this.existingPhotoUrl = null;
    this.location = null;
    this.loading = false;
    this.checkingTps = false;
    this.locationLoading = false;
    this.locationError = '';
    this.error = '';
    this.message = '';
    const fileInput = document.querySelector('#photo-upload');
    if (fileInput) fileInput.value = '';
  },

  async loadSubmission(id) {
    this.loading = true;
    m.redraw();
    try {
      // Fetch submission data and photo in parallel for better performance
      const [data, photoBlob] = await Promise.all([
        apiRequest({ url: `/api/submissions/${id}` }),
        apiRequest({ method: 'GET', url: `/api/submissions/${id}/photo`, responseType: 'blob' }).catch(e => {
          console.error("Could not load submission photo:", e);
          return null; // Don't let a failed photo load break the whole form
        })
      ]);

      this.votes = data.votes;
      this.tpsNumber = data.tpsNumber;
      this.village = data.village;
      this.district = data.district;
      this.provinsiCode = data.provinsiCode;
      this.kabupatenKotaCode = data.kabupatenKotaCode;
      this.kecamatanCode = data.kecamatanCode;
      this.kelurahanDesaCode = data.kelurahanDesaCode;

      if (data.location && data.location.coordinates) {
        this.location = { lat: data.location.coordinates[1], lng: data.location.coordinates[0] };
      }

      if (photoBlob) {
        this.onremove(); // Clean up any previous blob URL
        this.existingPhotoUrl = URL.createObjectURL(photoBlob);
      }
    } catch (err) {
      this.error = err.response?.error || 'Gagal memuat data.';
      if (err.code === 401 || err.code === 403) logout();
    } finally {
      this.loading = false;
      m.redraw();
    }
  },

  async checkForExistingTps() {
    if (!this.tpsNumber || !this.kelurahanDesaCode) return;

    this.checkingTps = true;
    this.message = ''; // Clear messages
    this.error = '';
    m.redraw();

    try {
      const existingSubmission = await apiRequest({
        url: `/api/submissions/mine/by-tps?kelurahanDesaCode=${this.kelurahanDesaCode}&tpsNumber=${this.tpsNumber}`
      });

      if (existingSubmission && existingSubmission._id) {
        this.submissionId = existingSubmission._id;
        this.isEditMode = true;
        await this.loadSubmission(this.submissionId);
        this.message = 'Data untuk TPS ini ditemukan dan dimuat untuk diedit.';
      }
    } catch (e) {
      if (e.code === 404) {
        // This is the expected case for a new entry.
        // If user was editing, and then changed TPS number to a new one, we need to reset.
        if (this.isEditMode) {
          const prefill = {
            village: this.village, district: this.district,
            provinsiCode: this.provinsiCode, kabupatenKotaCode: this.kabupatenKotaCode,
            kecamatanCode: this.kecamatanCode, kelurahanDesaCode: this.kelurahanDesaCode,
            tpsNumber: this.tpsNumber
          };
          this.resetFormState();
          Object.assign(this, prefill); // Restore pre-filled data
          this.isEditMode = false;
          this.submissionId = null;
        }
        this.message = ''; // Clear any previous messages
      } else {
        this.error = 'Gagal memeriksa data TPS.';
      }
    } finally {
      this.checkingTps = false;
      m.redraw();
    }
  },

  async getLocation() {
    this.locationLoading = true;
    this.locationError = '';
    this.location = null;
    m.redraw();

    if (!navigator.geolocation) {
      this.locationError = 'Geolocation tidak didukung oleh browser ini.';
      this.locationLoading = false;
      m.redraw();
      return;
    }

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000, // 15 seconds
          maximumAge: 0 // Force a fresh location
        });
      });
      this.location = { lat: position.coords.latitude, lng: position.coords.longitude };
    } catch (err) {
      this.locationError = `Gagal mendapatkan lokasi: ${err.message}`;
    } finally {
      this.locationLoading = false;
      m.redraw();
    }
  },

  async submitForm(vnode) {
    this.loading = true;
    this.error = '';
    this.message = '';

    if (!this.isEditMode && !this.photo) {
      this.error = i18n.photoRequired;
      this.loading = false;
      return;
    }

    try {
      const body = {
        votes: this.votes,
        tpsNumber: this.tpsNumber,
        village: this.village,
        district: this.district,
        provinsiCode: this.provinsiCode,
        kabupatenKotaCode: this.kabupatenKotaCode,
        kecamatanCode: this.kecamatanCode,
        kelurahanDesaCode: this.kelurahanDesaCode,
      };

      if (this.location) {
        body.lat = this.location.lat;
        body.lng = this.location.lng;
      }
      
      if (this.photo) {
        body.photoBase64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result.split(',')[1]);
          reader.onerror = (error) => reject(error);
          reader.readAsDataURL(this.photo);
        });
        body.photoMime = this.photo.type;
      }

      if (this.isEditMode) {
        await apiRequest({ method: 'PUT', url: `/api/submissions/${this.submissionId}`, body });
        this.message = 'Data berhasil diperbarui.';
        setTimeout(() => m.route.set('/app/admin'), 1500);
      } else {
        await apiRequest({ method: 'POST', url: '/api/submissions', body });
        this.message = 'Data berhasil dikirim.';
        if (vnode && vnode.attrs.onsuccess) {
          vnode.attrs.onsuccess();
        }
        // Reset only the input fields, keep location data for next entry
        this.votes = '';
        this.tpsNumber = '';
        this.photo = null;
        // this.location = null; // Keep location for next entry in same area
        this.error = '';
        this.locationError = '';
        const fileInput = document.querySelector('#photo-upload');
        if (fileInput) fileInput.value = '';
      }
    } catch (err) {
      this.error = err.response?.error || i18n.submissionFailed;
      if (err.code === 401 || err.code === 403) {
        logout();
      }
    } finally {
      this.loading = false;
      m.redraw();
    }
  },

  view(vnode) {
    const hideFields = (vnode.attrs && vnode.attrs.hideFields) || [];

    if (this.loading && !this.locationLoading) {
      return m('main.container', m('p', i18n.loading));
    }

    return m('main.container', [
      m('h3', this.isEditMode ? 'Edit Data Masuk' : i18n.submitElectionData),
      m('form', {
        onsubmit: e => { e.preventDefault(); this.submitForm(vnode); }
      }, [
        m('input[type=number][placeholder=' + i18n.votes + '][required]', { oninput: e => this.votes = e.target.value, value: this.votes }),
        m('label', { for: 'tps-number-input' }, i18n.tpsNumber),
        m('input[type=text][id=tps-number-input][placeholder=' + i18n.tpsNumber + '][required]', {
          oninput: e => this.tpsNumber = e.target.value,
          onblur: () => this.checkForExistingTps(),
          value: this.tpsNumber,
          'aria-busy': this.checkingTps
        }),
        !hideFields.includes('village') && m('input[type=text][placeholder=' + i18n.village + '][required]', { oninput: e => this.village = e.target.value, value: this.village }),
        !hideFields.includes('district') && m('input[type=text][placeholder=' + i18n.district + '][required]', { oninput: e => this.district = e.target.value, value: this.district }),
        
        m('label', { for: 'photo-upload' }, i18n.photo),
        this.isEditMode && this.existingPhotoUrl && m('div', [
          m('p', 'Foto saat ini:'),
          m('img', { src: this.existingPhotoUrl, style: { maxWidth: '200px', marginBottom: '1rem', borderRadius: 'var(--pico-border-radius)' } }),
          m('p', { style: { fontStyle: 'italic', fontSize: '0.9rem' } }, 'Unggah foto baru untuk menggantinya.')
        ]),
        m('input[type=file][id=photo-upload][accept=image/*]', { required: !this.isEditMode, onchange: e => this.photo = e.target.files[0] }),

        m('label', { for: 'location-btn', style: { marginTop: 'var(--spacing)' } }, 'Lokasi GPS'),
        m('button[type=button][id=location-btn].secondary', { onclick: () => this.getLocation(), 'aria-busy': this.locationLoading }, 'Ambil Lokasi GPS'),
        this.location && m('p', `Lat: ${this.location.lat.toFixed(6)}, Lng: ${this.location.lng.toFixed(6)}`),
        this.locationError && m('p', { style: { color: 'var(--pico-color-red-500)' } }, this.locationError),

        m('button[type=submit]', { disabled: this.loading || this.checkingTps, 'aria-busy': this.loading, style: { marginTop: 'var(--spacing)' } }, this.loading ? 'Menyimpan...' : (this.isEditMode ? 'Simpan Perubahan' : i18n.submit)),
        this.message && m('p', { style: { color: 'var(--pico-color-green-500)' } }, this.message),
        this.error && m('p', { style: { color: 'var(--pico-color-red-500)' } }, this.error)
      ])
    ]);
  }
};
