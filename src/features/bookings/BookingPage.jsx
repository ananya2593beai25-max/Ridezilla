// Booking page (signed-in users only): review the ride, see the per-km fare and CO2 saved, then confirm.

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useAuth } from "../../context/AuthContext";
import RideMap from "../ride/RideMap";
import { fetchRoute, resetRide, routeKey } from "../ride/rideSlice";
import { fetchVehicles, selectRideRows } from "../vehicles/vehiclesSlice";
import { addBooking } from "./bookingsSlice";
import { buildBooking } from "./buildBooking";
import { useActiveRide } from "./useActiveRide";
import CountUp from "../../components/CountUp";
import { formatCO2, formatDate, formatDuration, formatKm, formatRupees } from "../../lib/format";

const Row = ({ label, children, className }) => (
  <div className={className}>
    <dt>{label}</dt>
    <dd>{children}</dd>
  </div>
);

export default function BookingPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useAuth();
  const activeRide = useActiveRide();
  const ride = useSelector((s) => s.ride);
  const rows = useSelector(selectRideRows);

  const { pickup, dropoff, route } = ride;
  const key = routeKey(pickup, dropoff);
  const row = rows.find((r) => r.vehicle.id === ride.selectedVehicleId);

  useEffect(() => {
    dispatch(fetchVehicles());
  }, [dispatch]);

  useEffect(() => {
    if (key && key !== route.key) dispatch(fetchRoute({ from: pickup, to: dropoff }));
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { name: user.name, phone: user.phone || "", payment: "cash", note: "" },
  });

  // One ride at a time: a user with a scheduled ride cannot book a second one.
  if (activeRide) {
    return (
      <div className="container">
        <div className="card empty" style={{ marginTop: 48 }}>
          <h1 style={{ fontSize: "1.5rem" }}>You already have a ride scheduled</h1>
          <p>You can book another ride once your current one is completed or cancelled.</p>
          <Link className="btn btn--primary" to={`/bookings/${activeRide.id}`}>
            View My Ride
          </Link>
        </div>
      </div>
    );
  }

  if (!pickup || !dropoff || !ride.selectedVehicleId) {
    return (
      <div className="container">
        <div className="card empty" style={{ marginTop: 48 }}>
          <h1 style={{ fontSize: "1.5rem" }}>Nothing to book yet</h1>
          <p>Choose a route and a vehicle first, then come back here to confirm.</p>
          <Link className="btn btn--primary" to={pickup && dropoff ? "/rides" : "/#search"}>
            {pickup && dropoff ? "Choose a Vehicle" : "Plan a Ride"}
          </Link>
        </div>
      </div>
    );
  }

  const ready = route.key === key && route.status === "ready" && row;
  if (!ready) {
    return (
      <div className="container">
        <div className="page-head">
          <h1>Confirm Your Ride</h1>
        </div>
        <div className="booking-grid" aria-busy="true">
          <div className="skeleton" style={{ height: 420, borderRadius: 16 }} />
          <div className="skeleton" style={{ height: 420, borderRadius: 16 }} />
        </div>
      </div>
    );
  }

  const { vehicle, fare, co2 } = row;
  const routeData = route.data;

  // The ride is longer than this vehicle takes (the route may have changed after the vehicle was chosen).
  if (row.tooFar) {
    return (
      <div className="container">
        <div className="card empty" style={{ marginTop: 48 }}>
          <h1 style={{ fontSize: "1.5rem" }}>This ride is too long for {vehicle.name}</h1>
          <p>
            {vehicle.name} takes rides up to {vehicle.maxKm} km. This one is {formatKm(routeData.distanceKm)}. Choose another vehicle.
          </p>
          <Link className="btn btn--primary" to="/rides">
            Choose a Vehicle
          </Link>
        </div>
      </div>
    );
  }
  const prefix = routeData.estimated ? "About " : "";

  function onSubmit(form) {
    const booking = buildBooking({ user, ride, vehicle, route: routeData, fare, co2, form });
    dispatch(addBooking(booking));
    dispatch(resetRide());
    navigate(`/bookings/${booking.id}`, { replace: true, state: { justBooked: true } });
  }

  return (
    <div className="container">
      <div className="page-head">
        <div>
          <h1>Confirm Your Ride</h1>
          <p>Check the details, confirm your contact number and send the request.</p>
        </div>
      </div>

      <div className="booking-grid booking-grid--ordered">
        <div className="stack">
          <section className="card m-o1" aria-labelledby="trip-title">
            <div className="card__head">
              <h2 id="trip-title">Your Ride</h2>
              <Link to="/rides" className="muted" style={{ fontSize: "0.85rem" }}>
                Change vehicle
              </Link>
            </div>
            <dl className="summary-list">
              <Row label="Pickup">{pickup.name}</Row>
              <Row label="Drop-off">{dropoff.name}</Row>
              <Row label="When">
                {formatDate(ride.date)}, {ride.time}
              </Row>
              <Row label="Passengers">{ride.passengers}</Row>
              <Row label="Vehicle">
                {vehicle.name} (seats {vehicle.seats})
              </Row>
              <Row label="Road distance">
                {prefix}
                {formatKm(routeData.distanceKm)}
              </Row>
              <Row label="Travel time">
                {prefix}
                {formatDuration(row.minutes)}
              </Row>
            </dl>
          </section>

          <form id="rider-form" className="card m-o3" onSubmit={handleSubmit(onSubmit)} noValidate aria-labelledby="rider-title">
            <div className="card__head">
              <h2 id="rider-title">Rider Details</h2>
            </div>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="rider-name">Full name</label>
                <input
                  id="rider-name"
                  className="input"
                  autoComplete="name"
                  aria-invalid={errors.name ? "true" : "false"}
                  {...register("name", { required: "Enter your full name.", minLength: { value: 2, message: "Name needs at least 2 letters." } })}
                />
                <p className="field-error" aria-live="polite">
                  {errors.name?.message}
                </p>
              </div>
              <div className="field">
                <label htmlFor="rider-phone">Mobile number</label>
                <input
                  id="rider-phone"
                  className="input"
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  autoComplete="tel-national"
                  aria-invalid={errors.phone ? "true" : "false"}
                  {...register("phone", {
                    required: "Enter your mobile number.",
                    pattern: { value: /^[6-9]\d{9}$/, message: "Enter 10 digits starting with 6, 7, 8 or 9." },
                  })}
                />
                <p className="field-error" aria-live="polite">
                  {errors.phone?.message}
                </p>
              </div>

              <fieldset className="field full radio-group">
                <legend className="label">Pay by</legend>
                <label className="radio">
                  <input type="radio" value="cash" {...register("payment")} />
                  Cash in the vehicle
                </label>
                <label className="radio">
                  <input type="radio" value="upi" {...register("payment")} />
                  UPI in the vehicle
                </label>
              </fieldset>

              <div className="field full">
                <label htmlFor="rider-note">Note for the driver (optional)</label>
                <textarea
                  id="rider-note"
                  className="input"
                  maxLength={200}
                  placeholder="Gate number, landmark…"
                  {...register("note", { maxLength: { value: 200, message: "Keep the note under 200 characters." } })}
                />
              </div>
            </div>

            <button className="btn btn--primary btn--lg btn--block book-submit-inline" type="submit" style={{ marginTop: 16 }} disabled={isSubmitting}>
              Request Booking · {formatRupees(fare.total)}
            </button>
            <p className="muted" style={{ marginTop: 12, fontSize: "0.8rem" }}>
              We assign a vehicle and driver after you request, and you can cancel until the trip starts. You pay the driver at the end of the ride.
            </p>
          </form>
        </div>

        <div className="stack">
          <section className="card map-panel map-panel--static m-o4" aria-label="Route map">
            <RideMap pickup={pickup} dropoff={dropoff} route={routeData} />
          </section>

          <section className="card m-o2" aria-labelledby="fare-title">
            <div className="card__head">
              <h2 id="fare-title">Fare</h2>
              <span className="chip">{formatRupees(fare.ratePerKm)} per km</span>
            </div>
            <dl className="summary-list">
              <Row label={`${formatKm(routeData.distanceKm)} × ${formatRupees(fare.ratePerKm)} per km`}>{formatRupees(fare.perKmTotal)}</Row>
              {fare.minApplied && <Row label={`Minimum fare applies (${formatRupees(fare.minFare)})`}>{formatRupees(fare.minFare)}</Row>}
              <Row label="Total" className="total">
                {formatRupees(fare.total)}
              </Row>
            </dl>
          </section>

          <section className="card m-o5" aria-labelledby="co2-title">
            <div className="card__head">
              <h2 id="co2-title">CO₂ Saved</h2>
            </div>
            <div className="co2-hero">
              <span className="muted" style={{ fontSize: "0.85rem" }}>
                You save on this ride
              </span>
              <strong className="num">
                <CountUp value={co2.savedG / 1000} decimals={2} suffix={" kg"} />
              </strong>
              <span className="muted" style={{ fontSize: "0.9rem" }}>
                {ride.passengers > 1 ? `${formatCO2(co2.savedG / ride.passengers)} per person. ` : ""}About {co2.trees.toFixed(3)} tree-years of absorption.
              </span>
            </div>
            <div className="compare-rows" style={{ marginTop: 18 }}>
              <div className="compare-row">
                <div className="compare-row__head">
                  <span>Same trip in a {vehicle.baselineLabel}</span>
                  <strong className="num">{formatCO2(co2.baselineG)}</strong>
                </div>
                <div className="compare-row__bar">
                  <span className="bar--petrol" style={{ "--w": 1 }} />
                </div>
              </div>
              <div className="compare-row">
                <div className="compare-row__head">
                  <span>{vehicle.name}</span>
                  <strong className="num">{formatCO2(co2.rideG)}</strong>
                </div>
                <div className="compare-row__bar">
                  <span className="bar--ev" style={{ "--w": (co2.rideG / co2.baselineG).toFixed(3) }} />
                </div>
              </div>
            </div>
            <p className="muted" style={{ marginTop: 14, fontSize: "0.8rem" }}>
              Estimates use grid-adjusted electricity emissions for the electric vehicle and average tailpipe emissions for the petrol comparison.
            </p>
          </section>
        </div>
      </div>

      {/* Phones only: the total and the confirm button stay in view while the rider scrolls through the details. */}
      <div className="book-bar">
        <div className="book-bar__total">
          <span className="muted">Total</span>
          <strong className="num">{formatRupees(fare.total)}</strong>
        </div>
        <button className="btn btn--primary" type="submit" form="rider-form" disabled={isSubmitting}>
          Request Booking
        </button>
      </div>
    </div>
  );
}
