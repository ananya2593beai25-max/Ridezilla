// "My Bookings": every ride the signed-in client has made, grouped as active, completed and cancelled.

import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { VehicleIcon } from "../../components/Icon";
import StatusChip from "../../components/StatusChip";
import FilterBar from "../../components/FilterBar";
import { makeSelectUserBookings } from "./bookingsSlice";
import { bookingPhase } from "../../lib/bookingStatus";
import { formatDate, formatKm, formatRupees } from "../../lib/format";

const FILTERS = ["all", "active", "completed", "cancelled"];

export default function BookingsPage() {
  const { user } = useAuth();
  // makeSelectUserBookings() gives this component its own memoised selector.
  const selectMine = useMemo(makeSelectUserBookings, []);
  const mine = useSelector((s) => selectMine(s, user.id));
  const [filter, setFilter] = useState("all");

  const counts = useMemo(() => {
    const c = { all: mine.length, active: 0, completed: 0, cancelled: 0 };
    mine.forEach((b) => (c[bookingPhase(b)] += 1));
    return c;
  }, [mine]);

  const shown = mine.filter((b) => filter === "all" || bookingPhase(b) === filter);

  return (
    <div className="container page-body">
      <div className="app-top">
        <div>
          <h1>My Bookings</h1>
          <p>
            {counts.all} {counts.all === 1 ? "ride" : "rides"} in total, {counts.active} in progress.
          </p>
        </div>
        <Link className="btn btn--primary" to="/#search">
          Book a Ride
        </Link>
      </div>

      <div style={{ marginBottom: 16 }}>
        <FilterBar
          label="Filter by status"
          value={filter}
          onChange={setFilter}
          options={FILTERS.map((f) => ({ value: f, label: f[0].toUpperCase() + f.slice(1), count: counts[f] }))}
        />
      </div>

      {shown.length === 0 ? (
        <div className="card empty">
          <h2 style={{ fontSize: "1.3rem" }}>{counts.all ? "Nothing in this view" : "No bookings yet"}</h2>
          <p>{counts.all ? "Try a different filter." : "Book your first ride and it will appear here."}</p>
        </div>
      ) : (
        <ul className="card ride-list">
          {shown.map((b) => (
            <li key={b.id}>
              <Link to={`/bookings/${b.id}`} className="ride-row ride-row--link">
                <div className="ride-row__icon">
                  <VehicleIcon type={b.vehicleType} size={30} />
                </div>
                <div className="ride-row__text">
                  <span className="ride-row__route">
                    {b.pickup.name} to {b.dropoff.name}
                  </span>
                  <span className="ride-row__meta">
                    {formatDate(b.date)}, {b.time} · {formatKm(b.distanceKm)} · {b.assignment ? `${b.assignment.vehicleModel} · ${b.assignment.driverName}` : b.vehicleName} ·{" "}
                    {formatRupees(b.fare)}
                  </span>
                </div>
                <div className="ride-row__chip">
                  <StatusChip status={b.status} short />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
