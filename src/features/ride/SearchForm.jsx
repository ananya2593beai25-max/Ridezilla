// Ride search form built with react-hook-form. Pickup and drop-off come from typing OR clicking the map.

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Controller, useForm } from "react-hook-form";
import Icon from "../../components/Icon";
import Stepper from "../../components/Stepper";
import { useToast } from "../../context/ToastContext";
import { MAX_PASSENGERS } from "../../lib/config";
import { haversineKm } from "../../lib/calc";
import { formatKm, todayISO } from "../../lib/format";
import PlaceInput from "./PlaceInput";
import RideMap, { publishPosition } from "./RideMap";
import { reverseGeocode, inRegion } from "./geocode";
import { fetchRoute, routeKey, setRide } from "./rideSlice";

export default function SearchForm() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const toast = useToast();
  const ride = useSelector((s) => s.ride);
  const route = ride.route;

  const {
    control,
    register,
    handleSubmit,
    setValue,
    watch,
    clearErrors,
    formState: { errors },
  } = useForm({
    defaultValues: {
      pickup: ride.pickup,
      dropoff: ride.dropoff,
      passengers: ride.passengers,
      date: ride.date,
      time: ride.time,
    },
  });

  const pickup = watch("pickup");
  const dropoff = watch("dropoff");
  const [mapTarget, setMapTarget] = useState(ride.pickup ? "dropoff" : "pickup");
  const [locating, setLocating] = useState(false);

  // As soon as both places are known, ask for the road route so the map and distance update live.
  const key = routeKey(pickup, dropoff);
  useEffect(() => {
    if (key && key !== route.key) dispatch(fetchRoute({ from: pickup, to: dropoff }));
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  const routeReady = key && route.key === key && route.status === "ready";
  const routeLoading = key && route.key === key && route.status === "loading";

  const setPlace = (field, place) => setValue(field, place, { shouldValidate: true, shouldDirty: true });

  async function handleMapClick(lat, lng) {
    let place = null;
    try {
      place = await reverseGeocode(lat, lng);
    } catch {
      // The lookup failed (offline or rate limited). Keep the pin, name it by position.
      place = inRegion(lat, lng) ? { name: `Pin at ${lat.toFixed(4)}, ${lng.toFixed(4)}`, label: "", lat, lng } : null;
    }
    if (!place) {
      toast("That spot is outside our area, or has no road nearby.");
      return;
    }
    setPlace(mapTarget, place);
    if (mapTarget === "pickup") setMapTarget("dropoff");
  }

  function locateMe() {
    if (!navigator.geolocation) {
      toast("Your browser does not support location access.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const { latitude: lat, longitude: lng } = coords;
        let place = null;
        let lookupFailed = false;
        try {
          place = await reverseGeocode(lat, lng);
        } catch {
          lookupFailed = true; // offline or rate limited: we cannot tell the country, so keep the position
        }
        if (!lookupFailed && !place) {
          toast("You are outside Punjab, Chandigarh and Panchkula. Search for a pickup instead.");
        } else {
          publishPosition([lat, lng]); // moves the blue "You are here" dot on the map
          setPlace("pickup", place || { name: "My location", label: "Current position", lat, lng });
          setMapTarget("dropoff");
        }
        setLocating(false);
      },
      () => {
        toast("Location permission was denied. Search for a pickup instead.");
        setLocating(false);
      },
      { timeout: 8000 }
    );
  }

  function swap() {
    setValue("pickup", dropoff, { shouldDirty: true });
    setValue("dropoff", pickup, { shouldDirty: true });
    // The two places just traded spots, so any old error about them no longer applies.
    clearErrors(["pickup", "dropoff"]);
  }

  function onSubmit(data) {
    dispatch(setRide(data));
    navigate("/rides");
  }

  return (
    <form id="search-form" className="card search-card" onSubmit={handleSubmit(onSubmit)} noValidate aria-labelledby="search-title">
      <div id="search">
        <h2 id="search-title">Plan Your Ride</h2>
        <p className="muted" style={{ marginTop: 6, fontSize: "0.9rem" }}>
          Type a place, or click the map to drop a pin. We cover Punjab, Chandigarh and Panchkula.
        </p>
      </div>

      <div className="route-fields">
        <Controller
          name="pickup"
          control={control}
          // deps: when pickup changes, check drop-off again, so the "too close" message appears or clears at once.
          rules={{ required: "Choose a pickup from the suggestions or the map.", deps: ["dropoff"] }}
          render={({ field }) => (
            <PlaceInput
              name={field.name}
              label="Pickup"
              variant="pickup"
              placeholder="Sector 17, Chandigarh…"
              value={field.value}
              onSelect={(place) => {
                field.onChange(place);
                setMapTarget("dropoff");
              }}
              onClear={() => field.onChange(null)}
              error={errors.pickup?.message}
            >
              <button type="button" className="icon-btn locate-btn" onClick={locateMe} disabled={locating} aria-label="Use my current location" title="Use my current location">
                {locating ? <span className="spinner" aria-hidden="true" /> : <Icon name="locate" />}
              </button>
            </PlaceInput>
          )}
        />
        <Controller
          name="dropoff"
          control={control}
          rules={{
            required: "Choose a drop-off from the suggestions or the map.",
            // Read pickup from the form values passed in, not from this render. A stale copy caused a false error after swapping.
            validate: (value, formValues) =>
              !formValues.pickup || !value || haversineKm(formValues.pickup, value) >= 0.2 || "Drop-off is too close to pickup.",
          }}
          render={({ field }) => (
            <PlaceInput
              name={field.name}
              label="Drop-off"
              variant="drop"
              placeholder="Charminar, Hyderabad…"
              value={field.value}
              onSelect={(place) => field.onChange(place)}
              onClear={() => field.onChange(null)}
              error={errors.dropoff?.message}
            >
              <button type="button" className="icon-btn locate-btn" onClick={swap} aria-label="Swap pickup and drop-off">
                <Icon name="swap" size={18} />
              </button>
            </PlaceInput>
          )}
        />
      </div>

      <div className="map-pick">
        <div className="map-pick__bar">
          <span className="label">Or pick on the map</span>
          <div className="filters" role="group" aria-label="Which point does a map click set?">
            <button type="button" className="filter-chip" aria-pressed={mapTarget === "pickup"} onClick={() => setMapTarget("pickup")}>
              Set Pickup
            </button>
            <button type="button" className="filter-chip" aria-pressed={mapTarget === "dropoff"} onClick={() => setMapTarget("dropoff")}>
              Set Drop-off
            </button>
          </div>
        </div>
        <div className="mini-map mini-map--tall">
          <RideMap pickup={pickup} dropoff={dropoff} route={routeReady ? route.data : null} onMapClick={handleMapClick} locateUser label="Map. Click to set a point." />
          {/* Same action as the target button in the Pickup box, placed on the map where riders expect it. */}
          <button type="button" className="map-locate" onClick={locateMe} disabled={locating} aria-label="Show my location and use it as pickup" title="Use my current location">
            {locating ? <span className="spinner" aria-hidden="true" /> : <Icon name="locate" />}
          </button>
        </div>
        <p className="muted map-pick__stats" role="status" aria-live="polite">
          {routeLoading && "Finding the road route…"}
          {routeReady && (
            <>
              {route.data.estimated ? "About " : ""}
              {formatKm(route.data.distanceKm)} by road. Time depends on the vehicle you choose.
            </>
          )}
          {key && route.key === key && route.status === "error" && route.error}
          {!key && "Set both points to see the road distance."}
        </p>
      </div>

      <div className="search-row">
        <Controller
          name="passengers"
          control={control}
          render={({ field }) => <Stepper id="passengers" label="Passengers" value={field.value} onChange={field.onChange} max={MAX_PASSENGERS} />}
        />
        <div className="field">
          <label htmlFor="ride-date">Date</label>
          <input
            id="ride-date"
            type="date"
            className="input"
            min={todayISO()}
            aria-invalid={errors.date ? "true" : "false"}
            {...register("date", {
              required: "Choose a date.",
              validate: (v) => v >= todayISO() || "Choose today or a later date.",
            })}
          />
        </div>
        <div className="field">
          <label htmlFor="ride-time">Time</label>
          <input
            id="ride-time"
            type="time"
            className="input"
            aria-invalid={errors.time ? "true" : "false"}
            {...register("time", {
              required: "Choose a time.",
              // For a ride today, the time must still be ahead of us.
              validate: (v, form) => {
                if (form.date !== todayISO()) return true;
                const n = new Date();
                const nowHHMM = `${String(n.getHours()).padStart(2, "0")}:${String(n.getMinutes()).padStart(2, "0")}`;
                return v > nowHHMM || "Choose a time later than now.";
              },
              deps: ["date"],
            })}
          />
        </div>
      </div>
      <p className="field-error" aria-live="polite">
        {errors.date?.message || errors.time?.message}
      </p>

      <button className="btn btn--primary btn--lg btn--block" type="submit">
        Find Electric Rides
      </button>
    </form>
  );
}
