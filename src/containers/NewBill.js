import { ROUTES_PATH } from '../constants/routes.js'
import Logout from "./Logout.js"

export default class NewBill {
  constructor({ document, onNavigate, store, localStorage }) {
    this.document = document
    this.onNavigate = onNavigate
    this.store = store
    const formNewBill = this.document.querySelector(`form[data-testid="form-new-bill"]`)
    formNewBill.addEventListener("submit", this.handleSubmit)
    const file = this.document.querySelector(`input[data-testid="file"]`)
    file.addEventListener("change", this.handleChangeFile)
    this.fileUrl = null
    this.fileName = null
    this.billId = null
    new Logout({ document, localStorage, onNavigate })
  }
  // ✅ CORRECTION PAR ÉTUDIANT :
  // Il était possible de téléverser un fichier avec une mauvaise extension (ex: pdf),
  // ce qui faisait planter l'affichage de la pièce jointe (modale vide) et rendait le nom du fichier null.
  // J’ai donc ajouté une vérification dans handleChangeFile() pour autoriser uniquement les fichiers
  // en .jpg, .jpeg ou .png. Si ce n’est pas le cas, un message d’alerte est affiché
  // et le champ fichier est réinitialisé.

  handleChangeFile = e => {
    e.preventDefault();

    const file = this.document.querySelector(`input[data-testid="file"]`).files[0];
    const fileInput = this.document.querySelector(`input[data-testid="file"]`);
    const fileName = file.name;
    const fileExtension = fileName.split('.').pop().toLowerCase();

    // ✅ Liste des extensions autorisées
    const validExtensions = ['jpg', 'jpeg', 'png'];

    // 🚫 Fichier non valide
    if (!validExtensions.includes(fileExtension)) {
      alert("Format de fichier non supporté. Merci de choisir un fichier jpg, jpeg ou png.");
      fileInput.value = ""; // Réinitialise le champ fichier
      return;
    }

    // ✅ Fichier accepté, on continue
    const formData = new FormData();
    const email = JSON.parse(localStorage.getItem("user")).email;

    formData.append("file", file);
    formData.append("email", email);

    this.store
      .bills()
      .create({
        data: formData,
        headers: {
          noContentType: true
        }
      })
      .then(({ fileUrl, key }) => {
        this.billId = key;
        this.fileUrl = fileUrl;
        this.fileName = fileName;
      })
      .catch(error => console.error(error));
  }

  handleSubmit = e => {
    e.preventDefault()
    console.log('e.target.querySelector(`input[data-testid="datepicker"]`).value', e.target.querySelector(`input[data-testid="datepicker"]`).value)
    const email = JSON.parse(localStorage.getItem("user")).email
    const bill = {
      email,
      type: e.target.querySelector(`select[data-testid="expense-type"]`).value,
      name: e.target.querySelector(`input[data-testid="expense-name"]`).value,
      amount: parseInt(e.target.querySelector(`input[data-testid="amount"]`).value),
      date: e.target.querySelector(`input[data-testid="datepicker"]`).value,
      vat: e.target.querySelector(`input[data-testid="vat"]`).value,
      pct: parseInt(e.target.querySelector(`input[data-testid="pct"]`).value) || 20,
      commentary: e.target.querySelector(`textarea[data-testid="commentary"]`).value,
      fileUrl: this.fileUrl,
      fileName: this.fileName,
      status: 'pending'
    }
    this.updateBill(bill)
    this.onNavigate(ROUTES_PATH['Bills'])
  }

  // not need to cover this function by tests
  updateBill = (bill) => {
    if (this.store) {
      this.store
        .bills()
        .update({ data: JSON.stringify(bill), selector: this.billId })
        .then(() => {
          this.onNavigate(ROUTES_PATH['Bills'])
        })
        .catch(error => console.error(error))
    }
  }
}