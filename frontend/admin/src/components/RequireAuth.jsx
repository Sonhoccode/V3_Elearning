import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/auth.store";

const RequireAuth = () => {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  // Also check primitive localStorage as fallback strictly like client.js
  const storedToken = localStorage.getItem("access_token");

  if (!isAuthenticated && !storedToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default RequireAuth;
