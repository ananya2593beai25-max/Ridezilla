// Driver profile and the on-duty switch.

import ChangePasswordForm from "../auth/ChangePasswordForm";
import { useDispatch } from "react-redux";
import { useOutletContext } from "react-router-dom";
import { useToast } from "../../context/ToastContext";
import { driverUpdated } from "../drivers/driversSlice";

const Row = ({ label, children }) => (
  <div>
    <dt>{label}</dt>
    <dd>{children}</dd>
  </div>
);

export default function DriverProfilePage() {
  const { driver } = useOutletContext();
  const dispatch = useDispatch();
  const toast = useToast();
  const onRide = driver.status === "on_ride";

  function toggleDuty() {
    const next = driver.status === "off_duty" ? "available" : "off_duty";
    dispatch(driverUpdated({ id: driver.id, changes: { status: next } }));
    toast(next === "available" ? "You are on duty. The admin can assign you rides." : "You are off duty. You will not get new rides.");
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Profile</h1>
        </div>
      </div>

      <section className="card" aria-labelledby="me">
        <div className="card__head">
          <h2 id="me">{driver.name}</h2>
          <span className={`chip ${driver.status === "available" ? "chip--green" : ""}`.trim()}>
            {driver.status === "on_ride" ? "On a ride" : driver.status === "off_duty" ? "Off duty" : "Available"}
          </span>
        </div>
        <dl className="summary-list">
          <Row label="Email">{driver.email}</Row>
          <Row label="Mobile">{driver.phone}</Row>
          <Row label="Licence number">{driver.licenseNumber}</Row>
        </dl>

        <div style={{ marginTop: 20 }}>
          <button className="btn btn--ghost btn--lg btn--block" type="button" onClick={toggleDuty} disabled={onRide}>
            {driver.status === "off_duty" ? "Go On Duty" : "Go Off Duty"}
          </button>
          {onRide && (
            <p className="muted" style={{ marginTop: 10, fontSize: "0.85rem" }}>
              You are on a ride. Finish it before going off duty.
            </p>
          )}
        </div>
      </section>

      <div style={{ marginTop: 20 }}>
        <ChangePasswordForm role="driver" />
      </div>
    </>
  );
}
