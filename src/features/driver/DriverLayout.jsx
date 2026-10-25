// Layout for every /driver page. Built for a phone first: top bar plus a bottom tab bar.

import ThemeToggle from "../../components/ThemeToggle";
import { Suspense } from "react";
import { useSelector } from "react-redux";
import { Link, Navigate, NavLink, Outlet } from "react-router-dom";
import { useStaffAuth } from "../../context/AuthContext";
import Icon, { BrandMark } from "../../components/Icon";
import PageLoader from "../../components/PageLoader";
import { selectDriverByUserId } from "../drivers/driversSlice";

export default function DriverLayout() {
  const { user, logout } = useStaffAuth("driver");
  const driver = useSelector((s) => selectDriverByUserId(s, user.id));

  // A driver still on the temporary password cannot see any driver page until they choose their own.
  if (user.mustChangePassword) return <Navigate to="/driver/set-password" replace />;

  return (
    <div className="driver-shell">
      <a className="skip-link" href="#main">
        Skip to Content
      </a>
      <header className="site-header">
        <div className="container nav">
          <Link className="brand" to="/driver" aria-label="Ridezilla driver home">
            <BrandMark />
            Driver
          </Link>
          <div className="driver-top__right">
            <span className="chip">{user.name.split(" ")[0]}</span>
            <ThemeToggle />
            <button className="btn btn--ghost" type="button" onClick={logout} style={{ minHeight: 38 }}>
              <Icon name="logout" size={16} />
              <span className="driver-logout">Log Out</span>
            </button>
          </div>
        </div>
      </header>

      <main id="main" className="container driver-main">
        <Suspense fallback={<PageLoader />}>
          {driver === undefined ? (
            <div className="card empty">
              <h1 style={{ fontSize: "1.4rem" }}>Driver profile not found</h1>
              <p>Your login exists, but the admin has no driver record for you. Ask the admin to register you again.</p>
            </div>
          ) : (
            <Outlet context={{ driver }} />
          )}
        </Suspense>
      </main>

      <nav className="driver-tabs" aria-label="Driver">
        <NavLink to="/driver" end>
          <Icon name="car" />
          <span>My Ride</span>
        </NavLink>
        <NavLink to="/driver/history">
          <Icon name="list" />
          <span>History</span>
        </NavLink>
        <NavLink to="/driver/profile">
          <Icon name="user" />
          <span>Profile</span>
        </NavLink>
      </nav>
    </div>
  );
}
