// Admin home: the numbers that need attention, the newest requests and the newest complaints.

import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { useStaffAuth } from "../../context/AuthContext";
import CountUp from "../../components/CountUp";
import StatusChip from "../../components/StatusChip";
import { driverSelectors } from "../drivers/driversSlice";
import { fleetSelectors } from "../fleet/fleetSlice";
import { selectBookingsNewestFirst } from "../bookings/bookingsSlice";
import { selectAllTickets, selectUnreadByTicket } from "../support/supportSlice";
import { TICKET_STATUS } from "../support/ChatThread";
import { whenLabel } from "../../lib/bookingStatus";
import { greeting } from "../../lib/format";

export default function AdminOverview() {
  const { user } = useStaffAuth("admin");
  const bookings = useSelector(selectBookingsNewestFirst);
  const drivers = useSelector(driverSelectors.selectAll);
  const fleet = useSelector(fleetSelectors.selectAll);
  const tickets = useSelector(selectAllTickets);
  const unread = useSelector((s) => selectUnreadByTicket(s, "admin"));

  const pending = bookings.filter((b) => b.status === "requested").length;
  const activeRides = bookings.filter((b) => ["assigned", "in_progress"].includes(b.status)).length;
  const freeDrivers = drivers.filter((d) => d.active && d.status === "available").length;
  const freeVehicles = fleet.filter((v) => v.status === "available").length;
  const openTickets = tickets.filter((t) => t.status !== "resolved");

  const kpis = [
    { label: "Pending requests", value: pending, hint: "Waiting for a vehicle and driver", to: "/admin/requests", hot: pending > 0 },
    { label: "Rides in progress", value: activeRides, hint: "Assigned or on the way", to: "/admin/requests" },
    { label: "Free drivers", value: freeDrivers, hint: `of ${drivers.length} registered`, to: "/admin/drivers" },
    { label: "Free vehicles", value: freeVehicles, hint: `of ${fleet.length} in the fleet`, to: "/admin/fleet" },
    { label: "Open complaints", value: openTickets.length, hint: "Not resolved yet", to: "/admin/support", hot: openTickets.length > 0 },
  ];

  return (
    <>
      <div className="app-top">
        <div>
          <h1>
            {greeting()}, {user.name.split(" ")[0]}
          </h1>
          <p>Here is what needs attention today.</p>
        </div>
      </div>

      <section className="kpi-grid kpi-grid--5" aria-label="Summary">
        {kpis.map((k) => (
          <Link key={k.label} to={k.to} className={`card card--hover kpi${k.hot ? " kpi--hero" : ""}`}>
            <span className="kpi__label">{k.label}</span>
            <strong className="kpi__value num">
              <CountUp value={k.value} />
            </strong>
            <span className="muted" style={{ fontSize: "0.85rem" }}>
              {k.hint}
            </span>
          </Link>
        ))}
      </section>

      <div className="dash-row dash-row--lists">
        <section className="card" aria-labelledby="latest-req">
          <div className="card__head">
            <h2 id="latest-req">Latest Requests</h2>
            <Link to="/admin/requests" style={{ fontSize: "0.85rem" }}>
              See all
            </Link>
          </div>
          {bookings.length === 0 ? (
            <p className="muted">No bookings yet. They appear here as clients request rides.</p>
          ) : (
            <ul className="ride-list">
              {bookings.slice(0, 6).map((b) => (
                <li key={b.id}>
                  <Link to={`/admin/requests/${b.id}`} className="ride-row ride-row--link ride-row--two">
                    <div className="ride-row__text">
                      <span className="ride-row__route">
                        {b.pickup.name} to {b.dropoff.name}
                      </span>
                      <span className="ride-row__meta">
                        {b.riderName} · {whenLabel(b)} · {b.vehicleName}
                      </span>
                    </div>
                    <StatusChip status={b.status} short />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card" aria-labelledby="latest-tkt">
          <div className="card__head">
            <h2 id="latest-tkt">Latest Complaints</h2>
            <Link to="/admin/support" style={{ fontSize: "0.85rem" }}>
              Open inbox
            </Link>
          </div>
          {tickets.length === 0 ? (
            <p className="muted">No complaints. Nice and quiet.</p>
          ) : (
            <ul className="ride-list">
              {tickets.slice(0, 6).map((t) => (
                <li key={t.id}>
                  <Link to={`/admin/support/${t.id}`} className="ride-row ride-row--link ride-row--two">
                    <div className="ride-row__text">
                      <span className="ride-row__route">{t.subject}</span>
                      <span className="ride-row__meta">
                        {t.clientName} · {TICKET_STATUS[t.status].label}
                      </span>
                    </div>
                    {unread[t.id] > 0 ? <span className="badge-count">{unread[t.id]}</span> : <span />}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
