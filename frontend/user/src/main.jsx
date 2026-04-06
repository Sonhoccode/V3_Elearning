// frontend/user/src/main.jsx
import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import "./index.css";
import "../src/styles/global.css";
import "../src/i18n/i18.js";

import App from "./App.jsx";
import { queryClient } from "./queryClient";



ReactDOM.createRoot(document.getElementById("root")).render(
  // <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  // </React.StrictMode> 
);
