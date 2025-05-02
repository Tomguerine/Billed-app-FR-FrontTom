
import { ROUTES_PATH } from '../constants/routes.js'
export let PREVIOUS_LOCATION = ''

// we use a class so as to test its methods in e2e tests
export default class Login {
  constructor({ document, localStorage, onNavigate, PREVIOUS_LOCATION, store }) {
    this.document = document
    this.localStorage = localStorage
    this.onNavigate = onNavigate
    this.PREVIOUS_LOCATION = PREVIOUS_LOCATION
    this.store = store
    const formEmployee = this.document.querySelector(`form[data-testid="form-employee"]`)
    formEmployee.addEventListener("submit", this.handleSubmitEmployee)
    const formAdmin = this.document.querySelector(`form[data-testid="form-admin"]`)
    formAdmin.addEventListener("submit", this.handleSubmitAdmin)
  }
  handleSubmitEmployee = e => {
    e.preventDefault()
    const user = {
      type: "Employee",
      email: e.target.querySelector(`input[data-testid="employee-email-input"]`).value,
      password: e.target.querySelector(`input[data-testid="employee-password-input"]`).value,
      status: "connected"
    }
    this.localStorage.setItem("user", JSON.stringify(user))
    this.login(user)
      .catch(
        (err) => this.createUser(user)
      )
      .then(() => {
        this.onNavigate(ROUTES_PATH['Bills'])
        this.PREVIOUS_LOCATION = ROUTES_PATH['Bills']
        PREVIOUS_LOCATION = this.PREVIOUS_LOCATION
        this.document.body.style.backgroundColor = "#fff"
      })

  }



  // ✅ CORRECTION PAR ÉTUDIANT :
  // Lors du test de connexion admin, une erreur apparaissait car les champs email et mot de passe 
  // n’étaient pas correctement récupérés (erreur "Cannot read properties of null").
  // J’ai donc utilisé `querySelector` avec les bons attributs `data-testid` pour cibler les champs du formulaire admin.
  // J’ai aussi ajouté un contrôle pour éviter une erreur si un champ est manquant.
  // Le formulaire est ensuite soumis, les données sont stockées dans le localStorage,
  // et la navigation vers le dashboard admin est effectuée.

  handleSubmitAdmin = async (e) => {
    e.preventDefault();

    const user = {
      type: "Admin",
      email: document.querySelector(`input[data-testid="admin-email-input"]`)?.value,
      password: document.querySelector(`input[data-testid="admin-password-input"]`)?.value,
      status: "connected",
    };

    if (!user.email || !user.password) return;

    localStorage.setItem("user", JSON.stringify(user));

    try {
      await this.login(user);
      this.onNavigate(ROUTES_PATH['Dashboard']);
      this.PREVIOUS_LOCATION = ROUTES_PATH['Dashboard'];
      PREVIOUS_LOCATION = this.PREVIOUS_LOCATION;
      this.document.body.style.backgroundColor = "#fff";

    } catch (error) {
      console.error(error);
    }
  }

  // not need to cover this function by tests
  login = (user) => {
    if (this.store) {
      return this.store
        .login(JSON.stringify({
          email: user.email,
          password: user.password,
        })).then(({ jwt }) => {
          localStorage.setItem('jwt', jwt)
        })
    } else {
      return null
    }
  }

  // not need to cover this function by tests
  createUser = (user) => {
    if (this.store) {
      return this.store
        .users()
        .create({
          data: JSON.stringify({
            type: user.type,
            name: user.email.split('@')[0],
            email: user.email,
            password: user.password,
          })
        })
        .then(() => {
          console.log(`User with ${user.email} is created`)
          return this.login(user)
        })
    } else {
      return null
    }
  }
}
