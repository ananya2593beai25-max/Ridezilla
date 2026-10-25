// Layout route that only lets one role through. Others go to that panel's own login page.
// Remember: this guards the screens, not the data. Real security needs a server.

import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RoleRoute({ role, loginPath }) {
  const { sessions } = useAuth();
  const location = useLocation();

  if (!sessions[role]) {
    return <Navigate to={loginPath} replace state={{ from: location }} />;
  }
  return <Outlet />;
}
