import ThemeToggle from "./ThemeToggle";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { selectAllTickets, selectUnreadByTicket } from "../features/support/supportSlice";
import Icon, { BrandMark } from "./Icon";

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  // Unread replies from the admin, counted only on this client's own complaints.
  const tickets = useSelector(selectAllTickets);
  const unreadMap = useSelector((s) => selectUnreadByTicket(s, "client"));
  const unread = isAuthenticated ? tickets.filter((t) => t.clientId === user.id).reduce((sum, t) => sum + (unreadMap[t.id] || 0), 0) : 0;

  // Close the mobile menu after every navigation.
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="site-header">
      <div className="container nav">
        <Link className="brand" to="/" aria-label="Ridezilla home">
          <BrandMark />
          Ridezilla
        </Link>

        <button
          className="nav-toggle icon-btn"
          type="button"
          aria-expanded={open}
          aria-controls="nav-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          <Icon name={open ? "close" : "menu"} />
        </button>

        <nav id="nav-menu" className={`nav-menu${open ? " is-open" : ""}`} aria-label="Main">
          <NavLink to="/" end>
            Home
          </NavLink>
          {isAuthenticated && <NavLink to="/bookings">Bookings</NavLink>}
          {isAuthenticated && <NavLink to="/dashboard">Dashboard</NavLink>}
          {isAuthenticated && (
            <NavLink to="/support">
              Support
              {unread > 0 && (
                <span className="badge-count" style={{ marginLeft: 6 }} aria-label={`${unread} unread replies`}>
                  {unread}
                </span>
              )}
            </NavLink>
          )}
          <NavLink to="/faq">FAQ</NavLink>
          <ThemeToggle />

          {isAuthenticated ? (
            <>
              <NavLink className="chip nav-user" to="/account" title={`${user.email} · Account and password`}>
                <Icon name="user" size={16} />
                {user.name.split(" ")[0]}
              </NavLink>
              <button className="btn btn--ghost" type="button" onClick={logout}>
                Log Out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login">Log In</NavLink>
              <Link className="btn btn--primary" to="/register">
                Sign Up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
