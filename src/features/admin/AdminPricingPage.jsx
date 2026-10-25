// Admin: change the per-km rate, the minimum fare, the average speed and the longest ride of each vehicle type.
// New bookings use the new rate at once. Rides already booked keep the fare they were given.

import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { useToast } from "../../context/ToastContext";
import { VehicleIcon } from "../../components/Icon";
import { fetchVehicles, rateUpdated, selectVehicles } from "../vehicles/vehiclesSlice";
import { calcFare, travelMinutes } from "../../lib/calc";
import { formatDuration, formatRupees } from "../../lib/format";

// The form shows an empty "longest ride" box for a vehicle with no limit.
const valuesOf = (v) => ({ ratePerKm: v.ratePerKm, minFare: v.minFare, avgSpeedKmh: v.avgSpeedKmh, maxKm: v.maxKm ?? "" });

function RateRow({ vehicle }) {
  const dispatch = useDispatch();
  const toast = useToast();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm({ defaultValues: valuesOf(vehicle) });

  // Another tab or a reset can change the saved rate, so the form follows it.
  useEffect(() => {
    reset(valuesOf(vehicle));
  }, [vehicle.ratePerKm, vehicle.minFare, vehicle.avgSpeedKmh, vehicle.maxKm, reset]); // eslint-disable-line react-hooks/exhaustive-deps

  const rate = Number(watch("ratePerKm")) || 0;
  const min = Number(watch("minFare")) || 0;
  const speed = Number(watch("avgSpeedKmh")) || 0;
  const limit = String(watch("maxKm") ?? "").trim() === "" ? null : Number(watch("maxKm"));
  const preview = calcFare({ ratePerKm: rate, minFare: min }, 10).total;

  // Where the minimum fare stops mattering: below this distance the rate would charge less than the minimum.
  const breakeven = rate > 0 ? min / rate : 0;
  const shortKm = Math.max(1, Math.min(3, Math.floor(breakeven / 2) || 1));
  const shortByRate = Math.round(rate * shortKm);
  const minApplies = rate > 0 && shortByRate < min;

  function onSubmit(form) {
    const maxKm = String(form.maxKm).trim() === "" ? null : Number(form.maxKm);
    dispatch(rateUpdated({ id: vehicle.id, ratePerKm: Number(form.ratePerKm), minFare: Number(form.minFare), avgSpeedKmh: Number(form.avgSpeedKmh), maxKm }));
    toast(`${vehicle.name} saved: ${formatRupees(Number(form.ratePerKm))} per km, ${form.avgSpeedKmh} km/h, ${maxKm ? `rides up to ${maxKm} km` : "no distance limit"}.`);
  }

  const id = (name) => `${vehicle.id}-${name}`;

  return (
    <form className="card rate-row" onSubmit={handleSubmit(onSubmit)} noValidate aria-label={`${vehicle.name} pricing`}>
      <div className="rate-row__head">
        <span className="rate-row__icon">
          <VehicleIcon type={vehicle.type} size={34} />
        </span>
        <div>
          <h2 style={{ fontSize: "1.05rem" }}>{vehicle.name}</h2>
          <p className="muted" style={{ fontSize: "0.85rem" }}>
            Seats {vehicle.seats} · A 10 km ride costs {formatRupees(preview)}
          </p>
        </div>
      </div>

      <div className="rate-row__fields">
        <div className="field">
          <label htmlFor={id("rate")}>Rate per km (₹)</label>
          <input
            id={id("rate")}
            className="input"
            type="number"
            inputMode="decimal"
            step="0.5"
            aria-invalid={errors.ratePerKm ? "true" : "false"}
            {...register("ratePerKm", {
              required: "Enter a rate.",
              validate: (v) => (Number(v) >= 1 && Number(v) <= 200) || "Use a rate from 1 to 200.",
            })}
          />
          <p className="field-error" aria-live="polite">
            {errors.ratePerKm?.message}
          </p>
        </div>
        <div className="field">
          <label htmlFor={id("min")}>Minimum fare (₹)</label>
          <input
            id={id("min")}
            className="input"
            type="number"
            inputMode="numeric"
            step="1"
            aria-invalid={errors.minFare ? "true" : "false"}
            {...register("minFare", {
              required: "Enter a minimum fare.",
              validate: (v) => (Number(v) >= 0 && Number(v) <= 2000) || "Use an amount from 0 to 2000.",
            })}
          />
          <p className="field-error" aria-live="polite">
            {errors.minFare?.message}
          </p>
        </div>
        <div className="field">
          <label htmlFor={id("speed")}>Average speed (km/h)</label>
          <input
            id={id("speed")}
            className="input"
            type="number"
            inputMode="numeric"
            step="1"
            aria-invalid={errors.avgSpeedKmh ? "true" : "false"}
            {...register("avgSpeedKmh", {
              required: "Enter a speed.",
              validate: (v) => (Number(v) >= 5 && Number(v) <= 120) || "Use a speed from 5 to 120.",
            })}
          />
          <p className="field-error" aria-live="polite">
            {errors.avgSpeedKmh?.message}
          </p>
        </div>
        <div className="field">
          <label htmlFor={id("max")}>Longest ride (km)</label>
          <input
            id={id("max")}
            className="input"
            type="number"
            inputMode="numeric"
            step="1"
            placeholder="No limit"
            aria-invalid={errors.maxKm ? "true" : "false"}
            {...register("maxKm", {
              validate: (v) => String(v).trim() === "" || (Number(v) >= 1 && Number(v) <= 500) || "Use 1 to 500, or leave empty for no limit.",
            })}
          />
          <p className="field-error" aria-live="polite">
            {errors.maxKm?.message}
          </p>
        </div>
        <button className="btn btn--primary rate-row__save" type="submit" disabled={!isDirty}>
          Save Changes
        </button>
      </div>

      {/* A plain-words explanation that follows the numbers as they are typed. */}
      <div className="rate-explain">
        <p>
          <strong>Minimum fare</strong> is the least a rider ever pays, even for a very short trip. It stops tiny rides from costing almost nothing.
        </p>
        <p style={{ marginTop: 8 }}>
          <strong>Average speed</strong> gives the trip time: {speed > 0 ? `a 10 km ride takes ${formatDuration(travelMinutes({ avgSpeedKmh: speed }, 10))}` : "enter a speed to see it"}.{" "}
          <strong>Longest ride</strong> is the farthest this vehicle takes: {limit ? `rides over ${limit} km cannot book it` : "empty means no limit"}.
        </p>
        {rate > 0 && min > 0 ? (
          <ul>
            <li>
              Rides up to <strong>{breakeven.toFixed(1)} km</strong> cost the minimum, <strong>{formatRupees(min)}</strong>.
            </li>
            <li>
              Longer rides cost <strong>{formatRupees(rate)}</strong> for every km.
            </li>
            {minApplies && (
              <li>
                Example: a {shortKm} km ride is {formatRupees(shortByRate)} at the rate, which is below the minimum, so the rider pays <strong>{formatRupees(min)}</strong>.
              </li>
            )}
          </ul>
        ) : (
          <p className="muted">Enter a rate and a minimum fare to see how they work together.</p>
        )}
      </div>
    </form>
  );
}

