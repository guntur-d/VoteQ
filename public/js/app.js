// src/i18n.js
var i18n = {
  // Auth
  login: "Masuk",
  register: "Daftar",
  logout: "Keluar",
  email: "Email",
  phoneNumber: "Nomor HP",
  password: "Kata Sandi",
  fullName: "Nama Lengkap",
  // Navigation
  dashboard: "Dashboard",
  submit: "Input Data",
  admin: "Admin Panel",
  // Forms
  save: "Simpan",
  cancel: "Batal",
  edit: "Ubah",
  delete: "Hapus",
  back: "Kembali",
  // Area Setting
  areaSetting: "Pengaturan Area",
  currentArea: "Area Saat Ini",
  editArea: "Ubah Area",
  province: "Provinsi",
  kabupatenKota: "Kabupaten/Kota",
  selectProvince: "Pilih Provinsi",
  selectKabupaten: "Pilih Kabupaten/Kota",
  // Caleg Setting
  calegSetting: "Pengaturan Caleg",
  calegName: "Nama Caleg",
  currentCaleg: "Caleg Saat Ini",
  editCaleg: "Ubah Caleg",
  // Submission
  tps: "TPS",
  village: "Desa/Kelurahan",
  district: "Kecamatan",
  totalVotes: "Total Suara",
  calegVotes: "Suara Caleg",
  photo: "Foto C1",
  location: "Lokasi",
  // Messages
  saveError: "Gagal menyimpan",
  saveSuccess: "Berhasil disimpan",
  loginError: "Login gagal",
  registerSuccess: "Pendaftaran berhasil",
  loading: "Memuat...",
  // Admin
  unverifiedUsers: "Pengguna Belum Terverifikasi",
  verify: "Verifikasi",
  submissions: "Data Masuk",
  approve: "Setujui",
  flag: "Tandai",
  export: "Ekspor CSV"
};

// src/components/Login.js
var Login_default = {
  email: "",
  password: "",
  loading: false,
  error: "",
  login() {
    this.loading = true;
    this.error = "";
    const body = {
      email: this.email,
      password: this.password
    };
    console.log("[FRONTEND LOGIN] Sending body:", body);
    m.request({
      method: "POST",
      url: "/api/login",
      body,
      headers: { "Content-Type": "application/json" }
    }).then((response) => {
      localStorage.setItem("token", response.token);
      localStorage.setItem("user", JSON.stringify(response.user));
      m.route.set("/app/dashboard");
    }).catch((error) => {
      this.error = error.error || i18n.loginError;
      this.loading = false;
      m.redraw();
    });
  },
  view() {
    return m("main.container", [
      m("h1", i18n.login),
      m("form", {
        onsubmit: (e) => {
          e.preventDefault();
          this.login();
        }
      }, [
        m("label", { for: "email" }, i18n.email || "Email"),
        m("input", {
          id: "email",
          type: "email",
          value: this.email,
          oninput: (e) => {
            this.email = e.target.value;
          },
          required: true
        }),
        m("label", { for: "password" }, i18n.password),
        m("input", {
          id: "password",
          type: "password",
          value: this.password,
          oninput: (e) => {
            this.password = e.target.value;
          },
          required: true
        }),
        m("button[type=submit]", { disabled: this.loading }, i18n.login),
        this.error && m("div.error", this.error)
      ]),
      m("p", [
        "Belum punya akun? ",
        m("a", { href: "#!/app/register" }, i18n.register)
      ])
    ]);
  }
};

// src/components/Register.js
var Register_default = {
  fullName: "",
  email: "",
  // Add this
  phoneNumber: "",
  password: "",
  loading: false,
  error: "",
  success: "",
  register() {
    if (!this.fullName || !this.email || !this.phoneNumber || !this.password) {
      this.error = "Semua field wajib diisi";
      return;
    }
    this.loading = true;
    this.error = "";
    this.success = "";
    m.request({
      method: "POST",
      url: "/api/register",
      // PATCHED: use Vercel-compatible endpoint
      body: {
        fullName: this.fullName,
        email: this.email,
        // Add this
        phoneNumber: this.phoneNumber,
        password: this.password
      },
      headers: { "Content-Type": "application/json" }
    }).then((response) => {
      this.success = response.message || i18n.registerSuccess;
      this.fullName = "";
      this.email = "";
      this.phoneNumber = "";
      this.password = "";
      this.loading = false;
      m.redraw();
    }).catch((error) => {
      this.error = error.error || "Pendaftaran gagal";
      this.loading = false;
      m.redraw();
    });
  },
  view() {
    return m("main.container", [
      m("h1", i18n.register),
      m("form", {
        onsubmit: (e) => {
          e.preventDefault();
          this.register();
        }
      }, [
        m("label", { for: "fullName" }, i18n.fullName),
        m("input", {
          id: "fullName",
          type: "text",
          value: this.fullName,
          oninput: (e) => {
            this.fullName = e.target.value;
          },
          required: true
        }),
        m("label", { for: "email" }, i18n.email),
        // Add this
        m("input", {
          id: "email",
          type: "email",
          value: this.email,
          oninput: (e) => {
            this.email = e.target.value;
          },
          required: true
        }),
        m("label", { for: "phoneNumber" }, i18n.phoneNumber),
        m("input", {
          id: "phoneNumber",
          type: "tel",
          value: this.phoneNumber,
          oninput: (e) => {
            this.phoneNumber = e.target.value;
          },
          required: true
        }),
        m("label", { for: "password" }, i18n.password),
        m("input", {
          id: "password",
          type: "password",
          value: this.password,
          oninput: (e) => {
            this.password = e.target.value;
          },
          required: true
        }),
        m("button[type=submit]", { disabled: this.loading }, i18n.register),
        this.success && m("div.success", this.success),
        this.error && m("div.error", this.error)
      ]),
      m("p", [
        "Sudah punya akun? ",
        m("a", { href: "#!/app/login" }, i18n.login)
      ])
    ]);
  }
};

