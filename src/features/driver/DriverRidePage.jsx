// What a driver sees first: the vehicle they are driving and the ride assigned to them,
// with a code box to start and end the ride.

import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useOutletContext } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useToast } from "../../context/ToastContext";
import StatusChip from "../../components/StatusChip";
import { VehicleIcon } from "../../components/Icon";
import RideMap from "../ride/RideMap";
import { getRoute } from "../ride/routing";
import { makeSelectDriverBookings } from "../bookings/bookingsSlice";
import OtpForm from "./OtpForm";
import TrackingNote from "../bookings/TrackingNote";
import { useDriverSim } from "../../lib/simulation";
import { cancelRide, completeRide, startRide } from "../bookings/rideLifecycle";
import { formatPlate } from "../bookings/AssignmentInfo";
import { fleetSelectors } from "../fleet/fleetSlice";
import { whenLabel } from "../../lib/bookingStatus";
import { formatCO2, formatDuration, formatKm, formatRupees } from "../../lib/format";

const Row = ({ label, children }) => (
  <div>
    <dt>{label}</dt>
    <dd>{children}</dd>
  </div>
);

// The driver can cancel an assigned ride, but must say why. The client sees the reason.
function CancelForm({ onCancel }) {
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { reason: "" } });

  if (!open) {
    return (
      <button className="btn btn--danger btn--block" type="button" style={{ marginTop: 10 }} onClick={() => setOpen(true)}>
        Cancel This Ride
      </button>
    );
  }

  return (
    <form className="reason-form reason-form--stack" onSubmit={handleSubmit(({ reason }) => onCancel(reason.trim()))} noValidate style={{ marginTop: 14 }}>
      <div className="field">
        <label htmlFor="cancel-reason">Why are you cancelling?</label>
        <input
          id="cancel-reason"
          className="input"
          placeholder="The client will see this…"
          maxLength={160}
          autoFocus
          aria-invalid={errors.reason ? "true" : "false"}
          {...register("reason", { required: "Give a short reason.", minLength: { value: 4, message: "Use at least 4 characters." } })}
        />
        <p className="field-error" aria-live="polite">
          {errors.reason?.message}
        </p>
      </div>
      <div className="btn-pair">
        <button className="btn btn--ghost" type="button" onClick={() => setOpen(false)}>
          Keep Ride
        </button>
        <button className="btn btn--danger" type="submit" disabled={isSubmitting}>
          Confirm Cancel
        </button>
      </div>
    </form>
  );
}

export default function DriverRidePage() {
  const { driver } = useOutletContext();
  const dispatch = useDispatch();
  const toast = useToast();
  const selectMine = useMemo(makeSelectDriverBookings, []);
  const rides = useSelector((s) => selectMine(s, driver.id));
  const ride = rides.find((b) => ["assigned", "in_progress"].includes(b.status)) || null;
  const vehicle = useSelector((s) => (ride ? fleetSelectors.selectById(s, ride.assignment.fleetId) : null));
  const [route, setRoute] = useState(null);
  const sim = useDriverSim(ride, route);

  useEffect(() => {
    if (!ride) return;
    let live = true;
    getRoute(ride.pickup, ride.dropoff)
      .then((r) => live && setRoute(r))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [ride?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function act(action, okMessage) {
    const result = await dispatch(action);
    toast(result.error ? result.payload?.message || "That did not work." : okMessage);
  }

  if (!ride) {
    return (
      <>
        <div className="page-head">
          <div>
            <h1>My Ride</h1>
            <p>Hello {driver.name.split(" ")[0]}.</p>
          </div>
        </div>
        <div className="card empty">
          <span className={`chip ${driver.status === "available" ? "chip--green" : ""}`.trim()}>
            {!driver.active ? "Disabled" : driver.status === "off_duty" ? "Off duty" : "Available"}
          </span>
          <h2 style={{ fontSize: "1.3rem" }}>No ride assigned</h2>
          <p>
            {driver.status === "off_duty"
              ? "You are off duty, so you will not get new rides. Switch to available on the Profile tab."
              : "When the admin assigns you a ride, it appears here with your vehicle and the client's details."}
          </p>
        </div>
      </>
    );
  }

  const a = ride.assignment;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>My Ride</h1>
          <p>
            {whenLabel(ride)} · {ride.passengers} {ride.passengers === 1 ? "rider" : "riders"}
          </p>
        </div>
        <StatusChip status={ride.status} />
      </div>

      <div className="driver-grid">
        <div className="stack">
          <section className="card vehicle-hero" aria-labelledby="my-vehicle">
            <div className="vehicle-hero__icon">
              <VehicleIcon type={ride.vehicleType} size={52} />
            </div>
            <div>
              <h2 id="my-vehicle" style={{ fontSize: "1.2rem" }}>
                {a.vehicleModel}
              </h2>
              <p className="plate" style={{ marginTop: 8 }}>
                {formatPlate(a.plateNumber)}
              </p>
              <p className="muted" style={{ marginTop: 8, fontSize: "0.9rem" }}>
                {a.color}
                {vehicle ? ` · seats ${vehicle.seats}` : ""}
              </p>
            </div>
          </section>

          <section className="card" aria-labelledby="ride-info">
            <div className="card__head">
              <h2 id="ride-info">Ride</h2>
            </div>
            <div className="sample-ride__route">
              <div className="sample-ride__stop">
                <span className="sample-ride__dot" style={{ background: "var(--accent)" }} />
                {ride.pickup.name}
              </div>
              <div className="sample-ride__line" aria-hidden="true" />
              <div className="sample-ride__stop">
                <span className="sample-ride__dot" style={{ background: "var(--info)" }} />
                {ride.dropoff.name}
              </div>
            </div>
            <dl className="summary-list" style={{ marginTop: 12 }}>
              <Row label="Client">{ride.riderName}</Row>
              <Row label="Client phone">
                <a href={`tel:${ride.riderPhone}`}>{ride.riderPhone || "Not given"}</a>
              </Row>
              <Row label="Distance">
                {formatKm(ride.distanceKm)}, about {formatDuration(ride.durationMin)}
              </Row>
              <Row label="Fare to collect">
                {formatRupees(ride.fare)} ({ride.payment === "upi" ? "UPI" : "cash"})
              </Row>
              <Row label="CO₂ saved">{formatCO2(ride.co2SavedG)}</Row>
              {ride.note && <Row label="Client note">{ride.note}</Row>}
            </dl>

            <div style={{ marginTop: 18 }}>
              {ride.status === "assigned" ? (
                <OtpForm key="start" kind="start" onVerify={(otp) => act(startRide({ bookingId: ride.id, driverId: driver.id, otp }), "Code accepted. The ride has started. Drive safe.")} />
              ) : (
                <OtpForm
                  key="end"
                  kind="end"
                  onVerify={(otp) => act(completeRide({ bookingId: ride.id, by: "driver", driverId: driver.id, otp }), "Code accepted. Ride completed. You are free for the next one.")}
                />
              )}
              <CancelForm onCancel={(reason) => act(cancelRide({ bookingId: ride.id, by: "driver", driverId: driver.id, reason }), "Ride cancelled. The client can see your reason.")} />
            </div>
          </section>
        </div>

        <section className="card map-panel map-panel--static driver-map" aria-label="Route map">
          <RideMap pickup={ride.pickup} dropoff={ride.dropoff} route={route} driver={sim?.position} driverStart={sim?.start} />
          <div className="map-panel__note">
            <TrackingNote sim={sim} who="driver" />
          </div>
        </section>
      </div>
    </>
  );
}