export default function AdminPricingPage() {
  const dispatch = useDispatch();
  const vehicles = useSelector(selectVehicles);

  // On a phone the four cards sit in a row you swipe sideways. The dots show which one is in view and jump to another.
  const track = useRef(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    dispatch(fetchVehicles());
  }, [dispatch]);

  function onScroll() {
    const el = track.current;
    const first = el?.children[0];
    if (!first) return;
    const step = first.getBoundingClientRect().width + 12; // card width plus the gap
    setActive(Math.min(vehicles.length - 1, Math.max(0, Math.round(el.scrollLeft / step))));
  }

  function goTo(index) {
    track.current?.children[index]?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
  }

  return (
    <>
      <div className="app-top">
        <div>
          <h1>Pricing</h1>
          <p>Set the rate, minimum fare, average speed and longest ride for each vehicle type. Clients see the new rate on their next search. Rides already booked keep their fare.</p>
        </div>
      </div>

      {vehicles.length === 0 ? (
        <div className="skeleton" style={{ height: 220, borderRadius: 16 }} />
      ) : (
        <>
          <div className="rate-carousel" ref={track} onScroll={onScroll}>
            {vehicles.map((v) => (
              <RateRow key={v.id} vehicle={v} />
            ))}
          </div>

          <div className="rate-dots" aria-label="Choose a vehicle type">
            <span className="rate-dots__label" aria-live="polite">
              {vehicles[active]?.name} · {active + 1} of {vehicles.length}
            </span>
            <div className="rate-dots__row">
              {vehicles.map((v, i) => (
                <button key={v.id} type="button" className="rate-dot" aria-label={`Show ${v.name}`} aria-current={i === active ? "true" : undefined} onClick={() => goTo(i)} />
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}
