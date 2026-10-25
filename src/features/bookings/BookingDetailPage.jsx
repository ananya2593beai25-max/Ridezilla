// One booking: status, the assigned vehicle and driver, details, and cancel or report-a-problem buttons.

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import CountUp from "../../components/CountUp";
import StatusChip from "../../components/StatusChip";
import RideMap from "../ride/RideMap";
import { getRoute } from "../ride/routing";
import { selectBookingById } from "./bookingsSlice";
import { cancelRide } from "./rideLifecycle";
import AssignmentInfo from "./AssignmentInfo";
import RideOtp from "./RideOtp";
import TrackingNote from "./TrackingNote";
import { useDriverSim } from "../../lib/simulation";
import { formatCO2, formatDate, formatDuration, formatJourney, formatKm, formatRupees } from "../../lib/format";

const Row = ({ label, children }) => (
  <div>
    <dt>{label}</dt>
    <dd>{children}</dd>
  </div>
);

export default function BookingDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const dispatch = useDispatch();
  const toast = useToast();
  const location = useLocation();
  const booking = useSelector((s) => selectBookingById(s, id));
  const [route, setRoute] = useState(null);

  // Fetch the road route again for the map. It is cached, so this is usually instant.
  useEffect(() => {
    if (!booking) return;
    let live = true;
    getRoute(booking.pickup, booking.dropoff)
      .then((r) => live && setRoute(r))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [booking?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const sim = useDriverSim(booking, route);

  // A booking that belongs to someone else is treated like a missing one.
  if (!booking || booking.userId !== user.id) {
    return (
      <div className="container">
        <div className="card empty" style={{ marginTop: 48 }}>
          <h1 style={{ fontSize: "1.5rem" }}>Booking not found</h1>
          <p>It may have been removed, or it belongs to another account.</p>
          <Link className="btn btn--primary" to="/bookings">
            See My Bookings
          </Link>
        </div>
      </div>
    );
  }

  const canCancel = ["requested", "assigned"].includes(booking.status);
  const justBooked = location.state?.justBooked && booking.status === "requested";

  async function cancel() {
    const result = await dispatch(cancelRide({ bookingId: booking.id, by: "client" }));
    toast(result.error ? result.payload?.message || "Could not cancel." : "Booking cancelled.");
  }

  return (
    <div className="container">
      {justBooked && (
        <section className="card confirm" style={{ marginTop: 32 }} aria-live="polite">
          <svg className="confirm__check" viewBox="0 0 84 84" aria-hidden="true" focusable="false">
            <circle cx="42" cy="42" r="36" />
            <path d="M27 43l11 11 20-23" />
          </svg>
          <h1>Ride Requested</h1>
          <p className="muted">
            {booking.vehicleName} for {booking.passengers} {booking.passengers === 1 ? "rider" : "riders"}, {formatDate(booking.date)} at {booking.time}. We will
            assign a vehicle and driver shortly.
          </p>
          <div>
            <div className="muted" style={{ fontSize: "0.85rem" }}>
              CO₂ you will save
            </div>
            <strong className="num" style={{ color: "var(--accent)", fontSize: "2.6rem", lineHeight: 1 }}>
              <CountUp value={booking.co2SavedG / 1000} decimals={2} suffix={" kg"} />
            </strong>
          </div>
        </section>
      )}

      <div className="page-head">
        <div>
          {!justBooked && <h1>Booking Details</h1>}
          <p>
            Reference <span className="num">{booking.id}</span>
          </p>
        </div>
        <StatusChip status={booking.status} />
      </div>

      {booking.status === "rejected" && (
        <div className="notice notice--error" style={{ marginBottom: 16 }}>
          This request was rejected{booking.cancelReason ? `: ${booking.cancelReason}` : "."}
        </div>
      )}
      {booking.status === "cancelled" && booking.cancelledBy === "driver" && (
        <div className="notice notice--warn" style={{ marginBottom: 16 }}>
          The driver cancelled this ride{booking.cancelReason ? `: ${booking.cancelReason}` : "."}
        </div>
      )}
      {booking.status === "cancelled" && booking.cancelledBy === "admin" && (
        <div className="notice notice--warn" style={{ marginBottom: 16 }}>
          This ride was cancelled by the admin{booking.cancelReason ? `: ${booking.cancelReason}` : "."}
        </div>
      )}

      <div className="booking-grid">
        <div className="stack">
          <section className="card" aria-labelledby="d-trip">
            <div className="card__head">
              <h2 id="d-trip">Ride</h2>
            </div>
            <AssignmentInfo booking={booking} />
            <RideOtp booking={booking} />
            <dl className="summary-list" style={{ marginTop: booking.status === "requested" || booking.assignment ? 16 : 0 }}>
              <Row label="Pickup">{booking.pickup.name}</Row>
              <Row label="Drop-off">{booking.dropoff.name}</Row>
              <Row label="When">
                {formatDate(booking.date)}, {booking.time}
              </Row>
              <Row label="Passengers">{booking.passengers}</Row>
              <Row label="Vehicle type">{booking.vehicleName}</Row>
              <Row label="Distance">
                {booking.estimated ? "About " : ""}
                {formatKm(booking.distanceKm)}
              </Row>
              <Row label="Travel time">
                {booking.estimated ? "About " : ""}
                {formatDuration(booking.durationMin)}
              </Row>
              <Row label="Fare">
                {formatRupees(booking.fare)} ({formatRupees(booking.ratePerKm)} per km)
              </Row>
              <Row label="Payment">{booking.payment === "upi" ? "UPI in the vehicle" : "Cash in the vehicle"}</Row>
              <Row label="CO₂ saved">{formatCO2(booking.co2SavedG)}</Row>
              {booking.journeySec != null && <Row label="Journey time">{formatJourney(booking.journeySec)}</Row>}
              {booking.note && <Row label="Note">{booking.note}</Row>}
            </dl>
            <div className="btn-grid">
              <Link className="btn btn--primary" to="/dashboard">
                View Dashboard
              </Link>
              <Link className="btn btn--ghost" to="/bookings">
                All Bookings
              </Link>
              <Link className="btn btn--ghost" to={`/support/new?booking=${booking.id}`}>
                Report a Problem
              </Link>
              {canCancel && (
                <button className="btn btn--ghost" type="button" onClick={cancel}>
                  Cancel Booking
                </button>
              )}
            </div>
          </section>
        </div>

        <section className="card map-panel map-panel--static m-last" aria-label="Route map">
          <RideMap pickup={booking.pickup} dropoff={booking.dropoff} route={route} driver={sim?.position} driverStart={sim?.start} />
          {sim && (
            <div className="map-panel__note">
              <TrackingNote sim={sim} />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
