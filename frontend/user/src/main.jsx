// frontend/user/src/main.jsx
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./index.css";
import "../src/styles/global.css";
import "../src/i18n/i18.js";
import App from "./App.jsx";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,              // lỗi thì thử lại 1 lần
      refetchOnWindowFocus: false, // tránh nhảy request khi quay lại tab (tuỳ bạn)
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  // <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  // </React.StrictMode> 
);