// src/components/SubmissionForm.js
var SubmissionForm_default = {
  tps: "",
  village: "",
  district: "",
  totalVotes: "",
  calegVotes: "",
  photo: null,
  latitude: "",
  longitude: "",
  provinsiCode: "",
  kabupatenKotaCode: "",
  kecamatanCode: "",
  kelurahanDesaCode: "",
  loading: false,
  error: "",
  success: "",
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
      this.editMode = true;
      this.submissionId = vnode.attrs.submission._id;
      this.populateForm(vnode.attrs.submission);
    } else if (vnode.attrs.id) {
      this.editMode = true;
      this.submissionId = vnode.attrs.id;
      await this.fetchSubmissionData();
    } else if (vnode.attrs.prefill) {
      this.prefillData = vnode.attrs.prefill;
      this.village = vnode.attrs.prefill.village || "";
      this.district = vnode.attrs.prefill.district || "";
      this.provinsiCode = vnode.attrs.prefill.provinsiCode || "";
      this.kabupatenKotaCode = vnode.attrs.prefill.kabupatenKotaCode || "";
      this.kecamatanCode = vnode.attrs.prefill.kecamatanCode || "";
      this.kelurahanDesaCode = vnode.attrs.prefill.kelurahanDesaCode || "";
      this.tps = vnode.attrs.prefill.tps || "";
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
    console.log("SubmissionForm: populateForm called with:", response);
    this.photoChanged = false;
    this.photoBase64 = null;
    this.photoMime = null;
    this.photo = null;
    this.hasExistingPhoto = false;
    this.tps = response.tps || response.tpsNumber || "";
    this.totalVotes = response.totalVotes || response.votes || "";
    this.calegVotes = response.calegVotes || "";
    if (response.location && response.location.coordinates && response.location.coordinates.length === 2) {
      this.longitude = response.location.coordinates[0];
      this.latitude = response.location.coordinates[1];
    } else if (response.latitude && response.longitude) {
      this.latitude = response.latitude;
      this.longitude = response.longitude;
    }
    this.provinsiCode = response.provinsiCode || "";
    this.kabupatenKotaCode = response.kabupatenKotaCode || "";
    this.kecamatanCode = response.kecamatanCode || "";
    this.kelurahanDesaCode = response.kelurahanDesaCode || "";
    const kec = this.areaData.kecamatanList.find((k) => k.code === this.kecamatanCode);
    this.district = kec?.name || response.district || this.kecamatanCode || "N/A";
    const desa = this.areaData.desaList.find((d) => d.code === this.kelurahanDesaCode);
    this.village = desa?.name || response.village || this.kelurahanDesaCode || "N/A";
    if (response.hasPhoto || response.photo || response.photoMime) {
      this.hasExistingPhoto = true;
      this.photoPreview = `/api/photo/${response._id || this.submissionId}?t=${Date.now()}`;
      console.log("SubmissionForm: Set photo preview:", this.photoPreview);
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
        method: "GET",
        url: `/api/submissions/${this.submissionId}`,
        headers: {
          Authorization: "Bearer " + localStorage.getItem("token")
        }
      });
      if (response) {
        this.populateForm(response);
      }
    } catch (error) {
      console.error("Error fetching submission data:", error);
      this.error = "Gagal memuat data untuk diedit: " + (error.response?.error || error.message || "Unknown error");
    } finally {
      this.loading = false;
      m.redraw();
    }
  },
  getLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.latitude = position.coords.latitude;
          this.longitude = position.coords.longitude;
          m.redraw();
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  },
  async handleFileUpload(e) {
    const file = e.target.files[0];
    console.log("[PHOTO] File selected:", file?.name || "No file");
    if (!file) {
      this.photo = null;
      this.photoBase64 = null;
      this.photoMime = null;
      this.photoProcessing = false;
      this.photoChanged = true;
      if (this.editMode) {
        this.photoPreview = null;
        this.hasExistingPhoto = false;
      }
      m.redraw();
      return;
    }
    this.photo = file;
    this.photoProcessing = true;
    this.photoChanged = true;
    this.photoBase64 = null;
    this.photoPreview = URL.createObjectURL(file);
    m.redraw();
    console.log("[PHOTO] Started Base64 conversion...");
    try {
      const dataUrl = await this.fileToBase64(file);
      this.photoBase64 = dataUrl.split(",")[1];
      this.photoMime = file.type;
      this.photoProcessing = false;
      console.log("[PHOTO] Base64 conversion completed");
      m.redraw();
    } catch (error) {
      console.error("[PHOTO] Conversion error:", error);
      this.error = "Gagal memproses file gambar.";
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
      reader.onerror = (error) => reject(error);
    });
  },
  /**
   * Validates the form data before submission.
   * @returns {string|null} An error message string if validation fails, otherwise null.
   */
  _validate() {
    if (!this.editMode && !this.photo)
      return "Foto bukti wajib diunggah.";
    if (this.photo && this.photoProcessing)
      return "Gambar masih diproses, mohon tunggu...";
    if (this.photo && !this.photoBase64)
      return "Gambar gagal diproses. Silakan unggah ulang.";
    const totalVotesNum = parseInt(this.totalVotes, 10) || 0;
    const calegVotesNum = parseInt(this.calegVotes, 10) || 0;
    if (calegVotesNum > totalVotesNum)
      return "Jumlah suara caleg tidak boleh melebihi total suara.";
    return null;
  },
  /**
   * Constructs the payload object for the API request.
   * @returns {object} The submission payload.
   */
  _buildPayload() {
    const payload = {
      tps: this.tps,
      totalVotes: parseInt(this.totalVotes, 10) || 0,
      calegVotes: parseInt(this.calegVotes, 10) || 0,
      provinsiCode: this.provinsiCode,
      kabupatenKotaCode: this.kabupatenKotaCode,
      kecamatanCode: this.kecamatanCode,
      kelurahanDesaCode: this.kelurahanDesaCode,
      latitude: this.latitude,
      longitude: this.longitude
    };
    if (this.photoChanged) {
      if (this.photoBase64) {
        payload.photoBase64 = `data:${this.photoMime};base64,${this.photoBase64}`;
        console.log("[SUBMIT] Including new photo in payload");
      } else if (!this.photo && this.editMode) {
        payload.removePhoto = true;
        console.log("[SUBMIT] Removing photo in edit mode");
      }
    }
    return payload;
  },
  /**
   * Parses an API error and returns a user-friendly message.
   * @param {object} error - The error object from the m.request catch block.
   * @returns {string} The error message to display.
   */
  _handleApiError(error) {
    const responseBody = error.response || error;
    if (responseBody && typeof responseBody === "object" && responseBody.error) {
      let errorMessage = responseBody.error;
      if (responseBody.details && typeof responseBody.details === "object") {
        const messages = Object.values(responseBody.details).map((detail) => detail.message).join(", ");
        if (messages)
          errorMessage += `: ${messages}`;
      }
      return errorMessage;
    }
    return this.editMode ? "Gagal memperbarui data" : "Gagal mengirim data";
  },
  /**
   * Handles the successful API response.
   */
  _handleSuccess() {
    this.loading = false;
    this.success = this.editMode ? "Data berhasil diperbarui!" : "Data berhasil dikirim!";
    if (this.editMode) {
      this.photoChanged = false;
      if (this.hasExistingPhoto || this.photoBase64) {
        this.photoPreview = `/api/photo/${this.submissionId}?t=${Date.now()}`;
      }
    } else {
      this.resetForm();
    }
    if (this.onsuccess && typeof this.onsuccess === "function") {
      this.onsuccess();
    }
    m.redraw();
  },
  async submit() {
    this.loading = true;
    this.error = "";
    this.success = "";
    const validationError = this._validate();
    if (validationError) {
      this.error = validationError;
      this.loading = false;
      m.redraw();
      return;
    }
    try {
      const url = this.editMode ? "/api/submission" : "/api/submission";
      const method = this.editMode ? "PUT" : "POST";
      const payload = this._buildPayload();
      if (this.editMode)
        payload.id = this.submissionId;
      await m.request({
        method,
        url,
        body: payload,
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + localStorage.getItem("token") }
      });
      await m.request({
        method: "POST",
        url: "/api/submission_detail",
        body: { id: this.submissionId },
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + localStorage.getItem("token") }
      });
      this._handleSuccess();
    } catch (error) {
      this.error = this._handleApiError(error);
      this.loading = false;
      m.redraw();
    }
  },
  resetForm() {
    this.tps = "";
    this.totalVotes = "";
    this.calegVotes = "";
    this.photo = null;
    this.photoBase64 = null;
    this.photoPreview = null;
    this.photoMime = null;
    this.photoProcessing = false;
    this.photoChanged = false;
    this.hasExistingPhoto = false;
    this.latitude = "";
    this.longitude = "";
    const fileInput = document.querySelector("#photo");
    if (fileInput)
      fileInput.value = "";
  },
  view() {
    return m("form", {
      onsubmit: (e) => {
        e.preventDefault();
        this.submit();
      }
    }, [
      // Edit mode indicator
      this.editMode && m("div", {
        style: {
          marginBottom: "1rem",
          padding: "0.5rem",
          backgroundColor: "#e3f2fd",
          borderRadius: "4px",
          textAlign: "center"
        }
      }, [
        m("strong", "Mode Edit - Memperbarui data submission")
      ]),
      // Village field
      !this.hideFields.includes("village") && [
        m("label", { for: "village" }, i18n.village),
        m("input", {
          id: "village",
          type: "text",
          value: this.village,
          disabled: true,
          required: true
        })
      ],
      // District field
      !this.hideFields.includes("district") && [
        m("label", { for: "district" }, i18n.district),
        m("input", {
          id: "district",
          type: "text",
          value: this.district,
          disabled: true,
          required: true
        })
      ],
      // TPS field
      m("label", { for: "tps" }, i18n.tps),
      m("input", {
        id: "tps",
        type: "text",
        value: this.tps,
        oninput: (e) => {
          this.tps = e.target.value;
        },
        required: true
      }),
      // Total votes field
      m("label", { for: "totalVotes" }, i18n.totalVotes),
      m("input", {
        id: "totalVotes",
        type: "number",
        value: this.totalVotes,
        oninput: (e) => {
          this.totalVotes = e.target.value;
        },
        required: true
      }),
      // Caleg votes field
      m("label", { for: "calegVotes" }, i18n.calegVotes),
      m("input", {
        id: "calegVotes",
        type: "number",
        value: this.calegVotes,
        oninput: (e) => {
          this.calegVotes = e.target.value;
        },
        required: true
      }),
      // Photo field
      m("label", { for: "photo" }, i18n.photo + (this.editMode ? " (Kosongkan jika tidak ingin mengubah)" : "")),
      m("input", {
        id: "photo",
        type: "file",
        accept: "image/*",
        onchange: (e) => this.handleFileUpload(e),
        required: !this.editMode
      }),
      // Show existing photo status in edit mode
      this.editMode && !this.photoChanged && this.hasExistingPhoto && m("div", {
        style: { marginTop: "0.5rem", padding: "0.5rem", backgroundColor: "#f5f5f5", borderRadius: "4px" }
      }, [
        m("small", "Foto saat ini:"),
        m("br"),
        m("img", {
          src: this.photoPreview,
          style: { maxWidth: "100px", maxHeight: "100px", marginTop: "0.5rem" },
          alt: "Foto saat ini",
          onerror: (e) => {
            console.error("Failed to load existing photo");
            e.target.style.display = "none";
          }
        })
      ]),
      // Show photo preview for new/changed photos
      this.photoPreview && (this.photoChanged || !this.editMode) && m("img", {
        src: this.photoPreview,
        style: {
          maxWidth: "100%",
          maxHeight: "200px",
          marginTop: "1rem",
          display: "block"
        },
        alt: "Pratinjau Foto"
      }),
      // Processing indicator
      this.photoProcessing && m("div", {
        style: { marginTop: "0.5rem", color: "#666" }
      }, "Memproses gambar..."),
      // Location section
      m("div", [
        m("label", "Lokasi GPS"),
        m("button", {
          type: "button",
          onclick: () => this.getLocation()
        }, "Dapatkan Lokasi"),
        this.latitude && this.longitude && m("p", `Lat: ${this.latitude}, Lng: ${this.longitude}`)
      ]),
      // Submit button
      m(
        "button[type=submit]",
        {
          disabled: this.loading || this.photoProcessing
        },
        this.loading ? this.editMode ? "Memperbarui..." : "Mengirim..." : this.editMode ? "Perbarui Data" : i18n.submit
      ),
      // Messages
      this.success && m("div.success", this.success),
      this.error && m("div.error", this.error)
    ]);
  }
};

