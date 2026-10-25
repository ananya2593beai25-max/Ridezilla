// Past rides of the signed-in driver.

import { useMemo } from "react";
import { useSelector } from "react-redux";
import { useOutletContext } from "react-router-dom";
import StatusChip from "../../components/StatusChip";
import { makeSelectDriverBookings } from "../bookings/bookingsSlice";
import { formatDate, formatJourney, formatKm, formatRupees } from "../../lib/format";

export default function DriverHistoryPage() {
  const { driver } = useOutletContext();
  const selectMine = useMemo(makeSelectDriverBookings, []);
  const rides = useSelector((s) => selectMine(s, driver.id));
  const past = rides.filter((b) => ["completed", "cancelled", "rejected"].includes(b.status));
  const earned = past.filter((b) => b.status === "completed").reduce((sum, b) => sum + b.fare, 0);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>History</h1>
          <p>
            {past.filter((b) => b.status === "completed").length} completed rides, {formatRupees(earned)} in fares.
          </p>
        </div>
      </div>

      {past.length === 0 ? (
        <div className="card empty">
          <h2 style={{ fontSize: "1.2rem" }}>No past rides yet</h2>
          <p>Finished and cancelled rides appear here.</p>
        </div>
      ) : (
        <ul className="card ride-list">
          {past.map((b) => (
            <li key={b.id} className="ride-row ride-row--two">
              <div className="ride-row__text">
                <span className="ride-row__route">
                  {b.pickup.name} to {b.dropoff.name}
                </span>
                <span className="ride-row__meta">
                  {formatDate(b.date)} · {formatKm(b.distanceKm)} · {b.assignment?.vehicleModel} · {formatRupees(b.fare)}
                  {b.journeySec != null && ` · took ${formatJourney(b.journeySec)}`}
                </span>
              </div>
              <StatusChip status={b.status} short />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
