import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ConfigProvider, theme } from "antd";
import "./index.css";
import App from "./App";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { OrganizationProvider } from "./context/OrganizationContext";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

function Provider() {
  const { user } = useAuth();

  // Refresh the API provider to reset all the states
  return (
    <OrganizationProvider key={user?.id || user?.email || "anon"}>
      <App />
    </OrganizationProvider>
  );
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <ConfigProvider
    theme={{
      token: {
        fontFamily: "Inter, sans-serif",
      },
    }}
  >
    <BrowserRouter>
      <AuthProvider>
        <Provider />
      </AuthProvider>
    </BrowserRouter>
  </ConfigProvider>,
);
