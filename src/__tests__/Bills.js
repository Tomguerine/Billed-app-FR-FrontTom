/**
 * @jest-environment jsdom
 */

import { screen, waitFor, fireEvent } from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import Bills from "../containers/Bills.js";
import store from "../__mocks__/store.js";

import router from "../app/Router.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      //to-do write expect expression
      ////////a
      expect(windowIcon.classList.contains("active-icon")).toBe(true);


    })
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      expect(screen.getByText("Mes notes de frais")).toBeTruthy();
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
    ////// ADD TESTS HERE //////
    test("GET bills depuis API -> formatDate et formatStatus appelés", async () => {
      const billsInstance = new Bills({ document, onNavigate: jest.fn(), store, localStorage });
      const billsData = await billsInstance.getBills();

      expect(billsData[0]).toHaveProperty("date");
      expect(billsData[0]).toHaveProperty("status");
    });
    test("Click sur 'Nouvelle note de frais' appelle onNavigate avec NewBill", () => {
      document.body.innerHTML = BillsUI({ data: bills });

      const onNavigate = jest.fn();
      const billsInstance = new Bills({ document, onNavigate, store: null, localStorage });

      const newBillBtn = screen.getByTestId("btn-new-bill");
      fireEvent.click(newBillBtn);

      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH["NewBill"]);
    });
    test("GET bills → store est undefined → rien n'est retourné", async () => {
      const billsInstance = new Bills({
        document,
        onNavigate: jest.fn(),
        store: null, // <- ici on teste la branche "false"
        localStorage: window.localStorage
      });

      const result = await billsInstance.getBills();
      expect(result).toBeUndefined(); // car rien n’est retourné
    });

    test("Click sur une icône œil ouvre la modale avec l'image", () => {
      document.body.innerHTML = BillsUI({ data: bills });

      const onNavigate = jest.fn();
      const billsInstance = new Bills({ document, onNavigate, store: null, localStorage });

      // Prépare l’icône œil
      const iconEye = screen.getAllByTestId("icon-eye")[0];
      iconEye.setAttribute("data-bill-url", "https://localhost/facture.jpg");

      // Mock de jQuery modal
      $.fn.modal = jest.fn();

      fireEvent.click(iconEye);

      // Vérifie qu’une image est bien injectée dans la modale
      const modalContent = document.querySelector(".modal-body").innerHTML;
      expect(modalContent).toContain("img");
      expect($.fn.modal).toHaveBeenCalled();
    });

    test("GET bills depuis API -> formatDate et formatStatus appelés", async () => {
      const billsInstance = new Bills({ document, onNavigate: jest.fn(), store, localStorage });
      const billsData = await billsInstance.getBills();

      expect(billsData[0]).toHaveProperty("date");
      expect(billsData[0]).toHaveProperty("status");
    });

    // ✅ TEST : getBills -> formatDate échoue, fallback brut, console.log appelé
    test("GET bills -> formatDate échoue, données brutes retournées et console.log appelé", async () => {
      const corruptedStore = {
        bills: () => ({
          list: () => Promise.resolve([
            { id: "123", date: "invalid-date", status: "pending", name: "test bill", amount: 100, fileUrl: "#" }
          ])
        })
      }

      const logSpy = jest.spyOn(console, "log").mockImplementation(() => { });

      const billsInstance = new Bills({
        document,
        onNavigate: jest.fn(),
        store: corruptedStore,
        localStorage: window.localStorage
      });

      const result = await billsInstance.getBills();

      expect(result[0].date).toBe("invalid-date");
      expect(logSpy).toHaveBeenCalled();
      expect(logSpy).toHaveBeenCalledWith('length', 1);

      logSpy.mockRestore();
    });

  })
})
