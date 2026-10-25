// Layout route that only lets signed-in users through. Others go to /login and come back afterwards.

import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute() {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  // Logged in with a temporary password from the admin: choose your own before anything else.
  if (user.mustChangePassword && location.pathname !== "/account/set-password") {
    return <Navigate to="/account/set-password" replace />;
  }
  return <Outlet />;
}
