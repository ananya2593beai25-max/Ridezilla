// One vehicle with its per-km fare and CO2 saved. Everything it shows arrives through props.

import Icon, { VehicleIcon } from "../../components/Icon";
import { formatCO2, formatDuration, formatRupees } from "../../lib/format";

export default function VehicleCard({ row, index, selected, onSelect }) {
  const { vehicle, fare, co2, minutes, tooFar } = row;
  const ratio = co2.baselineG ? Math.min(1, co2.rideG / co2.baselineG) : 1;

  return (
    <article className={`vehicle-card card card--hover reveal in-view${selected ? " is-selected" : ""}${tooFar ? " is-unavailable" : ""}`} style={{ "--i": index }}>
      <div className="vehicle-card__icon">
        <VehicleIcon type={vehicle.type} />
      </div>

      <div className="vehicle-card__main">
        <div className="vehicle-card__top">
          <h3>{vehicle.name}</h3>
        </div>
        <div className="vehicle-card__meta">
          <span className="chip">Seats {vehicle.seats}</span>
          <span className="chip">{vehicle.etaMin} min away</span>
          {tooFar ? (
            <span className="chip chip--warn">Rides up to {vehicle.maxKm} km</span>
          ) : (
            <span className="chip">{formatDuration(minutes)} ride</span>
          )}
          <span className="chip">{formatRupees(vehicle.ratePerKm)} per km</span>
        </div>
        <div className="compare">
          <div className="compare__bar">
            <span style={{ "--w": ratio.toFixed(3) }} />
          </div>
          <div className="compare__text">
            {formatCO2(co2.rideG)} of CO₂ vs {formatCO2(co2.baselineG)} in a {vehicle.baselineLabel}
          </div>
        </div>
      </div>

      <div className="vehicle-card__side">
        <span className="chip chip--green">
          <Icon name="leaf" size={14} />
          Saves {formatCO2(co2.savedG)}
        </span>
        <strong className="num price">{formatRupees(fare.total)}</strong>
        <button
          type="button"
          className={`btn ${selected ? "btn--primary" : "btn--ghost"}`}
          aria-pressed={selected}
          aria-label={tooFar ? `${vehicle.name} is only for rides up to ${vehicle.maxKm} km` : `${selected ? "Selected" : "Select"} ${vehicle.name}`}
          disabled={tooFar}
          onClick={() => onSelect(vehicle.id)}
        >
          {tooFar ? "Too far" : selected ? "Selected" : "Select"}
        </button>
      </div>
    </article>
  );
}
