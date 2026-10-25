// The client's current ride in a compact list row. Shows nothing for logged-out users or when there is none.

import { Link } from "react-router-dom";
import { VehicleIcon } from "../../components/Icon";
import StatusChip from "../../components/StatusChip";
import { useActiveRide } from "./useActiveRide";
import { whenLabel } from "../../lib/bookingStatus";
import { formatRupees } from "../../lib/format";

export default function UpcomingRides({ className = "" }) {
  const b = useActiveRide();
  if (!b) return null;

  return (
    <section className={`card upcoming ${className}`.trim()} aria-labelledby="upcoming-title">
      <div className="card__head">
        <h2 id="upcoming-title">Your Current Ride</h2>
        <Link to="/bookings" style={{ fontSize: "0.85rem" }}>
          See all bookings
        </Link>
      </div>
      <ul className="ride-list">
        <li>
          <Link to={`/bookings/${b.id}`} className="ride-row ride-row--link">
            <div className="ride-row__icon">
              <VehicleIcon type={b.vehicleType} size={30} />
            </div>
            <div className="ride-row__text">
              <span className="ride-row__route">
                {b.pickup.name} to {b.dropoff.name}
              </span>
              <span className="ride-row__meta">
                {whenLabel(b)} · {b.assignment ? `${b.assignment.vehicleModel}, ${b.assignment.driverName}` : b.vehicleName} · {formatRupees(b.fare)}
              </span>
            </div>
            <div className="ride-row__chip">
              <StatusChip status={b.status} short />
            </div>
          </Link>
        </li>
      </ul>
    </section>
  );
}
