import m from "mithril";

const SubmissionForm = {
  lastSubmission: null,
  loading: false,
  error: "",
  success: "",
  form: {
    tps: "",
    totalVotes: "",
    calegVotes: "",
    photo: null,
    latitude: "",
    longitude: "",
    photoBase64: null,
    photoMime: null
  },
  oninit(vnode) {
    this.resetForm();
    if (vnode.attrs && vnode.attrs.prefill && vnode.attrs.prefill.kelurahanDesaCode) {
      this.fetchLastSubmission(vnode.attrs.prefill.kelurahanDesaCode);
    }
  },
  async fetchLastSubmission(kelurahanDesaCode) {
    this.loading = true;
    this.error = "";
    this.lastSubmission = null;
    try {
      const token = localStorage.getItem("token");
      const data = await m.request({
        method: "GET",
        url: `/api/submissions/mine?kelurahanDesaCode=${kelurahanDesaCode}`,
        headers: { Authorization: `Bearer ${token}` }
      });
      if (data && data.length > 0) {
        this.lastSubmission = data[0];
        // Optionally prefill form for editing
        this.form.tps = data[0].tpsNumber || "";
        this.form.totalVotes = data[0].votes || "";
        // Add more fields as needed
      }
    } catch (e) {
      this.error = e.message || "Gagal memuat data sebelumnya.";
    } finally {
      this.loading = false;
      m.redraw();
    }
  },
  handleFileUpload(e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        this.form.photoBase64 = ev.target.result.split(",")[1];
        this.form.photoMime = file.type;
        m.redraw();
      };
      reader.readAsDataURL(file);
      this.form.photo = file;
    } else {
      this.form.photoBase64 = null;
      this.form.photoMime = null;
      this.form.photo = null;
    }
  },
  async submit() {
    this.loading = true;
    this.error = "";
    this.success = "";
    if (this.form.photo && !this.form.photoBase64) {
      this.error = "Gambar masih diproses, mohon tunggu.";
      this.loading = false;
      m.redraw();
      return;
    }
    const payload = {
      tpsNumber: this.form.tps,
      votes: this.form.totalVotes,
      calegVotes: this.form.calegVotes,
      lat: this.form.latitude,
      lng: this.form.longitude,
      photoBase64: this.form.photoBase64,
      photoMime: this.form.photoMime
    };
    try {
      const token = localStorage.getItem("token");
      await m.request({
        method: "POST",
        url: "/api/submissions",
        body: payload,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });
      this.success = "Data berhasil dikirim!";
      this.resetForm();
      // Refetch last submission to show updated data
      if (this.lastSubmission && this.lastSubmission.kelurahanDesaCode) {
        this.fetchLastSubmission(this.lastSubmission.kelurahanDesaCode);
      }
    } catch (error) {
      this.error = error.error || "Gagal mengirim data";
    } finally {
      this.loading = false;
      m.redraw();
    }
  },
  resetForm() {
    this.form = {
      tps: "",
      totalVotes: "",
      calegVotes: "",
      photo: null,
      latitude: "",
      longitude: "",
      photoBase64: null,
      photoMime: null
    };
  },
  view() {
    return m("div", [
      this.loading && m("p", "Memuat..."),
      this.error && m("div.error", this.error),
      this.lastSubmission && !this.loading && m("div", [
        m("h4", "Data Terkirim Terakhir:"),
        m("ul", [
          m("li", `TPS: ${this.lastSubmission.tpsNumber}`),
          m("li", `Suara: ${this.lastSubmission.votes}`),
          m("li", `Foto: ${this.lastSubmission.hasPhoto ? 'Ada' : 'Tidak Ada'}`),
          m("li", `GPS: ${this.lastSubmission.hasLocation ? 'Ada' : 'Tidak Ada'}`)
        ]),
        m("button", {
          onclick: () => {
            // Prefill form for editing
            this.form.tps = this.lastSubmission.tpsNumber || "";
            this.form.totalVotes = this.lastSubmission.votes || "";
            // Add more fields as needed
            m.redraw();
          }
        }, "Edit Data Ini")
      ]),
      !this.lastSubmission && !this.loading && m("p", "Belum ada data yang dikirim untuk desa ini."),
      m("form", {
        onsubmit: (e) => {
          e.preventDefault();
          this.submit();
        }
      }, [
        m("label", { for: "tps" }, "TPS"),
        m("input", {
          id: "tps",
          type: "text",
          value: this.form.tps,
          oninput: (e) => { this.form.tps = e.target.value; },
          required: true
        }),
        m("label", { for: "totalVotes" }, "Total Suara"),
        m("input", {
          id: "totalVotes",
          type: "number",
          value: this.form.totalVotes,
          oninput: (e) => { this.form.totalVotes = e.target.value; },
          required: true
        }),
        m("label", { for: "calegVotes" }, "Suara Caleg"),
        m("input", {
          id: "calegVotes",
          type: "number",
          value: this.form.calegVotes,
          oninput: (e) => { this.form.calegVotes = e.target.value; },
          required: true
        }),
        m("label", { for: "photo" }, "Foto C1"),
        m("input", {
          id: "photo",
          type: "file",
          accept: "image/*",
          onchange: (e) => this.handleFileUpload(e)
        }),
        m("button[type=submit]", { disabled: this.loading }, this.loading ? "Mengirim..." : "Kirim Data")
      ]),
      this.success && m("div.success", this.success)
    ]);
  }
};

export default SubmissionForm;
