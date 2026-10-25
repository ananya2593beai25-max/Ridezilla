// One booking request for the admin: ride and client details, a map, and the actions
// (assign or reassign, reject, cancel, force complete). The rules themselves live in bookings/rideLifecycle.js.

import TrackingNote from "../bookings/TrackingNote";
import { useDriverSim } from "../../lib/simulation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useToast } from "../../context/ToastContext";
import StatusChip from "../../components/StatusChip";
import Select from "../../components/Select";
import RideMap from "../ride/RideMap";
import { getRoute } from "../ride/routing";
import { selectBookingById } from "../bookings/bookingsSlice";
import { assignRide, completeRide, rejectRide } from "../bookings/rideLifecycle";
import { formatPlate } from "../bookings/AssignmentInfo";
import { driverSelectors } from "../drivers/driversSlice";
import { fleetSelectors } from "../fleet/fleetSlice";
import { formatCO2, formatDate, formatDuration, formatJourney, formatKm, formatRupees } from "../../lib/format";

const Row = ({ label, children }) => (
  <div>
    <dt>{label}</dt>
    <dd>{children}</dd>
  </div>
);
const stamp = (iso) => (iso ? new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : null);

function AssignForm({ booking }) {
  const dispatch = useDispatch();
  const toast = useToast();
  const fleet = useSelector(fleetSelectors.selectAll);
  const drivers = useSelector(driverSelectors.selectAll);
  const current = booking.assignment;

  // A vehicle fits when it is the right category with enough seats and is free (or is already this ride's vehicle).
  const vehicles = useMemo(
    () => fleet.filter((v) => v.catalogueId === booking.vehicleId && v.seats >= booking.passengers && (v.status === "available" || v.id === current?.fleetId)),
    [fleet, booking, current]
  );
  const freeDrivers = useMemo(
    () => drivers.filter((d) => d.active && (d.status === "available" || d.id === current?.driverId)),
    [drivers, current]
  );

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { fleetId: current?.fleetId || "", driverId: current?.driverId || "" } });

  async function onSubmit(form) {
    const result = await dispatch(assignRide({ bookingId: booking.id, ...form }));
    if (result.error) setError("root", { message: result.payload?.message || "Could not assign this ride." });
    else toast(current ? "Ride reassigned. The client can see the new details." : "Assigned. The client can now see the vehicle and driver.");
  }

  return (
    <form className="card" onSubmit={handleSubmit(onSubmit)} noValidate aria-labelledby="assign-title">
      <div className="card__head">
        <h2 id="assign-title">{current ? "Reassign" : "Assign Vehicle and Driver"}</h2>
      </div>
      <p className="muted" style={{ marginBottom: 14, fontSize: "0.9rem" }}>
        This client asked for an <strong style={{ color: "var(--text)" }}>{booking.vehicleName}</strong> for {booking.passengers}{" "}
        {booking.passengers === 1 ? "rider" : "riders"}. Only matching, free vehicles are listed.
      </p>

      {errors.root && (
        <div className="notice notice--error" role="alert" style={{ marginBottom: 14 }}>
          {errors.root.message}
        </div>
      )}

      <div className="form-grid">
        <div className="field">
          <label htmlFor="fleetId">Vehicle</label>
          <Select id="fleetId" className="input" aria-invalid={errors.fleetId ? "true" : "false"} {...register("fleetId", { required: "Choose a vehicle." })}>
            <option value="">Select a vehicle…</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.modelName} · {formatPlate(v.plateNumber)}
              </option>
            ))}
          </Select>
          <p className="field-error" aria-live="polite">
            {errors.fleetId?.message || (vehicles.length === 0 ? "No free vehicle of this type. Add one on the Fleet page." : "")}
          </p>
        </div>
        <div className="field">
          <label htmlFor="driverId">Driver</label>
          <Select id="driverId" className="input" aria-invalid={errors.driverId ? "true" : "false"} {...register("driverId", { required: "Choose a driver." })}>
            <option value="">Select a driver…</option>
            {freeDrivers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} · {d.phone}
              </option>
            ))}
          </Select>
          <p className="field-error" aria-live="polite">
            {errors.driverId?.message || (freeDrivers.length === 0 ? "No free driver. Register one on the Drivers page." : "")}
          </p>
        </div>
      </div>

      <button className="btn btn--primary btn--lg btn--block" type="submit" disabled={isSubmitting} style={{ marginTop: 8 }}>
        {current ? "Save New Assignment" : "Assign Ride"}
      </button>
    </form>
  );
}

function ReasonForm({ title, button, danger, onSubmit }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ defaultValues: { reason: "" } });

  return (
    <form
      className="reason-form"
      onSubmit={handleSubmit(async ({ reason }) => {
        await onSubmit(reason.trim());
        reset();
      })}
      noValidate
    >
      <div className="field">
        <label htmlFor={`reason-${button}`}>{title}</label>
        <input
          id={`reason-${button}`}
          className="input"
          placeholder="The client will see this…"
          maxLength={160}
          aria-invalid={errors.reason ? "true" : "false"}
          {...register("reason", { required: "Give a short reason.", minLength: { value: 4, message: "Use at least 4 characters." } })}
        />
        <p className="field-error" aria-live="polite">
          {errors.reason?.message}
        </p>
      </div>
      <button className={`btn ${danger ? "btn--danger" : "btn--ghost"}`} type="submit">
        {button}
      </button>
    </form>
  );
}

