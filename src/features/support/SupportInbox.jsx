// Two-pane support screen: ticket list on the left, chat on the right.
// role="client" shows the signed-in client's own tickets. role="admin" shows everyone's, with filters.

import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Link, useNavigate, useParams } from "react-router-dom";
import { selectAllTickets, selectUnreadByTicket } from "./supportSlice";
import ChatThread, { TICKET_STATUS } from "./ChatThread";
import FilterBar from "../../components/FilterBar";

const time = (iso) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

export default function SupportInbox({ role, user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const base = role === "admin" ? "/admin/support" : "/support";

  const all = useSelector(selectAllTickets);
  const unreadMap = useSelector((s) => selectUnreadByTicket(s, role));
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");

  const mine = useMemo(() => (role === "admin" ? all : all.filter((t) => t.clientId === user.id)), [all, role, user.id]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return mine.filter(
      (t) =>
        (filter === "all" || t.status === filter) &&
        (!q || `${t.subject} ${t.clientName} ${t.category}`.toLowerCase().includes(q))
    );
  }, [mine, filter, query]);

  const counts = useMemo(() => {
    const c = { all: mine.length, open: 0, in_progress: 0, resolved: 0 };
    mine.forEach((t) => (c[t.status] += 1));
    return c;
  }, [mine]);

  // On a client, a ticket the URL names must belong to them.
  const openTicket = id && mine.some((t) => t.id === id) ? id : null;

  return (
    <div className="support" data-open={Boolean(id)}>
      <aside className="support__list card" aria-label="Conversations">
        <div className="card__head">
          <h2>{role === "admin" ? "Complaints" : "My Complaints"}</h2>
          {role === "client" && (
            <Link className="btn btn--primary" to="/support/new" style={{ minHeight: 38 }}>
              New Complaint
            </Link>
          )}
        </div>

        {role === "admin" && (
          <>
            <div style={{ marginBottom: 12 }}>
              <FilterBar
                label="Filter by status"
                value={filter}
                onChange={setFilter}
                options={["all", "open", "in_progress", "resolved"].map((f) => ({ value: f, label: f === "all" ? "All" : TICKET_STATUS[f].label, count: counts[f] }))}
              />
            </div>
            <div className="field" style={{ marginBottom: 12 }}>
              <label htmlFor="ticket-search" className="sr-only">
                Search complaints
              </label>
              <input id="ticket-search" className="input" type="search" placeholder="Search by client or subject…" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
          </>
        )}

        {shown.length === 0 ? (
          <p className="muted" style={{ padding: "12px 4px" }}>
            {mine.length === 0 ? (role === "admin" ? "No complaints yet." : "You have not raised any complaints.") : "Nothing matches this view."}
          </p>
        ) : (
          <ul className="ticket-list">
            {shown.map((t) => (
              <li key={t.id}>
                <Link to={`${base}/${t.id}`} className={`ticket${t.id === id ? " is-active" : ""}`} aria-current={t.id === id ? "true" : undefined}>
                  <span className="ticket__top">
                    <strong className="ticket__subject">{t.subject}</strong>
                    {unreadMap[t.id] > 0 && (
                      <span className="badge-count" aria-label={`${unreadMap[t.id]} unread`}>
                        {unreadMap[t.id]}
                      </span>
                    )}
                  </span>
                  <span className="ticket__meta">
                    {role === "admin" ? `${t.clientName} · ` : ""}
                    {time(t.updatedAt)} · <span className={`dot dot--${t.status}`} /> {TICKET_STATUS[t.status].label}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </aside>

      <div className="support__chat">
        {openTicket ? (
          <ChatThread ticketId={openTicket} role={role} viewerName={user.name} onBack={() => navigate(base)} />
        ) : (
          <div className="card empty">
            <h2 style={{ fontSize: "1.2rem" }}>{id ? "Conversation not found" : "Pick a conversation"}</h2>
            <p>{role === "admin" ? "Choose a complaint on the left to read it and reply." : "Choose a complaint on the left, or start a new one."}</p>
          </div>
        )}
      </div>
    </div>
  );
}
