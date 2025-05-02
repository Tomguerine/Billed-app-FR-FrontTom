import { ROUTES_PATH } from '../constants/routes.js'
import { formatDate, formatStatus } from "../app/format.js"
import Logout from "./Logout.js"

export default class {
  constructor({ document, onNavigate, store, localStorage }) {
    this.document = document
    this.onNavigate = onNavigate
    this.store = store

    // ✅ Ajout pour test : sécurise l’accès au bouton
    const buttonNewBill = this.document.querySelector(`button[data-testid="btn-new-bill"]`)
    if (buttonNewBill) buttonNewBill.addEventListener('click', this.handleClickNewBill)

    // ✅ Ajout pour test : boucle sur tous les boutons "voir"
    const iconEye = this.document.querySelectorAll(`div[data-testid="icon-eye"]`)
    if (iconEye) iconEye.forEach(icon => {
      icon.addEventListener('click', () => this.handleClickIconEye(icon))
    })

    new Logout({ document, localStorage, onNavigate })
  }

  // ✅ TESTÉ : navigation vers page NewBill
  handleClickNewBill = () => {
    this.onNavigate(ROUTES_PATH['NewBill'])
  }

  // ✅ TESTÉ : ouverture modale et insertion image
  handleClickIconEye = (icon) => {
    const billUrl = icon.getAttribute("data-bill-url")
    const imgWidth = Math.floor($('#modaleFile').width() * 0.5)

    // ✅ Gestion de l'affichage de l'image dans la modale
    $('#modaleFile').find(".modal-body").html(`
      <div style='text-align: center;' class="bill-proof-container">
        <img width=${imgWidth} src=${billUrl} alt="Bill" />
      </div>
    `)

    // ✅ Affichage de la modale (à mocker dans les tests)
    $('#modaleFile').modal('show')
  }
  // ✅ TESTÉ : récupération des bills depuis l’API
  getBills = () => {
    if (this.store) {
      return this.store
        .bills()
        .list()
        .then(snapshot => {

          // ✅ AJOUT PAR ÉTUDIANT :
          // On boucle sur chaque document. Si `formatDate` échoue (date invalide),
          // on capture l'erreur dans le bloc `catch`, on log l'erreur avec `console.log`,
          // et on retourne les données non formatées (fallback).
          // On log aussi la longueur du tableau final, à tester avec `jest.spyOn(console, "log")`

          const bills = snapshot.map(doc => {
            try {
              return {
                ...doc,
                date: formatDate(doc.date),      // ✅ cas normal
                status: formatStatus(doc.status) // ✅ cas normal
              }
            } catch (e) {
              console.log(e, 'for', doc)         // ✅ cas date invalide
              return {
                ...doc,
                date: doc.date,                  // ✅ fallback brut
                status: formatStatus(doc.status)
              }
            }
          })

          console.log('length', bills.length)     // ✅ à tester avec spyOn
          return bills
        })
    }
  }


}