export default function AdminRequestDetail() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const toast = useToast();
  const booking = useSelector((s) => selectBookingById(s, id));
  const [route, setRoute] = useState(null);
  const [armed, setArmed] = useState(false);
  const sim = useDriverSim(booking, route);
  const timer = useRef();

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

  useEffect(() => () => clearTimeout(timer.current), []);

  if (!booking) {
    return (
      <div className="card empty">
        <h1 style={{ fontSize: "1.4rem" }}>Request not found</h1>
        <Link className="btn btn--primary" to="/admin/requests">
          Back to Requests
        </Link>
      </div>
    );
  }

  const canAssign = ["requested", "assigned"].includes(booking.status);
  const canClose = ["requested", "assigned", "in_progress"].includes(booking.status);

  const run = async (action, okMessage) => {
    const result = await dispatch(action);
    toast(result.error ? result.payload?.message || "That did not work." : okMessage);
  };

  function forceComplete() {
    if (!armed) {
      setArmed(true);
      timer.current = setTimeout(() => setArmed(false), 4000);
      return;
    }
    clearTimeout(timer.current);
    setArmed(false);
    run(completeRide({ bookingId: booking.id, by: "admin" }), "Ride marked as completed.");
  }

  const a = booking.assignment;

  return (
    <>
      <div className="app-top app-top--stack">
        <div>
          <Link to="/admin/requests" className="muted" style={{ fontSize: "0.85rem" }}>
            ← All requests
          </Link>
          <h1 className="detail-title" style={{ marginTop: 6 }}>
            {booking.pickup.name} to {booking.dropoff.name}
          </h1>
          <p>
            Requested by {booking.riderName} on {stamp(booking.createdAt)}
          </p>
        </div>
        <StatusChip status={booking.status} />
      </div>

      {["rejected", "cancelled"].includes(booking.status) && (
        <div className="notice notice--warn" style={{ marginBottom: 16 }}>
          {booking.status === "rejected" ? "Rejected" : `Cancelled by ${booking.cancelledBy || "client"}`}
          {booking.cancelReason ? `: ${booking.cancelReason}` : "."}
        </div>
      )}

      <div className="booking-grid">
        <div className="stack">
          {canAssign && <AssignForm key={`${booking.id}-${a?.fleetId}-${a?.driverId}`} booking={booking} />}

          {a && (
            <section className="card" aria-labelledby="asg-title">
              <div className="card__head">
                <h2 id="asg-title">Assigned To</h2>
              </div>
              <dl className="summary-list">
                <Row label="Vehicle">
                  {a.vehicleModel} <span className="plate plate--small">{formatPlate(a.plateNumber)}</span>
                </Row>
                <Row label="Colour">{a.color}</Row>
                <Row label="Driver">{a.driverName}</Row>
                <Row label="Driver phone">
                  <a href={`tel:${a.driverPhone}`}>{a.driverPhone}</a>
                </Row>
                <Row label="Assigned">{stamp(a.assignedAt)}</Row>
              </dl>
            </section>
          )}

          <section className="card" aria-labelledby="ride-title">
            <div className="card__head">
              <h2 id="ride-title">Ride and Client</h2>
            </div>
            <dl className="summary-list">
              <Row label="Client">{booking.riderName}</Row>
              <Row label="Client phone">
                <a href={`tel:${booking.riderPhone}`}>{booking.riderPhone || "Not given"}</a>
              </Row>
              <Row label="Pickup">{booking.pickup.name}</Row>
              <Row label="Drop-off">{booking.dropoff.name}</Row>
              <Row label="When">
                {formatDate(booking.date)}, {booking.time}
              </Row>
              <Row label="Passengers">{booking.passengers}</Row>
              <Row label="Needs">{booking.vehicleName}</Row>
              <Row label="Distance">
                {booking.estimated ? "About " : ""}
                {formatKm(booking.distanceKm)}, {formatDuration(booking.durationMin)}
              </Row>
              <Row label="Fare">
                {formatRupees(booking.fare)} ({formatRupees(booking.ratePerKm)} per km)
              </Row>
              <Row label="Payment">{booking.payment === "upi" ? "UPI in the vehicle" : "Cash in the vehicle"}</Row>
              <Row label="CO₂ saved">{formatCO2(booking.co2SavedG)}</Row>
              {booking.note && <Row label="Client note">{booking.note}</Row>}
              {booking.startedAt && <Row label="Started">{stamp(booking.startedAt)}</Row>}
              {booking.completedAt && <Row label="Completed">{stamp(booking.completedAt)}</Row>}
              {booking.journeySec != null && <Row label="Journey time">{formatJourney(booking.journeySec)}</Row>}
            </dl>
          </section>
        </div>

        <div className="stack">
          <section className="card map-panel map-panel--static" aria-label="Route map">
            <RideMap pickup={booking.pickup} dropoff={booking.dropoff} route={route} driver={sim?.position} driverStart={sim?.start} />
            {sim && (
              <div className="map-panel__note">
                <TrackingNote sim={sim} who="driver" />
              </div>
            )}
          </section>

          {canClose && (
            <section className="card" aria-labelledby="act-title">
              <div className="card__head">
                <h2 id="act-title">Other Actions</h2>
              </div>
              <div className="stack" style={{ gap: 16 }}>
                {["requested", "assigned"].includes(booking.status) && (
                  <ReasonForm
                    title="Reject this request"
                    button="Reject Request"
                    danger
                    onSubmit={(reason) => run(rejectRide({ bookingId: booking.id, reason }), "Request rejected. The client can see the reason.")}
                  />
                )}
                {["assigned", "in_progress"].includes(booking.status) && (
                  <div>
                    <p className="muted" style={{ marginBottom: 8, fontSize: "0.85rem" }}>
                      Use this if the driver forgot to finish the ride.
                    </p>
                    <button className="btn btn--ghost" type="button" onClick={forceComplete}>
                      {armed ? "Click Again to Confirm" : "Mark as Completed"}
                    </button>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
