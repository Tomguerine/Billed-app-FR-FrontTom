/**
 * @jest-environment jsdom
 */

import LoginUI from "../views/LoginUI";
import Login from "../containers/Login.js";
import { ROUTES_PATH } from "../constants/routes";
import { fireEvent, screen, waitFor } from "@testing-library/dom";

/**
 * Integration tests — Login container
 *
 *  • Employee scenario with fallback (login → createUser → login) ✅
 *  • Admin successful login ✅
 *  • Admin early‑return guard ✅
 */

describe("Login integration scenarios", () => {
  // Helper to render the Login page & mock localStorage for every test
  const bootstrapDOM = () => {
    document.body.innerHTML = LoginUI();
    Object.defineProperty(window, "localStorage", {
      value: {
        setItem: jest.fn(),
        getItem: jest.fn(),
      },
      writable: true,
    });
  };

  beforeEach(() => {
    jest.resetAllMocks();
    bootstrapDOM();
  });

  // ───────────────────────────── Employee FLOW ──────────────────────────────
  describe("Employee flow", () => {
    test("creates the user after a first login failure then redirects to Bills", async () => {
      // Mocks : 1st login → reject, 2nd → resolve ; users().create → resolve
      const usersMock = { create: jest.fn(() => Promise.resolve()) };
      const store = {
        login: jest
          .fn()
          .mockRejectedValueOnce(new Error("Firebase: auth/user-not-found"))
          .mockResolvedValueOnce({ jwt: "fake-token" }),
        users: jest.fn(() => usersMock),
      };
      const onNavigate = jest.fn();

      // eslint-disable-next-line no-new
      new Login({
        document,
        localStorage: window.localStorage,
        onNavigate,
        PREVIOUS_LOCATION: "",
        store,
      });

      // Fill the form with valid credentials
      fireEvent.change(screen.getByTestId("employee-email-input"), {
        target: { value: "newuser@test.tld" },
      });
      fireEvent.change(screen.getByTestId("employee-password-input"), {
        target: { value: "s3cretPass!" },
      });

      fireEvent.submit(screen.getByTestId("form-employee"));

      // Wait until navigation occurs → whole async chain completed
      await waitFor(() =>
        expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH.Bills)
      );

      expect(store.login).toHaveBeenCalledTimes(2); // before + after user creation
      expect(store.users).toHaveBeenCalledTimes(1);
      expect(usersMock.create).toHaveBeenCalledTimes(1);
    });
  });

  // ────────────────────────────── Admin FLOW ────────────────────────────────
  describe("Admin flow", () => {
    test("navigates to Dashboard when credentials are correct", async () => {
      const store = {
        login: jest.fn(() => Promise.resolve({ jwt: "fake-token" })),
      };
      const onNavigate = jest.fn();

      // eslint-disable-next-line no-new
      new Login({
        document,
        localStorage: window.localStorage,
        onNavigate,
        PREVIOUS_LOCATION: "",
        store,
      });

      fireEvent.change(screen.getByTestId("admin-email-input"), {
        target: { value: "admin@test.tld" },
      });
      fireEvent.change(screen.getByTestId("admin-password-input"), {
        target: { value: "Ultr4S3cret" },
      });

      fireEvent.submit(screen.getByTestId("form-admin"));

      await waitFor(() =>
        expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH.Dashboard)
      );

      expect(store.login).toHaveBeenCalledTimes(1);
    });

    test("aborts when email or password is missing", () => {
      const store = { login: jest.fn() };
      const onNavigate = jest.fn();

      // eslint-disable-next-line no-new
      new Login({
        document,
        localStorage: window.localStorage,
        onNavigate,
        PREVIOUS_LOCATION: "",
        store,
      });

      fireEvent.submit(screen.getByTestId("form-admin")); // empty fields

      expect(store.login).not.toHaveBeenCalled();
      expect(onNavigate).not.toHaveBeenCalled();
    });
  });
});
