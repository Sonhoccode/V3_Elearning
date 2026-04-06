import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/auth.store";
import { decodeTokenPayload } from "../utils/jwt";

const RequireAuth = () => {
  const { isAuthenticated, user, logout } = useAuthStore();
  const location = useLocation();

  // Also check primitive localStorage as fallback strictly like client.js
  const storedToken = localStorage.getItem("access_token");
  const tokenPayload = storedToken ? decodeTokenPayload(storedToken) : null;
  const role = user?.role || tokenPayload?.role;

  useEffect(() => {
    if (role !== "admin" && (isAuthenticated || storedToken)) {
      logout();
    }
  }, [role, isAuthenticated, storedToken, logout]);

  if (!isAuthenticated && !storedToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (role !== "admin") {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default RequireAuth;
