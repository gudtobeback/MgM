import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ConfigProvider, theme } from "antd";
import "./index.css";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
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
    <AuthProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AuthProvider>
  </ConfigProvider>,
);
