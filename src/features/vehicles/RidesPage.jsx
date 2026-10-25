// Vehicles page: the route on the map, vehicles that seat the group, per-km fare and CO2 on each card.

import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import Icon from "../../components/Icon";
import Select from "../../components/Select";
import FilterBar from "../../components/FilterBar";
import RideMap from "../ride/RideMap";
import { fetchRoute, routeKey, selectVehicle } from "../ride/rideSlice";
import { fetchVehicles, selectRideRows, selectVehicles } from "./vehiclesSlice";
import VehicleCard from "./VehicleCard";
import { useActiveRide } from "../bookings/useActiveRide";
import { formatCO2, formatDate, formatKm, formatRupees } from "../../lib/format";

const SORTERS = {
  co2: (a, b) => b.co2.savedG - a.co2.savedG,
  price: (a, b) => a.fare.total - b.fare.total,
  eta: (a, b) => a.vehicle.etaMin - b.vehicle.etaMin,
};
const TYPE_LABELS = { bike: "E-Bike", rickshaw: "E-Rickshaw", car: "Electric Car" };

export default function RidesPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const ride = useSelector((s) => s.ride);
  const vehiclesState = useSelector((s) => s.vehicles);
  const allVehicles = useSelector(selectVehicles);
  const rows = useSelector(selectRideRows);
  const activeRide = useActiveRide();

  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("co2");

  const { pickup, dropoff, route } = ride;
  const key = routeKey(pickup, dropoff);

  useEffect(() => {
    dispatch(fetchVehicles());
  }, [dispatch]);

  useEffect(() => {
    if (key && key !== route.key) dispatch(fetchRoute({ from: pickup, to: dropoff }));
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  const types = useMemo(() => [...new Set(rows.map((r) => r.vehicle.type))], [rows]);
  const shown = useMemo(
    () => rows.filter((r) => filter === "all" || r.vehicle.type === filter).sort(SORTERS[sort]),
    [rows, filter, sort]
  );
  const hidden = allVehicles.filter((v) => v.seats < ride.passengers);
  const selectedRow = rows.find((r) => r.vehicle.id === ride.selectedVehicleId && !r.tooFar);
  const farOnes = rows.filter((r) => r.tooFar);

  // No ride in progress, or the user already has a scheduled ride (only one at a time).
  if (activeRide || !pickup || !dropoff) {
    return (
      <div className="container" style={{ paddingTop: 32 }}>
        <div className="card empty">
          <h1 style={{ fontSize: "1.5rem" }}>{activeRide ? "You already have a ride scheduled" : "No ride planned yet"}</h1>
          <p>
            {activeRide
              ? "You can book another ride once your current one is completed or cancelled."
              : "Pick a pickup, a drop-off and the number of passengers on the home page."}
          </p>
          <Link className="btn btn--primary" to={activeRide ? `/bookings/${activeRide.id}` : "/#search"}>
            {activeRide ? "View My Ride" : "Plan a Ride"}
          </Link>
        </div>
      </div>
    );
  }

  const routeReady = route.key === key && route.status === "ready";
  const routeData = routeReady ? route.data : null;

  return (
    <div className="container rides-page">
      <div className="page-head">
        <div>
          <h1>Available Electric Rides</h1>
          <p>Only vehicles with enough seats for your group are shown. Fares are charged per kilometre.</p>
        </div>
      </div>

      <div className="card ride-bar">
        <div className="ride-bar__route">
          <span title={pickup.name}>{pickup.name}</span>
          <Icon name="arrow" />
          <span title={dropoff.name}>{dropoff.name}</span>
        </div>
        <div className="ride-bar__meta">
          <span className="chip">
            {ride.passengers} {ride.passengers === 1 ? "passenger" : "passengers"}
          </span>
          <span className="chip">
            {formatDate(ride.date)}, {ride.time}
          </span>
          {routeData && (
            <>
              <span className="chip">
                {routeData.estimated ? "About " : ""}
                {formatKm(routeData.distanceKm)}
              </span>
            </>
          )}
        </div>
        <Link className="btn btn--ghost" to="/#search">
          Change Ride
        </Link>
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {routeReady && `${shown.length} ${shown.length === 1 ? "vehicle fits" : "vehicles fit"} ${ride.passengers} passengers.`}
      </p>

      <div className="split">
        <section className="vehicle-sheet" aria-labelledby="list-title">
          <div className="toolbar">
            <h2 id="list-title" className="sr-only">
              Vehicles
            </h2>
            {types.length > 1 && (
              <FilterBar
                label="Filter by vehicle type"
                value={filter}
                onChange={setFilter}
                options={["all", ...types].map((type) => ({ value: type, label: type === "all" ? "All vehicles" : TYPE_LABELS[type] }))}
              />
            )}
            <div className="field" style={{ gridAutoFlow: "column", alignItems: "center", gap: 8 }}>
              <label htmlFor="sort" className="label">
                Sort
              </label>
              <Select id="sort" className="input select-inline" value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="co2">Most CO₂ Saved</option>
                <option value="price">Lowest Price</option>
                <option value="eta">Fastest Pickup</option>
              </Select>
            </div>
          </div>

          <div className="stack" style={{ marginBottom: 14 }}>
            {routeData?.estimated && <div className="notice notice--warn">Road routing is unavailable right now, so distance and time are estimates.</div>}
            {farOnes.length > 0 && (
              <div className="notice">
                This ride is {formatKm(routeData.distanceKm)}. {farOnes.map((r) => `${r.vehicle.name} takes up to ${r.vehicle.maxKm} km`).join(" and ")}, so {farOnes.length === 1 ? "it is" : "they are"} not available for it.
              </div>
            )}
            {hidden.length > 0 && (
              <div className="notice">
                {hidden.map((v) => v.name).join(" and ")} {hidden.length === 1 ? "seats" : "seat"} fewer than {ride.passengers} riders, so{" "}
                {hidden.length === 1 ? "it is" : "they are"} hidden.
              </div>
            )}
          </div>

          <div className="vehicle-list" aria-busy={!routeReady}>
            {(vehiclesState.status === "error" || route.status === "error") && (
              <div className="notice notice--error" role="alert">
                <div>{vehiclesState.error || route.error}</div>
                <button
                  className="btn btn--ghost"
                  type="button"
                  onClick={() => {
                    dispatch(fetchVehicles());
                    dispatch(fetchRoute({ from: pickup, to: dropoff }));
                  }}
                >
                  Try Again
                </button>
              </div>
            )}

            {!routeReady && route.status !== "error" && vehiclesState.status !== "error" &&
              [0, 1, 2].map((i) => <div key={i} className="skeleton" style={{ height: 132, borderRadius: 16 }} />)}

            {routeReady && shown.map((row, i) => (
              <VehicleCard
                key={row.vehicle.id}
                row={row}
                index={i}
                selected={ride.selectedVehicleId === row.vehicle.id}
                onSelect={(id) => dispatch(selectVehicle(id))}
              />
            ))}
          </div>
        </section>

        <aside className="card map-panel" aria-label="Route map">
          <RideMap pickup={pickup} dropoff={dropoff} route={routeData} interactive />
          {routeData?.estimated && (
            <div className="map-overlay">
              <span className="chip chip--warn">Estimated route</span>
            </div>
          )}
        </aside>
      </div>

      <div className="select-bar" hidden={!selectedRow}>
        <div className="select-bar__inner">
          <div className="select-bar__info">
            <strong>{selectedRow?.vehicle.name}</strong>
            <span className="muted" style={{ fontSize: "0.85rem" }}>
              {selectedRow && `${formatRupees(selectedRow.fare.total)} · ${formatCO2(selectedRow.co2.savedG)} CO₂ saved`}
            </span>
          </div>
          <button className="btn btn--primary" type="button" onClick={() => navigate("/book")}>
            Continue to Booking
          </button>
        </div>
      </div>
    </div>
  );
}
