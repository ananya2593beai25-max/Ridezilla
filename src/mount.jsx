// Builds the React tree. Imported only after the stored data is ready (see main.jsx),
// because the Redux store reads localStorage the moment it is created.

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import "./styles/base.css";
import "./styles/layout.css";
import "./styles/components.css";
import "./styles/pages.css";
import "./styles/staff.css";
import "./styles/responsive.css";
import App from "./App";
import { store } from "./app/store";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";

export function mount() {
  // Turns on the scroll-reveal styles. Without JS the content simply stays visible.
  document.documentElement.classList.add("js");

  // Provider order matters: Redux and Router first, then the contexts that use them.
  createRoot(document.getElementById("root")).render(
    <StrictMode>
      <Provider store={store}>
        <BrowserRouter>
          <ToastProvider>
            <AuthProvider>
              <App />
            </AuthProvider>
          </ToastProvider>
        </BrowserRouter>
      </Provider>
    </StrictMode>
  );
}
