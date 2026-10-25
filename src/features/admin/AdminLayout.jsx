// Layout for every /admin page.
// Laptop: a sidebar. Phone: a top bar with a hamburger menu like the client site, holding the links and Log Out.

import { requestSelectors } from "../auth/passwordRequestsSlice";
import ThemeToggle from "../../components/ThemeToggle";
import { Suspense, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useStaffAuth } from "../../context/AuthContext";
import Icon, { BrandMark } from "../../components/Icon";
import PageLoader from "../../components/PageLoader";
import { selectAllBookings } from "../bookings/bookingsSlice";
import { selectUnreadByTicket } from "../support/supportSlice";

const LINKS = [
  { to: "/admin", label: "Overview", icon: "chart", end: true },
  { to: "/admin/requests", label: "Requests", icon: "inbox", count: "pending" },
  { to: "/admin/customers", label: "Customers", icon: "user", count: "clientReq" },
  { to: "/admin/drivers", label: "Drivers", icon: "users", count: "driverReq" },
  { to: "/admin/fleet", label: "Fleet", icon: "car" },
  { to: "/admin/pricing", label: "Pricing", icon: "tag" },
  { to: "/admin/support", label: "Support", icon: "chat", count: "unread" },
];

export default function AdminLayout() {
  const { user, logout } = useStaffAuth("admin");
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  const pending = useSelector((s) => selectAllBookings(s).filter((b) => b.status === "requested").length);
  const unreadMap = useSelector((s) => selectUnreadByTicket(s, "admin"));
  const unread = Object.values(unreadMap).reduce((sum, n) => sum + n, 0);
  // Forgot password requests waiting for the admin, for riders and for drivers
  const clientReq = useSelector((s) => requestSelectors.selectAll(s).filter((r) => r.status === "open" && r.role === "client").length);
  const driverReq = useSelector((s) => requestSelectors.selectAll(s).filter((r) => r.status === "open" && r.role === "driver").length);
  const counts = { pending, unread, clientReq, driverReq };
  const labels = { pending: "pending requests", unread: "unread messages", clientReq: "password requests", driverReq: "password requests" };

  // Close the phone menu after every navigation, and on Escape.
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const renderLinks = () =>
    LINKS.map((l) => {
      const n = l.count ? counts[l.count] : 0;
      return (
        <NavLink key={l.to} to={l.to} end={l.end}>
          <Icon name={l.icon} />
          <span>{l.label}</span>
          {n > 0 && (
            <span className="badge-count" aria-label={`${n} ${labels[l.count]}`}>
              {n}
            </span>
          )}
        </NavLink>
      );
    });

  return (
    <div className="app staff">
      <a className="skip-link" href="#main">
        Skip to Content
      </a>

      {/* Phones: brand and hamburger. The menu below holds the same links as the sidebar, plus Log Out. */}
      <header className="staff-topbar">
        <Link className="brand" to="/admin" aria-label="Ridezilla admin home">
          <BrandMark size={28} />
          Admin
        </Link>
        <button
          className="nav-toggle icon-btn"
          type="button"
          aria-expanded={open}
          aria-controls="admin-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          <Icon name={open ? "close" : "menu"} />
        </button>
        <nav id="admin-menu" className={`staff-menu${open ? " is-open" : ""}`} aria-label="Admin menu">
          {renderLinks()}
          <div className="staff-menu__user">
            <ThemeToggle />
            <span className="chip" title={user.email}>
              <Icon name="user" size={16} />
              {user.name}
            </span>
            <button className="btn btn--ghost" type="button" onClick={logout}>
              <Icon name="logout" size={16} />
              Log Out
            </button>
          </div>
        </nav>
      </header>

      <aside className="sidebar">
        <Link className="brand" to="/admin" aria-label="Ridezilla admin home">
          <BrandMark />
          Admin
        </Link>
        <nav className="side-nav" aria-label="Admin">
          {renderLinks()}
        </nav>
        <div className="sidebar__foot">
          <p style={{ color: "var(--text)", fontWeight: 600 }}>{user.name}</p>
          <p style={{ marginBottom: 10, overflow: "hidden", textOverflow: "ellipsis" }}>{user.email}</p>
          <ThemeToggle className="sidebar__theme" />
          <button className="btn btn--ghost btn--block" type="button" onClick={logout}>
            <Icon name="logout" size={18} />
            Log Out
          </button>
        </div>
      </aside>

      <main id="main" className="app-main">
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}
