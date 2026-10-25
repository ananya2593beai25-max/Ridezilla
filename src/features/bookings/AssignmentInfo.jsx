// What the client sees once an admin has assigned the ride: car model, car number and driver.

import Icon from "../../components/Icon";

export default function AssignmentInfo({ booking }) {
  const a = booking.assignment;

  if (booking.status === "requested") {
    return (
      <div className="notice" role="status">
        <Icon name="clock" />
        <div>We have your request. A vehicle and driver will be assigned soon, and the details will appear here.</div>
      </div>
    );
  }
  if (!a) return null;

  return (
    <div className="assignment" aria-label="Vehicle and driver">
      <div className="assignment__item">
        <span className="assignment__label">Vehicle</span>
        <strong>{a.vehicleModel}</strong>
        <span className="plate">{formatPlate(a.plateNumber)}</span>
        {a.color && <span className="muted">{a.color}</span>}
      </div>
      <div className="assignment__item">
        <span className="assignment__label">Driver</span>
        <strong>{a.driverName}</strong>
        {a.driverPhone && (
          <a href={`tel:${a.driverPhone}`} className="muted">
            {a.driverPhone}
          </a>
        )}
      </div>
    </div>
  );
}

/** PB65AB1234 reads easier as PB 65 AB 1234. */
export function formatPlate(plate) {
  const m = /^([A-Z]{2})(\d{1,2})([A-Z]{1,3})(\d{4})$/.exec(plate);
  return m ? `${m[1]} ${m[2]} ${m[3]} ${m[4]}` : plate;
}
