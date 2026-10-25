// Shown on the home page in place of the search form while the client has a ride that is not finished.

import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import { useToast } from "../../context/ToastContext";
import StatusChip from "../../components/StatusChip";
import RideMap from "../ride/RideMap";
import { getRoute } from "../ride/routing";
import { cancelRide } from "./rideLifecycle";
import AssignmentInfo from "./AssignmentInfo";
import RideOtp from "./RideOtp";
import TrackingNote from "./TrackingNote";
import { useDriverSim } from "../../lib/simulation";
import { whenLabel } from "../../lib/bookingStatus";
import { formatCO2, formatKm, formatRupees } from "../../lib/format";

export default function ActiveRideCard({ booking }) {
  const dispatch = useDispatch();
  const toast = useToast();
  const [route, setRoute] = useState(null);
  const [armed, setArmed] = useState(false);
  const timer = useRef();

  useEffect(() => {
    let live = true;
    getRoute(booking.pickup, booking.dropoff)
      .then((r) => live && setRoute(r))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [booking.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => clearTimeout(timer.current), []);

  const sim = useDriverSim(booking, route);
  const canCancel = ["requested", "assigned"].includes(booking.status);

  // Two-step cancel: the first click asks "are you sure?", the second one cancels.
  async function cancel() {
    if (!armed) {
      setArmed(true);
      timer.current = setTimeout(() => setArmed(false), 4000);
      return;
    }
    clearTimeout(timer.current);
    const result = await dispatch(cancelRide({ bookingId: booking.id, by: "client" }));
    toast(result.error ? result.payload?.message || "Could not cancel." : "Ride cancelled. You can book another one now.");
  }

  return (
    <section id="search" className="card search-card active-ride" aria-labelledby="active-title">
      <div>
        <StatusChip status={booking.status} />
        <h2 id="active-title" style={{ marginTop: 10 }}>
          Your Ride
        </h2>
        <p className="muted" style={{ marginTop: 6, fontSize: "0.9rem" }}>
          You can book another ride once this one is completed or cancelled.
        </p>
      </div>

      <div className="active-ride__when">
        <strong className="num">{whenLabel(booking)}</strong>
        <span className="muted">
          {booking.vehicleName} · {booking.passengers} {booking.passengers === 1 ? "rider" : "riders"}
        </span>
      </div>

      <AssignmentInfo booking={booking} />
      <RideOtp booking={booking} />

      <div className="sample-ride__route">
        <div className="sample-ride__stop">
          <span className="sample-ride__dot" style={{ background: "var(--accent)" }} />
          {booking.pickup.name}
        </div>
        <div className="sample-ride__line" aria-hidden="true" />
        <div className="sample-ride__stop">
          <span className="sample-ride__dot" style={{ background: "var(--info)" }} />
          {booking.dropoff.name}
        </div>
      </div>

      <div className="mini-map mini-map--tall">
        <RideMap pickup={booking.pickup} dropoff={booking.dropoff} route={route} driver={sim?.position} driverStart={sim?.start} interactive={false} label="Your booked route" />
      </div>

      <TrackingNote sim={sim} />

      <dl className="summary-list">
        <div>
          <dt>Fare</dt>
          <dd>
            {formatRupees(booking.fare)} ({formatRupees(booking.ratePerKm)} per km)
          </dd>
        </div>
        <div>
          <dt>Distance</dt>
          <dd>{formatKm(booking.distanceKm)}</dd>
        </div>
        <div>
          <dt>CO₂ saved</dt>
          <dd>{formatCO2(booking.co2SavedG)}</dd>
        </div>
      </dl>

      <div className="active-ride__actions">
        <Link className="btn btn--primary" to={`/bookings/${booking.id}`}>
          View Details
        </Link>
        {canCancel && (
          <button className="btn btn--ghost" type="button" onClick={cancel}>
            {armed ? "Click Again to Cancel" : "Cancel Ride"}
          </button>
        )}
      </div>
    </section>
  );
}