// src/utils.js
var getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};
var apiRequest = (options) => {
  const authHeaders = getAuthHeaders();
  const headers = { ...authHeaders, ...options.headers };
  return m.request({ ...options, headers });
};
var logout = () => {
  localStorage.removeItem("token");
  m.route.set("/app/login");
};

// src/components/Dashboard.js
var cardStyle = {
  cursor: "pointer",
  textAlign: "center",
  padding: "calc(var(--spacing) * 1.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "8rem"
};
var cardHeaderStyle = {
  margin: 0,
  fontWeight: 400
  // Use a lighter font weight than the default bold for h3
};
var Dashboard_default = {
  area: null,
  calegName: "",
  kecamatanList: [],
  desaList: [],
  selectedKecamatan: null,
  // { code, name }
  selectedDesa: null,
  // { code, name }
  loading: true,
  loadingDesa: false,
  loadingSubmissions: false,
  userSubmissions: [],
  error: "",
  isModalOpen: false,
  modalImageUrl: "",
  isEditModalOpen: false,
  editingSubmissionId: null,
  async oninit() {
    this.loading = true;
    this.error = "";
    try {
      const [area, calegData] = await Promise.all([
        apiRequest({ method: "GET", url: "/api/area-setting" }),
        apiRequest({ method: "GET", url: "/api/caleg" }).catch(() => ({}))
        // Don't fail if caleg isn't set
      ]);
      this.area = area;
      if (calegData && calegData.name) {
        this.calegName = calegData.name;
      }
      if (this.area && this.area.kabupatenKota && this.area.provinsi && this.calegName) {
        this.kecamatanList = await apiRequest({
          method: "POST",
          url: "/api/kecamatan",
          body: {
            kabupatenCode: this.area.kabupatenKota,
            provinsiCode: this.area.provinsi
          },
          headers: { "Content-Type": "application/json" }
        });
      } else {
        this.kecamatanList = [];
      }
    } catch (e) {
      this.error = e.response?.error || "Gagal memuat data dasbor.";
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
      return;
    }
    this.selectedKecamatan = kecamatan;
    this.desaList = [];
    this.loadingDesa = true;
    this.error = "";
    m.redraw();
    try {
      const { provinsi, kabupatenKota } = this.area;
      this.desaList = await apiRequest({
        method: "POST",
        url: "/api/kelurahan",
        body: {
          provinsiCode: provinsi,
          kabupatenCode: kabupatenKota,
          kecamatanCode: kecamatan.code
        },
        headers: { "Content-Type": "application/json" }
      });
    } catch (e) {
      this.error = e.response?.error || "Gagal memuat daftar desa.";
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
    console.log("fetchUserSubmissions called with desaCode:", desaCode);
    console.log("selectedKecamatan:", this.selectedKecamatan);
    console.log("selectedDesa:", this.selectedDesa);
    this.loadingSubmissions = true;
    this.userSubmissions = [];
    m.redraw();
    try {
      const response = await apiRequest({
        method: "POST",
        url: "/api/mysubs",
        body: { kelurahanDesaCode: desaCode },
        headers: { "Content-Type": "application/json" }
      });
      this.userSubmissions = response || [];
      console.log("userSubmissions set to:", this.userSubmissions);
    } catch (e) {
      console.error("Could not fetch user's submissions", e);
      console.error("Error details:", e.response);
      this.userSubmissions = [];
    } finally {
      this.loadingSubmissions = false;
      m.redraw();
    }
  },
  // PATCH: Use POST with body for kecamatan fetch
  fetchKecamatan() {
    if (!this.area.kabupatenKota || !this.area.provinsi)
      return Promise.resolve([]);
    return m.request({
      method: "POST",
      url: "/api/kecamatan",
      body: {
        kabupatenCode: this.area.kabupatenKota,
        provinsiCode: this.area.provinsi
      },
      headers: { "Content-Type": "application/json" }
    });
  },
  // PATCH: Use POST with body for desa/kelurahan fetch
  fetchDesa() {
    if (!this.area.kabupatenKota || !this.area.provinsi || !this.area.kecamatan)
      return Promise.resolve([]);
    return m.request({
      method: "POST",
      url: "/api/kelurahan",
      body: {
        provinsiCode: this.area.provinsi,
        kabupatenCode: this.area.kabupatenKota,
        kecamatanCode: this.area.kecamatan
      },
      headers: { "Content-Type": "application/json" }
    });
  },
  renderCalegInfoBox() {
    if (!this.calegName)
      return null;
    return m(
      "div",
      { style: { marginBottom: "1rem", background: "#f5f5f5", padding: "0.75rem", borderRadius: "6px", textAlign: "center" } },
      m("strong", `Caleg: ${this.calegName}`)
    );
  },
  renderEditModal() {
    if (!this.isEditModalOpen)
      return null;
    return m("dialog", { open: true }, [
      m("article", [
        m("header", [
          m("a.close", {
            href: "#",
            "aria-label": "Close",
            onclick: (e) => {
              e.preventDefault();
              this.isEditModalOpen = false;
              m.redraw();
            }
          })
        ]),
        m("div", "Edit form/modal content here...")
      ])
    ]);
  },
  renderPhotoModal() {
    if (!this.isModalOpen)
      return null;
    return m("dialog", { open: true }, [
      m("article", [
        m("header", [
          m("a.close", {
            href: "#",
            "aria-label": "Close",
            onclick: (e) => {
              e.preventDefault();
              this.isModalOpen = false;
              m.redraw();
            }
          })
        ]),
        m("div", { style: { textAlign: "center" } }, [
          m("img", {
            src: this.modalImageUrl,
            style: { maxWidth: "100%", maxHeight: "70vh" },
            alt: "Bukti Foto",
            onerror: (e) => {
              e.target.parentNode.innerHTML = '<p class="error">Gagal memuat gambar</p>';
            }
          })
        ])
      ])
    ]);
  },
  openEditModal(submissionId) {
    this.isEditModalOpen = true;
    this.editingSubmissionId = submissionId;
    m.redraw();
  },
  async openPhotoModal(submissionId, photoUrl = null) {
    this.isModalOpen = true;
    if (photoUrl) {
      this.modalImageUrl = photoUrl;
    } else {
      const fetchedUrl = await this.fetchPhotoData(submissionId);
      this.modalImageUrl = fetchedUrl || `/api/submissions/photo/${submissionId}`;
    }
    m.redraw();
  },
  // Add this new method to fetch photo data properly
  async fetchPhotoData(submissionId) {
    const response = await apiRequest({
      method: "POST",
      url: "/api/photo",
      body: { id: submissionId },
      headers: { "Content-Type": "application/json" },
      extract: true
    });
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  },
  view() {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const isAdmin = user.role === "admin";
    if (this.loading) {
      return m("main.container", m("p", i18n.loading));
    }
    if (this.error && !this.loadingDesa) {
      return m("main.container", [
        m("h2", i18n.dashboard),
        m("p.error", this.error),
        isAdmin && m("button", { onclick: () => {
          m.route.set("/app/admin");
        }, style: { marginRight: "1rem" } }, "Ke Halaman Admin"),
        m("button", { onclick: logout }, i18n.logout)
      ]);
    }
    if (!this.area || !this.area.kabupatenKota) {
      return m("main.container", [
        m("h2", i18n.dashboard),
        m("p", "Area belum diatur oleh admin."),
        isAdmin && m("button", { onclick: () => {
          m.route.set("/app/admin");
        }, style: { marginRight: "1rem" } }, "Ke Halaman Admin"),
        m("button", { onclick: logout }, i18n.logout)
      ]);
    }
    if (this.selectedKecamatan && this.selectedDesa) {
      return m("main.container", [
        m("h4", { style: { marginTop: "var(--spacing)" } }, "Data Terkirim di Desa Ini"),
        this.loadingSubmissions ? m("p", i18n.loading) : this.userSubmissions.length > 0 ? m("table", { role: "grid" }, [
          m("thead", m("tr", [
            m("th", "TPS"),
            m("th", "Suara"),
            m("th", "Foto"),
            m("th", "GPS"),
            m("th", "")
          ])),
          m("tbody", this.userSubmissions.map((s) => m("tr", [
            m("td", s.tpsNumber),
            m("td", s.votes),
            m(
              "td",
              m(
                "div",
                {
                  style: {
                    width: "40px",
                    height: "40px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  },
                  onclick: async () => {
                    const photoUrl = await this.fetchPhotoData(s._id);
                    if (photoUrl) {
                      this.openPhotoModal(s._id, photoUrl);
                    } else {
                      alert("Gagal memuat foto");
                    }
                  }
                },
                s._id ? m("img", {
                  // Don't use direct URL, but a placeholder that will be replaced with fetchPhotoData
                  src: "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
                  style: { maxHeight: "40px", maxWidth: "40px", display: "none" },
                  alt: "Bukti Foto",
                  oncreate: async (vnode) => {
                    const photoUrl = await this.fetchPhotoData(s._id);
                    if (photoUrl) {
                      vnode.dom.src = photoUrl;
                      vnode.dom.style.display = "block";
                    } else {
                      vnode.dom.parentNode.innerHTML = "\u274C";
                    }
                  }
                }) : "\u274C"
              )
            ),
            m("td", s.hasLocation ? "\u2705" : "\u274C"),
            m("td", m("button", {
              class: "outline secondary",
              style: {
                margin: 0,
                padding: "0.25rem 0.75rem",
                fontSize: "0.8rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              },
              onclick: () => this.openEditModal(s._id),
              title: "Edit"
            }, "\u270F\uFE0F"))
          ])))
        ]) : m("p", "Belum ada data yang dikirim untuk desa ini."),
        m("hr"),
        m("h3", `Input Data untuk ${this.selectedDesa.name}`),
        this.calegName && m(
          "p",
          { style: { fontStyle: "italic", textAlign: "center", marginTop: "calc(var(--spacing) * -0.5)", marginBottom: "var(--spacing)" } },
          `(Suara untuk Caleg: ${this.calegName})`
        ),
        m(SubmissionForm_default, {
          prefill: {
            village: this.selectedDesa.name,
            district: this.selectedKecamatan.name,
            provinsiCode: this.area.provinsi,
            kabupatenKotaCode: this.area.kabupatenKota,
            kecamatanCode: this.selectedKecamatan.code,
            kelurahanDesaCode: this.selectedDesa.code
          },
          onsuccess: () => {
            console.log("SubmissionForm success callback called");
            console.log("About to fetch submissions for desa code:", this.selectedDesa.code);
            setTimeout(() => {
              this.fetchUserSubmissions(this.selectedDesa.code);
            }, 500);
          }
        }),
        m(
          "footer",
          { style: { paddingTop: "var(--spacing)" } },
          m(
            ".grid",
            m("button", { class: "secondary", onclick: () => this.backToDesaList() }, "Kembali ke Daftar Desa"),
            m("button", { class: "contrast", onclick: logout }, i18n.logout)
          ),
          this.renderEditModal()
        ),
        this.renderPhotoModal()
      ]);
    }
    if (this.selectedKecamatan) {
      return m("main.container", [
        m("h2", i18n.dashboard),
        this.renderCalegInfoBox(),
        m("h3", `Pilih Desa/Kelurahan di Kecamatan ${this.selectedKecamatan.name}`),
        this.loadingDesa ? m("p", i18n.loading) : m(
          ".grid",
          { style: { gridTemplateColumns: "repeat(auto-fit, minmax(12rem, 1fr))" } },
          this.desaList.map(
            (d) => m(
              "article",
              {
                onclick: () => this.selectDesa(d),
                style: cardStyle
              },
              m("h3", { style: cardHeaderStyle }, d.name)
            )
          )
        ),
        this.error && m("p.error", this.error),
        m(
          "footer",
          { style: { paddingTop: "var(--spacing)" } },
          m(
            ".grid",
            m("button", { class: "secondary", onclick: () => this.backToKecamatanList() }, "Kembali ke Daftar Kecamatan"),
            m("button", { class: "contrast", onclick: logout }, i18n.logout)
          )
        )
      ]);
    }
    return m("main.container", [
      m("h2", i18n.dashboard),
      this.renderCalegInfoBox(),
      m("h3", "Pilih Kecamatan"),
      !this.calegName && m("p", { style: { color: "var(--pico-color-red-500)", fontWeight: 500, marginBottom: "1rem" } }, "Nama caleg belum diatur. Silakan hubungi admin."),
      m(
        ".grid",
        { style: { gridTemplateColumns: "repeat(auto-fit, minmax(12rem, 1fr))" } },
        this.kecamatanList.map(
          (k) => m(
            "article",
            {
              onclick: this.calegName ? () => this.selectKecamatan(k) : null,
              style: Object.assign({}, cardStyle, !this.calegName ? { opacity: 0.5, pointerEvents: "none", cursor: "not-allowed" } : {})
            },
            m("h3", { style: cardHeaderStyle }, k.name)
          )
        )
      ),
      m(
        "footer",
        { style: { paddingTop: "var(--spacing)" } },
        [
          isAdmin && m("button", { style: { marginRight: "1rem" }, onclick: () => m.route.set("/app/admin") }, "Ke Halaman Admin"),
          m("button", { class: "contrast", onclick: logout }, i18n.logout)
        ]
      )
    ]);
  }
};

// src/components/AreaSetting.js
var AreaSetting_default = {
  provinsiList: [],
  kabupatenList: [],
  selectedProvinsi: "",
  selectedKabupaten: "",
  loading: false,
  provinsiLoading: true,
  kabupatenLoading: false,
  success: "",
  error: "",
  areaSet: false,
  areaDisplay: "",
  showEdit: false,
  editSecret: "",
  editSecretError: "",
  oninit() {
    console.log("AreaSetting oninit called");
    this.provinsiLoading = true;
    m.request({ method: "GET", url: "/api/provinsi" }).then((data) => {
      console.log("Provinsi data:", data);
      this.provinsiList = data;
      this.provinsiLoading = false;
      m.redraw();
      const token = localStorage.getItem("token");
      const authHeader = token ? { Authorization: `Bearer ${token}` } : {};
      m.request({
        method: "GET",
        url: "/api/area-setting",
        headers: authHeader
      }).then((setting) => {
        console.log("Fetched area setting:", setting);
        if (setting && setting.provinsi && setting.kabupatenKota) {
          this.selectedProvinsi = setting.provinsi;
          this.selectedKabupaten = setting.kabupatenKota;
          this.areaSet = true;
          const prov = this.provinsiList.find((p) => p.code === setting.provinsi);
          if (prov) {
            m.request({
              method: "POST",
              url: "/api/kabupatenkota",
              body: { provinsiCode: prov.code },
              headers: { "Content-Type": "application/json" }
            }).then((kabupatenList) => {
              this.kabupatenList = kabupatenList;
              const kab = this.kabupatenList.find((k) => k.code === setting.kabupatenKota);
              const provName = prov ? prov.name : setting.provinsi;
              const kabName = kab ? kab.name : setting.kabupatenKota;
              this.areaDisplay = `${provName} / ${kabName}`;
              m.redraw();
            });
          } else {
            this.areaDisplay = `${setting.provinsi} / ${setting.kabupatenKota}`;
            m.redraw();
          }
        } else {
          this.areaSet = false;
          this.selectedProvinsi = "";
          this.selectedKabupaten = "";
          this.kabupatenList = [];
          this.areaDisplay = "";
          m.redraw();
        }
      });
    }).catch(() => {
      this.provinsiLoading = false;
      m.redraw();
    });
  },
  fetchKabupaten() {
    if (!this.selectedProvinsi)
      return;
    this.kabupatenLoading = true;
    console.log("Fetching kabupaten for provinsi:", this.selectedProvinsi);
    m.request({
      method: "POST",
      url: "/api/kabupatenkota",
      body: { provinsiCode: this.selectedProvinsi },
      headers: { "Content-Type": "application/json" }
    }).then((data) => {
      console.log("Fetched kabupaten list:", data);
      this.kabupatenList = data;
      this.kabupatenLoading = false;
      m.redraw();
    }).catch(() => {
      this.kabupatenList = [];
      this.kabupatenLoading = false;
      m.redraw();
    });
  },
  save() {
    this.loading = true;
    this.success = "";
    this.error = "";
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    console.log("[AREA SETTING] User from localStorage:", user);
    const authHeader = token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
    const postBody = {
      provinsi: this.selectedProvinsi,
      kabupatenKota: this.selectedKabupaten,
      admin: user.id || user._id
    };
    console.log("[AREA SETTING] Sending POST body:", postBody);
    m.request({
      method: "POST",
      url: "/api/area-setting",
      body: postBody,
      headers: authHeader
    }).then(() => {
      this.loading = false;
      this.success = "";
      this.error = "";
      this.showEdit = false;
      this.editSecret = "";
      const prov = this.provinsiList.find((p) => p.code === this.selectedProvinsi);
      this.areaDisplay = `${prov ? prov.name : this.selectedProvinsi} / ${this.kabupatenList.find((k) => k.code === this.selectedKabupaten)?.name || this.selectedKabupaten}`;
      this.areaSet = true;
      m.redraw();
    }).catch(() => {
      this.error = i18n.saveError || "Gagal menyimpan";
      this.loading = false;
      m.redraw();
    });
  },
  view(vnode) {
    const hasSubmissions = vnode.attrs.hasSubmissions || false;
    if (this.provinsiLoading) {
      return m("section", [m("p", "Memuat...")]);
    }
    if (this.areaSet && !this.showEdit) {
      return m("section", [
        m("h3", i18n.areaSetting || "Pengaturan Area"),
        m("div", [
          m("strong", i18n.currentArea || "Area Saat Ini:"),
          " ",
          this.areaDisplay ? m("span", this.areaDisplay) : m("span", "Area belum diatur.")
        ]),
        m("button", {
          onclick: () => {
            this.showEdit = true;
          },
          disabled: hasSubmissions
        }, i18n.editArea || "Ubah Area"),
        hasSubmissions && m("p", {
          style: {
            fontSize: "0.8rem",
            fontStyle: "italic",
            marginTop: "0.5rem",
            color: "var(--pico-color-red-500)"
          }
        }, "Pengaturan tidak dapat diubah karena sudah ada data suara yang masuk.")
      ]);
    }
    return m("section", [
      m("h3", i18n.areaSetting || "Pengaturan Area"),
      m("form", {
        onsubmit: (e) => {
          e.preventDefault();
          this.save();
        }
      }, [
        m("label", { for: "provinsi" }, i18n.province || "Provinsi"),
        m("select", {
          id: "provinsi",
          onchange: (e) => {
            this.selectedProvinsi = e.target.value;
            this.selectedKabupaten = "";
            this.kabupatenList = [];
            if (this.selectedProvinsi)
              this.fetchKabupaten();
            m.redraw();
          },
          value: this.selectedProvinsi,
          disabled: this.provinsiLoading
        }, [
          m("option", { value: "" }, i18n.selectProvince || "Pilih Provinsi"),
          ...this.provinsiList.map((p) => m("option", { value: p.code }, p.name))
        ]),
        m("label", { for: "kabupaten" }, i18n.kabupatenKota || "Kabupaten/Kota"),
        m("select", {
          id: "kabupaten",
          onchange: (e) => {
            this.selectedKabupaten = e.target.value;
          },
          value: this.selectedKabupaten,
          disabled: !this.selectedProvinsi || this.kabupatenLoading
        }, [
          this.kabupatenLoading ? m("option", { value: "" }, "Memuat...") : [
            m("option", { value: "" }, i18n.selectKabupaten || "Pilih Kabupaten/Kota"),
            ...this.kabupatenList.map((k) => m("option", { value: k.code }, k.name))
          ]
        ]),
        m("button[type=submit]", {
          disabled: this.loading || !this.selectedProvinsi || !this.selectedKabupaten
        }, i18n.save || "Simpan"),
        this.success && m("div.success", this.success),
        this.error && m("div.error", this.error)
      ])
    ]);
  }
};

// src/components/CalegSetting.js
var CalegSetting_default = {
  caleg: "",
  showEdit: false,
  editSecret: "",
  editSecretError: "",
  loading: false,
  error: "",
  oninit() {
    this.loading = true;
    const token = localStorage.getItem("token");
    const authHeader = token ? { Authorization: `Bearer ${token}` } : {};
    m.request({ method: "GET", url: "/api/caleg", headers: authHeader }).then((data) => {
      if (data && data.name) {
        this.caleg = data.name;
        this.showEdit = false;
      } else {
        this.caleg = "";
        this.showEdit = true;
      }
      this.loading = false;
      m.redraw();
    }).catch(() => {
      this.caleg = "";
      this.showEdit = true;
      this.loading = false;
      m.redraw();
    });
  },
  save(name) {
    this.loading = true;
    this.error = "";
    const token = localStorage.getItem("token");
    const authHeader = token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
    m.request({
      method: "POST",
      url: "/api/caleg",
      body: { name },
      headers: authHeader
    }).then((res) => {
      this.caleg = res.name;
      this.showEdit = false;
      this.editSecret = "";
      this.editSecretError = "";
      this.loading = false;
      m.redraw();
    }).catch(() => {
      this.error = i18n.saveError || "Gagal menyimpan";
      this.loading = false;
      m.redraw();
    });
  },
  view(vnode) {
    const hasSubmissions = vnode.attrs.hasSubmissions || false;
    if (this.loading && !this.showEdit) {
      return m("section", [m("p", "Memuat...")]);
    }
    if (this.caleg && !this.showEdit) {
      return m("section", [
        m("h3", i18n.calegSetting || "Caleg"),
        m("div", [
          m("strong", i18n.currentCaleg || "Caleg Saat Ini:"),
          " ",
          this.caleg
        ]),
        m("button", {
          onclick: () => {
            this.showEdit = true;
          },
          disabled: hasSubmissions
        }, i18n.editCaleg || "Ubah Caleg"),
        hasSubmissions && m(
          "p",
          { style: { fontSize: "0.8rem", fontStyle: "italic", marginTop: "0.5rem", color: "var(--pico-color-red-500)" } },
          "Pengaturan tidak dapat diubah karena sudah ada data suara yang masuk."
        )
      ]);
    }
    return m("section", [
      m("h3", i18n.calegSetting || "Caleg"),
      m("form", {
        onsubmit: (e) => {
          e.preventDefault();
          const name = e.target.elements.caleg.value;
          this.save(name);
        }
      }, [
        m("label", { for: "caleg" }, i18n.calegName || "Nama Caleg"),
        m("input[type=text][name=caleg][id=caleg][autocomplete=off]", { value: this.caleg || "", oninput: (e) => {
          this.caleg = e.target.value;
        } }),
        m("button[type=submit]", { disabled: this.loading }, i18n.save || "Simpan"),
        this.error && m("div.error", this.error)
      ])
    ]);
  }
};

// src/components/AdminPanel.js
var AdminPanel_default = {
  currentView: "dashboard",
  unverifiedUsers: [],
  allSubmissions: [],
  // Holds all submissions for summary and filtering
  voteSummary: {
    byKabupaten: {},
    byKecamatan: {},
    byDesa: {}
  },
  // Add filter state
  filters: {
    selectedKabupaten: "all",
    selectedKecamatan: "all",
    selectedDesa: "all"
  },
  availableOptions: {
    kabupaten: [],
    kecamatan: [],
    desa: []
  },
  // Pagination state
  currentPage: 1,
  itemsPerPage: 20,
  // You can adjust this value
  totalPages: 1,
  // Granular loading states
  loading: {
    initial: true,
    users: false,
    submissions: false,
    summary: false
  },
  error: "",
  isMapModalOpen: false,
  mapModalUrl: "",
  // New state for summary table and details modal
  summaryFilterLevel: "all",
  // 'all', 'kecamatan', 'desa'
  summaryFilterKecamatan: "all",
  // kecamatan name for desa filtering
  isDetailsModalOpen: false,
  detailsModalTitle: "",
  submissionsForModal: [],
  // Add state for edit modal
  isEditModalOpen: false,
  editingSubmission: null,
  // Will hold the full submission object
  // Add loading states for individual submissions
  submissionLoadingStates: {},
  // Will track loading state for each submission ID
  // Add area data for displaying names instead of codes
  areaData: {
    kecamatanList: [],
    desaList: []
  },
  oninit() {
    this.checkAdminAccess();
  },
  checkAdminAccess() {
    const token = localStorage.getItem("token");
    if (!token) {
      m.route.set("/app/login");
      return;
    }
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user || user.role !== "admin") {
      m.route.set("/app/dashboard");
      return;
    }
    this.loadDashboardData();
  },
  async loadDashboardData() {
    this.loading.initial = true;
    this.error = "";
    m.redraw();
    try {
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
      this.error = "Gagal memuat data dashboard.";
      console.error("Error loading initial dashboard data:", err);
      if (err.response)
        console.error("Response:", err.response);
      if (err.message)
        console.error("Message:", err.message);
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
      this.error = "Gagal memuat pengguna.";
    } finally {
      this.loading.users = false;
      m.redraw();
    }
  },
  async refreshSubmissionsAndSummary() {
    this.loading.submissions = true;
    this.loading.summary = true;
    m.redraw();
    try {
      this.allSubmissions = await this.loadSubmissions();
      this.totalPages = Math.ceil(this.allSubmissions.length / this.itemsPerPage);
      this.calculateVoteSummary(this.allSubmissions);
    } catch (err) {
      this.error = "Gagal memuat data submission.";
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
        method: "GET",
        url: "/api/area-setting",
        headers: { Authorization: "Bearer " + localStorage.getItem("token") }
      });
      if (areaSetting && areaSetting.kabupatenKota) {
        try {
          const [kecamatanList, desaList] = await Promise.all([
            m.request({
              method: "POST",
              url: "/api/kecamatan",
              body: {
                kabupatenCode: areaSetting.kabupatenKota,
                provinsiCode: areaSetting.provinsi
              },
              headers: { "Content-Type": "application/json" }
            }),
            m.request({
              method: "POST",
              url: "/api/kelurahan",
              body: {
                kabupatenCode: areaSetting.kabupatenKota,
                provinsiCode: areaSetting.provinsi
              },
              headers: { "Content-Type": "application/json" }
            })
          ]);
          return { kecamatanList, desaList };
        } catch (apiErr) {
          console.warn("Failed to load kecamatan/desa:", apiErr);
          return { kecamatanList: [], desaList: [] };
        }
      }
    } catch (err) {
      console.error("Error loading area setting:", err);
    }
    return { kecamatanList: [], desaList: [] };
  },
  // PATCH: Use POST with body for unverified users fetch
  loadUnverifiedUsers() {
    return m.request({
      method: "POST",
      url: "/api/admin_unusers",
      headers: { Authorization: "Bearer " + localStorage.getItem("token") },
      body: {}
    });
  },
  // PATCH: Use POST with body for submissions fetch
  loadSubmissions() {
    return m.request({
      method: "POST",
      url: "/api/admin_subs",
      headers: { Authorization: "Bearer " + localStorage.getItem("token") },
      body: {}
    });
  },
  // Centralized helper to resolve area names consistently
  _getResolvedAreaName(type, sub) {
    if (type === "kecamatan") {
      const code = sub.kecamatanCode;
      if (!code)
        return sub.district || "N/A";
      const fromApi = this.areaData.kecamatanList.find((k) => k.code === code);
      if (fromApi)
        return fromApi.name;
      return sub.district || this.getKecamatanName(code) || code || "N/A";
    }
    if (type === "desa") {
      const code = sub.kelurahanDesaCode;
      if (!code)
        return sub.village || "N/A";
      const fromApi = this.areaData.desaList.find((d) => d.code === code);
      if (fromApi)
        return fromApi.name;
      return sub.village || this.getDesaName(code) || code;
    }
    return "N/A";
  },
  calculateVoteSummary(submissions) {
    const byKecamatan = {};
    const byDesa = {};
    submissions.forEach((sub) => {
      const kecName = this._getResolvedAreaName("kecamatan", sub);
      const desaName = this._getResolvedAreaName("desa", sub);
      if (!byKecamatan[kecName]) {
        byKecamatan[kecName] = {
          calegVotes: 0,
          totalVotes: 0,
          submissions: 0,
          kecamatanName: kecName
        };
      }
      byKecamatan[kecName].submissions += 1;
      if (sub.status === "approved") {
        byKecamatan[kecName].calegVotes += parseInt(sub.calegVotes) || 0;
        byKecamatan[kecName].totalVotes += parseInt(sub.totalVotes || sub.votes) || 0;
      }
      const desaKey = `${kecName}-${desaName}`;
      if (!byDesa[desaKey]) {
        byDesa[desaKey] = {
          calegVotes: 0,
          totalVotes: 0,
          submissions: 0,
          kecamatanName: kecName,
          desaName
        };
      }
      byDesa[desaKey].submissions += 1;
      if (sub.status === "approved") {
        byDesa[desaKey].calegVotes += parseInt(sub.calegVotes) || 0;
        byDesa[desaKey].totalVotes += parseInt(sub.totalVotes || sub.votes) || 0;
      }
    });
    const kecamatanSet = new Set(Object.keys(byKecamatan));
    const desaMap = /* @__PURE__ */ new Map();
    Object.values(byDesa).forEach((desaData) => {
      if (!desaMap.has(desaData.kecamatanName)) {
        desaMap.set(desaData.kecamatanName, /* @__PURE__ */ new Set());
      }
      desaMap.get(desaData.kecamatanName).add(desaData.desaName);
    });
    this.availableOptions = {
      kecamatan: Array.from(kecamatanSet).sort(),
      desa: desaMap
    };
    this.voteSummary = { byKecamatan, byDesa };
    console.log("Vote summary calculated:", this.voteSummary);
    console.log("Available options:", this.availableOptions);
  },
  // Helper methods to convert codes to readable names
  getKecamatanName(code) {
    const kecamatanNames = {
      "010": "DENPASAR SELATAN",
      "020": "DENPASAR UTARA",
      "030": "DENPASAR BARAT",
      "040": "DENPASAR TIMUR"
      // Add more mappings as needed
    };
    return kecamatanNames[code];
  },
  getDesaName(code) {
    const desaNames = {
      "001": "SIDAKARYA",
      // Corrected based on common regional data
      "002": "SANUR KAJA",
      "003": "SANUR KAUH",
      "004": "RENON",
      "005": "SERANGAN",
      "006": "RENON",
      "007": "PANJER",
      "008": "KESIMAN",
      "009": "KESIMAN KERTALANGU",
      "010": "KESIMAN PETILAN"
      // Add more mappings as needed
    };
    return desaNames[code];
  },
  // Get filtered data based on current selections
  getFilteredVoteSummary() {
    const { selectedKecamatan, selectedDesa } = this.filters;
    let filteredKecamatan = {};
    let filteredDesa = {};
    if (selectedKecamatan === "all") {
      filteredKecamatan = { ...this.voteSummary.byKecamatan };
    } else {
      filteredKecamatan[selectedKecamatan] = this.voteSummary.byKecamatan[selectedKecamatan];
    }
    Object.entries(this.voteSummary.byDesa).forEach(([key, data]) => {
      const matchesKecamatan = selectedKecamatan === "all" || data.kecamatanName === selectedKecamatan;
      const matchesDesa = selectedDesa === "all" || data.desaName === selectedDesa;
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
    if (kecName === "all") {
      const allDesa = /* @__PURE__ */ new Set();
      this.availableOptions.desa.forEach((desaSet) => {
        desaSet.forEach((desa) => allDesa.add(desa));
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
    this.filters.selectedDesa = "all";
    m.redraw();
  },
  onDesaChange(value) {
    this.filters.selectedDesa = value;
    m.redraw();
  },
  // --- Map Modal Methods ---
  openMapModal(coordinates) {
    if (!coordinates || coordinates.length !== 2)
      return;
    const [lng, lat] = coordinates;
    this.isMapModalOpen = true;
    this.mapModalUrl = `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`;
    m.redraw();
  },
  closeMapModal() {
    this.isMapModalOpen = false;
    this.mapModalUrl = "";
    m.redraw();
  },
  renderMapModal() {
    if (!this.isMapModalOpen)
      return null;
    return m("dialog", { open: true, onclick: () => this.closeMapModal() }, [
      m("article", {
        style: { padding: "0", maxWidth: "800px", width: "90vw" },
        onclick: (e) => e.stopPropagation()
        // Prevent modal from closing when clicking inside
      }, [
        m(
          "header",
          { style: { padding: "0.5rem 1rem", display: "flex", justifyContent: "flex-end" } },
          m("a.close", { href: "#", "aria-label": "Close", onclick: (e) => {
            e.preventDefault();
            this.closeMapModal();
          } })
        ),
        m(
          "div",
          { style: { padding: "0 1rem 1rem 1rem" } },
          m("iframe", {
            src: this.mapModalUrl,
            width: "100%",
            height: "500",
            style: { border: 0, display: "block" },
            allowfullscreen: "",
            loading: "lazy",
            referrerpolicy: "no-referrer-when-downgrade"
          })
        )
      ])
    ]);
  },
  renderStatsCards() {
    const filteredSummary = this.getFilteredVoteSummary();
    const totalCalegVotes = Object.values(filteredSummary.byKecamatan).reduce((sum, data) => sum + data.calegVotes, 0);
    const totalSahVotes = Object.values(filteredSummary.byKecamatan).reduce((sum, data) => sum + data.totalVotes, 0);
    return m("section.grid", [
      m("article", [
        m("h4", "Pengguna Belum Terverifikasi"),
        m("h2", this.unverifiedUsers.length)
      ]),
      m("article", [
        m("h4", "Total Submission"),
        m("h2", this.allSubmissions.length)
      ]),
      m("article", [
        m("h4", "Total Suara Caleg"),
        m("h2", { style: { color: "#2563eb" } }, totalCalegVotes.toLocaleString("id-ID"))
      ]),
      m("article", [
        m("h4", "Total Suara Sah"),
        m("h2", { style: { color: "#059669" } }, totalSahVotes.toLocaleString("id-ID"))
      ])
    ]);
  },
  renderUnverifiedUsersSection() {
    const unverified = this.unverifiedUsers.filter((user) => user.isVerified === false);
    return m("section", [
      m("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" } }, [
        m("h4", { style: { margin: 0 } }, "Pengguna Belum Terverifikasi"),
        m("button", {
          class: "outline secondary",
          style: { margin: 0, padding: "0.25rem 0.75rem" },
          onclick: () => this.refreshUsers(),
          "aria-busy": this.loading.users
        }, this.loading.users ? m("div", { "aria-busy": "true" }, "Memuat data ..") : "\u{1F504} Refresh")
      ]),
      unverified.length === 0 ? m("p", "Tidak ada pengguna yang perlu diverifikasi") : m("table", [
        m("thead", m("tr", [
          m("th", "Nama"),
          m("th", "No. HP"),
          m("th", "Tanggal Daftar"),
          m("th", "Aksi")
        ])),
        m("tbody", unverified.map(
          (user) => m("tr", [
            m("td", user.fullName),
            m("td", user.phoneNumber),
            m("td", new Date(user.createdAt).toLocaleDateString("id-ID")),
            m("td", m("button", {
              onclick: () => this.verifyUser(user._id)
            }, "Verifikasi"))
          ])
        ))
      ])
    ]);
  },
  renderSubmissionsSection() {
    return m("section", [
      m("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" } }, [
        m("h4", { style: { margin: 0 } }, "Submission Terbaru"),
        m("button", {
          class: "outline secondary",
          style: { margin: 0, padding: "0.25rem 0.75rem" },
          onclick: () => this.refreshSubmissionsAndSummary(),
          "aria-busy": this.loading.submissions
        }, this.loading.submissions ? m("div", { "aria-busy": "true" }, "Memuat data ..") : "\u{1F504} Refresh")
      ]),
      this.allSubmissions.length === 0 ? m("p", "Belum ada submission") : m("table", [
        m("thead", m("tr", [
          m("th", "Volunteer"),
          m("th", "TPS"),
          m("th", "Kecamatan"),
          m("th", "Desa/Kelurahan"),
          m("th", "Suara"),
          m("th", "Foto"),
          m("th", "GPS"),
          m("th", "Status"),
          m("th", "Aksi")
        ])),
        m("tbody", this.getPaginatedSubmissions().map((sub) => {
          const kecamatanName = this._getResolvedAreaName("kecamatan", sub);
          const desaName = this._getResolvedAreaName("desa", sub);
          const isApproving = this.submissionLoadingStates[sub._id]?.approving;
          const isFlagging = this.submissionLoadingStates[sub._id]?.flagging;
          return m("tr", [
            m("td", sub.volunteerDisplayName || "Unknown"),
            m("td", sub.tps || sub.tpsNumber),
            m("td", kecamatanName),
            m("td", desaName),
            m("td", `${sub.calegVotes || ""}/${sub.totalVotes || sub.votes || ""}`),
            m("td", sub.hasPhoto ? m("button", {
              onclick: () => this.viewPhoto(sub._id),
              style: { fontSize: "12px", padding: "4px 8px", background: "#007bff", color: "white", border: "none", borderRadius: "3px", cursor: "pointer" }
            }, "Lihat") : m("span", { style: { color: "#999" } }, "\u274C")),
            m("td", sub.location && sub.location.coordinates && sub.location.coordinates.length === 2 ? m("button", {
              onclick: () => this.openMapModal(sub.location.coordinates),
              title: "Lihat Peta",
              class: "outline secondary",
              style: { margin: 0, padding: "0.25rem 0.5rem", fontSize: "1.1rem", lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center" }
            }, "\u{1F4CD}") : m("span", { style: { color: "#999" } }, "\u274C")),
            m("td", sub.status || "-"),
            m("td", [
              m("button", {
                onclick: () => this.openEditModal(sub._id),
                class: "outline secondary",
                style: { marginRight: "0.5rem", padding: "0.25rem 0.5rem" },
                title: "Edit"
              }, "\u270F\uFE0F"),
              sub.status !== "approved" && m("button", {
                onclick: () => this.approveSubmission(sub._id),
                style: { marginRight: "0.5rem" },
                disabled: isApproving || isFlagging,
                "aria-busy": isApproving ? "true" : null
              }, isApproving ? "Memproses..." : "Setujui"),
              sub.status !== "flagged" && m("button", {
                onclick: () => this.flagSubmission(sub._id),
                class: "secondary",
                style: { marginLeft: "0.5rem" },
                disabled: isFlagging || isApproving,
                "aria-busy": isFlagging ? "true" : null
              }, isFlagging ? "Memproses..." : "Tandai")
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
    this.editingSubmission = null;
    if (this.areaData.kecamatanList.length === 0 || this.areaData.desaList.length === 0) {
      await this.loadAreaData();
    }
    try {
      const submission = await m.request({
        method: "POST",
        url: "/api/submission_detail",
        headers: { Authorization: "Bearer " + localStorage.getItem("token") },
        body: { id: submissionId }
      });
      console.log("AdminPanel: Fetched submission data:", submission);
      console.log("AdminPanel: Available areaData:", this.areaData);
      this.editingSubmission = submission;
    } catch (error) {
      console.error("Error fetching submission data:", error);
      this.error = "Failed to load submission data for editing";
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
    if (!this.isEditModalOpen)
      return null;
    return m("dialog", { open: true }, [
      m("article", [
        m(
          "header",
          m("a.close", {
            href: "#",
            "aria-label": "Close",
            onclick: (e) => {
              e.preventDefault();
              this.closeEditModal();
            }
          })
        ),
        this.editingSubmission ? m(SubmissionForm_default, {
          submission: this.editingSubmission,
          // Pass the full submission object
          areaData: this.areaData,
          // Pass area data for name lookups
          onsuccess: () => {
            this.closeEditModal();
            this.refreshSubmissionsAndSummary();
          }
        }) : m("div", { "aria-busy": "true" }, "Memuat data submission...")
      ])
    ]);
  },
  // Add a method to handle photo viewing
  viewPhoto(submissionId) {
    window.open(`/api/photo/${submissionId}`, "_blank");
  },
  // --- Details Modal Methods ---
  openDetailsModal(filterType, identifier) {
    this.isDetailsModalOpen = true;
    let filtered = [];
    if (filterType === "all") {
      this.detailsModalTitle = "Semua Submission";
      filtered = this.allSubmissions;
    } else if (filterType === "kecamatan") {
      this.detailsModalTitle = `Submission untuk Kecamatan: ${identifier}`;
      filtered = this.allSubmissions.filter(
        (sub) => (this.areaData.kecamatanList.find((k) => k.code === sub.kecamatanCode)?.name || sub.district || sub.kecamatanCode) === identifier
      );
    } else if (filterType === "desa") {
      const { kecamatanName, desaName } = identifier;
      this.detailsModalTitle = `Submission untuk Desa: ${desaName} (Kec. ${kecamatanName})`;
      filtered = this.allSubmissions.filter((sub) => {
        const subKecName = this.areaData.kecamatanList.find((k) => k.code === sub.kecamatanCode)?.name || sub.district || sub.kecamatanCode;
        const subDesaName = this.areaData.desaList.find((d) => d.code === sub.kelurahanDesaCode)?.name || sub.village || sub.kelurahanDesaCode;
        return subKecName === kecamatanName && subDesaName === desaName;
      });
    }
    this.submissionsForModal = filtered;
    m.redraw();
  },
  closeDetailsModal() {
    this.isDetailsModalOpen = false;
    this.detailsModalTitle = "";
    this.submissionsForModal = [];
    m.redraw();
  },
  renderDetailsModal() {
    if (!this.isDetailsModalOpen)
      return null;
    return m("dialog", { open: true }, [
      m("article", { style: { maxWidth: "95vw", width: "1200px" } }, [
        m("header", [
          m("h5", this.detailsModalTitle),
          m("a.close", { href: "#", "aria-label": "Close", onclick: (e) => {
            e.preventDefault();
            this.closeDetailsModal();
          } })
        ]),
        m(
          "div",
          { style: { overflowX: "auto" } },
          m("table", [
            m("thead", m("tr", [
              m("th", "Volunteer"),
              m("th", "TPS"),
              m("th", "Kecamatan"),
              m("th", "Desa/Kelurahan"),
              m("th", "Suara"),
              m("th", "Foto"),
              m("th", "GPS"),
              m("th", "Status"),
              m("th", "Aksi")
            ])),
            m("tbody", this.submissionsForModal.map((sub) => {
              const kecamatanName = this.areaData.kecamatanList.find((k) => k.code === sub.kecamatanCode)?.name || sub.district || sub.kecamatanCode || "N/A";
              const desaName = this.areaData.desaList.find((d) => d.code === sub.kelurahanDesaCode)?.name || sub.village || sub.kelurahanDesaCode || "N/A";
              const isApproving = this.submissionLoadingStates[sub._id]?.approving;
              const isFlagging = this.submissionLoadingStates[sub._id]?.flagging;
              return m("tr", [
                m("td", sub.volunteerDisplayName || "Unknown"),
                m("td", sub.tps || sub.tpsNumber),
                m("td", kecamatanName),
                m("td", desaName),
                m("td", `${sub.calegVotes || ""}/${sub.totalVotes || sub.votes || ""}`),
                m("td", sub.hasPhoto ? m("button", { onclick: () => this.viewPhoto(sub._id) }, "Lihat") : "\u274C"),
                m("td", sub.location && sub.location.coordinates ? m("button", { onclick: () => this.openMapModal(sub.location.coordinates), class: "outline secondary", style: { padding: "0.25rem 0.5rem" } }, "\u{1F4CD}") : "\u274C"),
                m("td", sub.status || "-"),
                m("td", [
                  sub.status !== "approved" && m("button", {
                    onclick: () => this.approveSubmission(sub._id),
                    style: { marginRight: "0.5rem" },
                    disabled: isApproving || isFlagging,
                    "aria-busy": isApproving ? "true" : null
                  }, isApproving ? "Memproses..." : "Setujui"),
                  sub.status !== "flagged" && m("button", {
                    onclick: () => this.flagSubmission(sub._id),
                    class: "secondary",
                    style: { marginLeft: "0.5rem" },
                    disabled: isFlagging || isApproving,
                    "aria-busy": isFlagging ? "true" : null
                  }, isFlagging ? "Memproses..." : "Tandai")
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
    const tableHeaders = ["Area", "Total Submission", "Total Suara Sah", "Total Suara Caleg", "Aksi"];
    if (this.summaryFilterLevel === "all") {
      const totalSubmissions = this.allSubmissions.length;
      const totalSah = summaryByKecamatan.reduce((sum, kec) => sum + kec.totalVotes, 0);
      const totalCaleg = summaryByKecamatan.reduce((sum, kec) => sum + kec.calegVotes, 0);
      tableData.push({ area: "Semua Area", submissions: totalSubmissions, totalVotes: totalSah, calegVotes: totalCaleg, filterType: "all", identifier: "all" });
    } else if (this.summaryFilterLevel === "kecamatan") {
      tableData = summaryByKecamatan.map((kec) => ({ area: kec.kecamatanName, submissions: kec.submissions, totalVotes: kec.totalVotes, calegVotes: kec.calegVotes, filterType: "kecamatan", identifier: kec.kecamatanName }));
    } else if (this.summaryFilterLevel === "desa") {
      const filteredDesa = this.summaryFilterKecamatan === "all" ? summaryByDesa : summaryByDesa.filter((d) => d.kecamatanName === this.summaryFilterKecamatan);
      tableData = filteredDesa.map((desa) => {
        const areaName = this.summaryFilterKecamatan === "all" ? `${desa.desaName} (Kec. ${desa.kecamatanName})` : desa.desaName;
        return { area: areaName, submissions: desa.submissions, totalVotes: desa.totalVotes, calegVotes: desa.calegVotes, filterType: "desa", identifier: { kecamatanName: desa.kecamatanName, desaName: desa.desaName } };
      });
    }
    return m("section", { style: { marginTop: "2rem", borderTop: "1px solid var(--pico-muted-border-color)", paddingTop: "1.5rem" } }, [
      m("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" } }, [
        m("h4", { style: { margin: 0 } }, "Ringkasan Suara Berdasarkan Area"),
        m("button", {
          class: "outline secondary",
          style: { margin: 0, padding: "0.25rem 0.75rem" },
          onclick: () => this.refreshSubmissionsAndSummary(),
          "aria-busy": this.loading.summary
        }, this.loading.summary ? m("div", { "aria-busy": "true" }, "Memuat data ..") : "\u{1F504} Refresh")
      ]),
      m("div.grid", [
        m("div", [
          m("label", { for: "summary-level" }, "Tampilkan Berdasarkan"),
          m("select#summary-level", { onchange: (e) => {
            this.summaryFilterLevel = e.target.value;
            this.summaryFilterKecamatan = "all";
          } }, [
            m("option", { value: "all" }, "Semua"),
            m("option", { value: "kecamatan" }, "Kecamatan"),
            m("option", { value: "desa" }, "Desa/Kelurahan")
          ])
        ]),
        this.summaryFilterLevel === "desa" && m("div", [
          m("label", { for: "summary-kecamatan" }, "Pilih Kecamatan"),
          m("select#summary-kecamatan", { onchange: (e) => this.summaryFilterKecamatan = e.target.value }, [
            m("option", { value: "all" }, "Semua Kecamatan"),
            ...this.availableOptions.kecamatan.map((kecName) => m("option", { value: kecName }, kecName))
          ])
        ])
      ]),
      m("table", { style: { marginTop: "1rem" } }, [
        m("thead", m("tr", tableHeaders.map((h) => m("th", h)))),
        m("tbody", tableData.map((row) => m("tr", [
          m("td", row.area),
          m("td", row.submissions),
          m("td", row.totalVotes.toLocaleString("id-ID")),
          m("td", row.calegVotes.toLocaleString("id-ID")),
          m("td", m("button", { onclick: () => this.openDetailsModal(row.filterType, row.identifier) }, "Lihat Detail"))
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
    if (this.totalPages <= 1)
      return null;
    return m(".pagination-controls", { style: { marginTop: "1rem", textAlign: "center" } }, [
      m("button", {
        onclick: () => this.currentPage--,
        disabled: this.currentPage === 1
      }, "\u2039 Sebelumnya"),
      m("span", { style: { margin: "0 1rem", verticalAlign: "middle" } }, `Halaman ${this.currentPage} dari ${this.totalPages}`),
      m("button", {
        onclick: () => this.currentPage++,
        disabled: this.currentPage >= this.totalPages
      }, "Berikutnya \u203A")
    ]);
  },
  renderDashboard() {
    return [
      m("h3", "Admin Dashboard"),
      this.error && m("div.error", this.error),
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
      method: "POST",
      url: "/api/verify_user",
      headers: { Authorization: "Bearer " + localStorage.getItem("token") },
      body: { id: userId }
    }).then(() => {
      this.unverifiedUsers = this.unverifiedUsers.filter((user) => user._id !== userId);
      m.redraw();
    }).catch((err) => {
      console.error("Error verifying user:", err);
      this.error = "Failed to verify user";
    });
  },
  unverifyVolunteer(userId) {
    return m.request({
      method: "POST",
      url: "/api/unverify_volunteer",
      headers: { Authorization: "Bearer " + localStorage.getItem("token") },
      body: { id: userId }
    }).then(() => {
      this.refreshUsers && this.refreshUsers();
      m.redraw();
    }).catch((err) => {
      console.error("Error unverifying volunteer:", err);
      this.error = "Failed to unverify volunteer";
    });
  },
  approveSubmission(submissionId) {
    return m.request({
      method: "POST",
      url: "/api/approve",
      headers: { Authorization: "Bearer " + localStorage.getItem("token") },
      body: { id: submissionId }
    });
  },
  flagSubmission(submissionId) {
    return m.request({
      method: "POST",
      url: "/api/flag",
      headers: { Authorization: "Bearer " + localStorage.getItem("token") },
      body: { id: submissionId }
    });
  },
  renderNavigation() {
    return m("nav", [
      m("ul", { style: { display: "flex", alignItems: "center", justifyContent: "space-between" } }, [
        m("div", { style: { display: "flex", gap: "0.5rem" } }, [
          m("li", m("button", {
            class: this.currentView === "dashboard" ? "active" : "",
            onclick: () => this.currentView = "dashboard"
          }, "Dashboard")),
          m("li", m("button", {
            class: this.currentView === "area-setting" ? "active" : "",
            onclick: () => this.currentView = "area-setting"
          }, "Pengaturan Area")),
          m("li", m("button", {
            class: this.currentView === "caleg-setting" ? "active" : "",
            onclick: () => this.currentView = "caleg-setting"
          }, "Pengaturan Caleg")),
          m("li", m("button", {
            onclick: () => m.route.set("/dashboard")
          }, "Menu Relawan"))
        ]),
        m(
          "li",
          m("button", {
            style: { background: "#dc2626", color: "#fff", border: "none", marginLeft: "1rem", padding: "0.5rem 1.2rem", borderRadius: "4px", fontWeight: 600, cursor: "pointer" },
            onclick: () => {
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              m.route.set("/app/login");
            }
          }, "Logout")
        )
      ])
    ]);
  },
  view() {
    if (this.loading.initial) {
      return m("div.container-fluid", { style: { textAlign: "center", marginTop: "5rem" } }, m("span", { "aria-busy": "true" }, "Memuat..."));
    }
    return m("div.container-fluid", [
      m("h2", "Admin Panel"),
      // Navigation
      this.renderNavigation(),
      // Content based on current view
      this.currentView === "dashboard" ? this.renderDashboard() : this.currentView === "area-setting" ? m(AreaSetting_default) : this.currentView === "caleg-setting" ? m(CalegSetting_default) : m("div", "Unknown view")
    ]);
  }
};

// src/app.js
var isAuthenticated = () => !!localStorage.getItem("token");
m.route.prefix = "#!";
m.route(document.body, "/app/login", {
  "/app/login": {
    render: () => m(Login_default)
  },
  "/app/register": {
    render: () => m(Register_default)
  },
  "/app/dashboard": {
    onmatch: () => isAuthenticated() ? void 0 : m.route.set("/app/login"),
    render: () => m(Dashboard_default)
  },
  "/app/submit": {
    onmatch: () => isAuthenticated() ? void 0 : m.route.set("/app/login"),
    render: () => m(SubmissionForm_default)
  },
  "/app/submit/:id": {
    onmatch: () => isAuthenticated() ? void 0 : m.route.set("/app/login"),
    render: (vnode) => m(SubmissionForm_default, { id: vnode.attrs.id })
  },
  "/app/admin": {
    render: () => m(AdminPanel_default)
  }
});
//# sourceMappingURL=app.js.map
