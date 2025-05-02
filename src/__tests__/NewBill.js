/**
 * @jest-environment jsdom
 */

import { screen } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import { fireEvent } from "@testing-library/dom";
import { localStorageMock } from "../__mocks__/localStorage.js";
import { ROUTES_PATH } from "../constants/routes.js";


describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {

    test("Then handleChangeFile accepte un fichier .jpg et appelle store.create", async () => {
      document.body.innerHTML = NewBillUI();

      const createMock = jest.fn().mockResolvedValue({ fileUrl: "url", key: "123" });

      const storeMock = {
        bills: () => ({ create: createMock })
      };

      Object.defineProperty(window, "localStorage", { value: localStorageMock });
      window.localStorage.setItem("user", JSON.stringify({ email: "test@user.com" }));

      const newBill = new NewBill({ document, onNavigate: jest.fn(), store: storeMock, localStorage });

      const fileInput = screen.getByTestId("file");
      const file = new File(["img"], "test.jpg", { type: "image/jpeg" });

      await fireEvent.change(fileInput, { target: { files: [file] } });

      expect(createMock).toHaveBeenCalled(); // ✅ Ça fonctionne maintenant
    });

    test("Then handleChangeFile refuse un fichier .pdf et ne fait rien", async () => {
      document.body.innerHTML = NewBillUI();
      const alertMock = jest.spyOn(window, "alert").mockImplementation(() => { });

      const newBill = new NewBill({ document, onNavigate: jest.fn(), store: null, localStorage });

      const fileInput = screen.getByTestId("file");
      const file = new File(["pdf"], "fichier.pdf", { type: "application/pdf" });

      await fireEvent.change(fileInput, { target: { files: [file] } });

      expect(alertMock).toHaveBeenCalledWith(expect.stringMatching(/format de fichier non supporté/i));
      expect(fileInput.value).toBe(""); // champ reset
    });
    test("Then handleSubmit appelle updateBill avec les bonnes données", async () => {
      document.body.innerHTML = NewBillUI();
      Object.defineProperty(window, "localStorage", { value: localStorageMock });
      window.localStorage.setItem("user", JSON.stringify({ email: "test@user.com" }));

      const onNavigate = jest.fn();
      const storeMock = {
        bills: () => ({
          update: jest.fn().mockResolvedValue({})
        })
      };

      const newBill = new NewBill({ document, onNavigate, store: storeMock, localStorage });

      screen.getByTestId("expense-type").value = "Transports";
      screen.getByTestId("expense-name").value = "Vol Paris";
      screen.getByTestId("datepicker").value = "2023-05-01";
      screen.getByTestId("amount").value = "150";
      screen.getByTestId("vat").value = "20";
      screen.getByTestId("pct").value = "10";
      screen.getByTestId("commentary").value = "Déplacement pro";

      // Simuler l’état du fichier déjà uploadé
      newBill.fileUrl = "http://localhost/test.jpg";
      newBill.fileName = "test.jpg";
      newBill.billId = "123";

      const form = screen.getByTestId("form-new-bill");
      fireEvent.submit(form);

      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH["Bills"]);
    });


  })
})
