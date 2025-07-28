import { i18n } from '../i18n.js';

export default {
  outcome: '',
  votes: '',
  tpsNumber: '',
  village: '',
  district: '',
  photo: null,
  error: '',
  view() {
    return m('main.container', [
      m('h2', i18n.submitElectionData),
      m('form', {
        onsubmit: async e => {
          e.preventDefault();
          if (!this.photo) {
            this.error = i18n.photoRequired;
            return;
          }
          const reader = new FileReader();
          reader.onload = async ev => {
            const base64 = ev.target.result.split(',')[1];
            try {
              await m.request({
                method: 'POST',
                url: '/api/submissions',
                headers: { Authorization: 'Bearer ' + localStorage.getItem('token') },
                body: {
                  outcome: this.outcome,
                  votes: this.votes,
                  tpsNumber: this.tpsNumber,
                  village: this.village,
                  district: this.district,
                  photoBase64: base64,
                  photoMime: this.photo.type
                }
              });
              m.route.set('/app/dashboard');
            } catch (err) {
              this.error = err.response?.error || i18n.submissionFailed;
            }
          };
          reader.readAsDataURL(this.photo);
        }
      }, [
        m('input[type=text][placeholder=' + i18n.outcome + '][required]', {
          oninput: e => this.outcome = e.target.value,
          value: this.outcome
        }),
        m('input[type=number][placeholder=' + i18n.votes + '][required]', {
          oninput: e => this.votes = e.target.value,
          value: this.votes
        }),
        m('input[type=text][placeholder=' + i18n.tpsNumber + '][required]', {
          oninput: e => this.tpsNumber = e.target.value,
          value: this.tpsNumber
        }),
        m('input[type=text][placeholder=' + i18n.village + '][required]', {
          oninput: e => this.village = e.target.value,
          value: this.village
        }),
        m('input[type=text][placeholder=' + i18n.district + '][required]', {
          oninput: e => this.district = e.target.value,
          value: this.district
        }),
        m('input[type=file][accept=image/*][required]', {
          onchange: e => this.photo = e.target.files[0]
        }),
        m('button[type=submit]', i18n.submit),
        this.error && m('p.error', this.error)
      ])
    ]);
  }
};
