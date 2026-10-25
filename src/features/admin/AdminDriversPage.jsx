// Admin: register drivers and manage them.
// Laptop: a table with search, status filter and pagination. Phone: one card per driver, same data.
// The admin never picks or sees a driver's password. Registering makes a random temporary one, shown once to hand over,
// and the driver must replace it at the first login (see features/staff/SetPasswordPage.jsx).

import { selectOpenRequestUserIds } from "../auth/passwordRequestsSlice";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { useToast } from "../../context/ToastContext";
import FilterBar from "../../components/FilterBar";
import FormSheet from "../../components/FormSheet";
import Pagination from "../../components/Pagination";
import { usePagination } from "../../hooks/usePagination";
import { driverSelectors, registerDriver, removeDriver, resetDriverPassword, setDriverActive } from "../drivers/driversSlice";
import CredentialsDialog from "./CredentialsDialog";

// Indian driving licence: state letters, RTO code, year, serial number. 2 + 2 + 4 + 7 = 15 characters.
const LICENCE_PATTERN = /^[A-Z]{2}\d{2}\d{4}\d{7}$/;
const cleanLicence = (value) => value.replace(/[\s-]/g, "").toUpperCase();

const DRIVER_STATUS = {
  available: { label: "Available", chip: "chip--green" },
  on_ride: { label: "On a ride", chip: "chip--warn" },
  off_duty: { label: "Off duty", chip: "" },
};

const FILTERS = [
  { value: "all", label: "All" },
  { value: "available", label: "Available" },
  { value: "on_ride", label: "On a ride" },
  { value: "off_duty", label: "Off duty" },
  { value: "disabled", label: "Disabled" },
  { value: "pending", label: "No password yet" },
];

const matches = (d, filter) => {
  if (filter === "all") return true;
  if (filter === "disabled") return !d.active;
  if (filter === "pending") return Boolean(d.passwordPending);
  return d.active && d.status === filter;
};

const PAGE_SIZE = 8;

export default function AdminDriversPage() {
  const dispatch = useDispatch();
  const toast = useToast();
  const drivers = useSelector(driverSelectors.selectAll);
  const requestedIds = useSelector(selectOpenRequestUserIds);

  const [sheetOpen, setSheetOpen] = useState(false); // the register form, as a popup
  const [credentials, setCredentials] = useState(null); // { driver, tempPassword, isNew }
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const closeSheet = useCallback(() => setSheetOpen(false), []);

  const counts = useMemo(() => Object.fromEntries(FILTERS.map((f) => [f.value, drivers.filter((d) => matches(d, f.value)).length])), [drivers]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return drivers.filter((d) => matches(d, filter) && (!q || `${d.name} ${d.phone} ${d.email} ${d.licenseNumber}`.toLowerCase().includes(q)));
  }, [drivers, filter, query]);

  const pager = usePagination(filtered, PAGE_SIZE, `${filter}|${query}`);

  // Removing and resetting are hard to undo, so the first click only arms the button for a few seconds.
  const [armed, setArmed] = useState(null); // { id, kind }
  const armTimer = useRef();
  useEffect(() => () => clearTimeout(armTimer.current), []);

  function arm(id, kind) {
    setArmed({ id, kind });
    clearTimeout(armTimer.current);
    armTimer.current = setTimeout(() => setArmed(null), 4000);
  }
  const isArmed = (id, kind) => armed?.id === id && armed?.kind === kind;

  async function remove(driver) {
    if (!isArmed(driver.id, "remove")) return arm(driver.id, "remove");
    clearTimeout(armTimer.current);
    setArmed(null);
    const result = await dispatch(removeDriver(driver.id));
    toast(result.error ? result.payload?.message || "Could not remove this driver." : `${driver.name} was removed.`);
  }

  // A driver who has never logged in can be given the login details at once. One who already chose a password
  // would be locked out by a reset, so that needs a second click.
  async function shareLogin(driver) {
    if (!driver.passwordPending && !isArmed(driver.id, "reset")) return arm(driver.id, "reset");
    clearTimeout(armTimer.current);
    setArmed(null);
    const result = await dispatch(resetDriverPassword(driver.id));
    if (result.error) return toast(result.payload?.message || "Could not create a new password.");
    setCredentials({ driver, tempPassword: result.payload.tempPassword, isNew: false });
  }

  async function toggle(driver) {
    const result = await dispatch(setDriverActive({ id: driver.id, active: !driver.active }));
    if (result.error) toast(result.payload?.message || "Could not change this driver.");
    else toast(driver.active ? `${driver.name} was disabled and can no longer log in.` : `${driver.name} was enabled again.`);
  }

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { name: "", phone: "", email: "", licenseNumber: "" } });

  async function onSubmit(form) {
    const result = await dispatch(registerDriver({ ...form, licenseNumber: cleanLicence(form.licenseNumber) }));
    if (result.error) {
      const { field, message } = result.payload || {};
      setError(field && field !== "root" ? field : "root", { message: message || "Could not register the driver." });
      return;
    }
    reset();
    setSheetOpen(false);
    setCredentials({ driver: result.payload.driver, tempPassword: result.payload.tempPassword, isNew: true });
  }

  const fp = (name) => ({ "aria-invalid": errors[name] ? "true" : "false", "aria-describedby": `${name}-error` });
  const err = (name) => (
    <p id={`${name}-error`} className="field-error" aria-live="polite">
      {errors[name]?.message}
    </p>
  );

  const statusChips = (d) => (
    <>
      <span className={`chip ${DRIVER_STATUS[d.status]?.chip || ""}`.trim()}>{d.active ? DRIVER_STATUS[d.status]?.label : "Disabled"}</span>
      {d.passwordPending && <span className="chip chip--warn">No password yet</span>}
      {requestedIds.has(d.userId) && <span className="chip chip--warn">Reset requested</span>}
    </>
  );

  // The same three buttons in the table row and on the phone card.
  const actions = (d) => (
    <>
      {/* Green: give the driver their login. Blue: reset it (a second click confirms). Amber: switch off or on. Red: remove. */}
      <button className={`btn ${isArmed(d.id, "reset") ? "btn--danger is-armed" : d.passwordPending ? "btn--ok" : "btn--info"}`} type="button" onClick={() => shareLogin(d)}>
        {isArmed(d.id, "reset") ? "Click Again to Reset" : d.passwordPending ? "Share Login" : "Reset Password"}
      </button>
      <button className={`btn ${d.active ? "btn--warn" : "btn--ok"}`} type="button" onClick={() => toggle(d)}>
        {d.active ? "Disable" : "Enable"}
      </button>
      <button className={`btn btn--danger${isArmed(d.id, "remove") ? " is-armed" : ""}`} type="button" onClick={() => remove(d)}>
        {isArmed(d.id, "remove") ? "Click Again to Remove" : "Remove"}
      </button>
    </>
  );

  return (
    <>
      <div className="app-top">
        <div>
          <h1>Drivers</h1>
          <p>Register a driver to give them a login. They then see their rides at /driver.</p>
        </div>
        <button className="btn btn--primary sheet__open-btn" type="button" onClick={() => setSheetOpen(true)}>
          Register Driver
        </button>
      </div>

      <FormSheet open={sheetOpen} onClose={closeSheet} title="Register Driver">
        <form className="card" onSubmit={handleSubmit(onSubmit)} noValidate aria-labelledby="reg-driver">
          <div className="card__head">
            <h2 id="reg-driver">Register Driver</h2>
          </div>

          {errors.root && (
            <div className="notice notice--error" role="alert" style={{ marginBottom: 14 }}>
              {errors.root.message}
            </div>
          )}

          <div className="form-grid">
            <div className="field full">
              <label htmlFor="name">Full name</label>
              <input id="name" className="input" autoComplete="off" placeholder="Gurpreet Singh…" {...fp("name")}
                {...register("name", { required: "Enter the driver's name.", minLength: { value: 2, message: "Use at least 2 letters." }, pattern: { value: /^[\p{L} .'-]+$/u, message: "Use letters only." } })} />
              {err("name")}
            </div>
            <div className="field">
              <label htmlFor="phone">Mobile number</label>
              <input id="phone" className="input" type="tel" inputMode="numeric" maxLength={10} autoComplete="off" placeholder="9876543210…" {...fp("phone")}
                {...register("phone", { required: "Enter a mobile number.", pattern: { value: /^[6-9]\d{9}$/, message: "Enter 10 digits starting with 6, 7, 8 or 9." } })} />
              {err("phone")}
            </div>
            <div className="field">
              <label htmlFor="licenseNumber">Licence number</label>
              <input id="licenseNumber" className="input" autoComplete="off" spellCheck="false" placeholder="PB1020210001234…" {...fp("licenseNumber")}
                {...register("licenseNumber", {
                  required: "Enter the driving licence number.",
                  validate: (v) => LICENCE_PATTERN.test(cleanLicence(v)) || "The licence number has 15 characters, like PB1020210001234.",
                })} />
              {err("licenseNumber")}
            </div>
            <p className="muted form-grid__hint full">
              Licence number: 15 characters, which are 2 letters for the state, 2 digits for the RTO, 4 digits for the year and 7 digits for the serial number. Spaces and dashes are fine.
            </p>
            <div className="field full">
              <label htmlFor="email">Login email</label>
              <input id="email" className="input" type="email" autoComplete="off" spellCheck="false" placeholder="driver@example.com…" {...fp("email")}
                {...register("email", { required: "Enter an email.", pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, message: "Enter an email like name@example.com." } })} />
              {err("email")}
            </div>
          </div>

          <p className="muted" style={{ marginTop: 6, fontSize: "0.85rem", lineHeight: 1.45 }}>
            We create a random temporary password and show it once. The driver must choose their own at the first login, so the password never stays with you.
          </p>

          <button className="btn btn--primary btn--lg btn--block" type="submit" disabled={isSubmitting} style={{ marginTop: 12 }}>
            {isSubmitting ? "Registering…" : "Register Driver"}
          </button>
        </form>
      </FormSheet>

      <div className="list-toolbar">
        <div className="field field--search">
          <label htmlFor="driver-search" className="sr-only">
            Search drivers
          </label>
          <input id="driver-search" className="input" type="search" placeholder="Search name, phone, email or licence…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <FilterBar label="Filter drivers" value={filter} onChange={setFilter} options={FILTERS.map((f) => ({ ...f, count: counts[f.value] }))} />
      </div>

      {/* The heading sits on the page, not inside a card. */}
      <section aria-labelledby="driver-list">
        <h2 id="driver-list" className="list-heading">
          Registered Drivers <span className="muted">({filtered.length})</span>
        </h2>

        {filtered.length === 0 ? (
          <div className="card empty">
            <h3 style={{ fontSize: "1.1rem" }}>{drivers.length ? "No driver matches" : "No drivers yet"}</h3>
            <p>{drivers.length ? "Try another search or filter." : "Use Register Driver to add the first one."}</p>
          </div>
        ) : (
          <>
            {/* Laptop: a table */}
            <div className="data-table table-wrap card">
              <table className="table">
                <caption className="sr-only">Registered drivers</caption>
                <thead>
                  <tr>
                    <th scope="col">Driver</th>
                    <th scope="col">Mobile</th>
                    <th scope="col">Licence</th>
                    <th scope="col">Status</th>
                    <th scope="col" className="col-actions">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pager.slice.map((d) => (
                    <tr key={d.id} className={d.active ? "" : "is-off"}>
                      <td>
                        <strong>{d.name}</strong>
                        <br />
                        <span className="muted">{d.email}</span>
                      </td>
                      <td>{d.phone}</td>
                      <td className="mono">{d.licenseNumber}</td>
                      <td>
                        <div className="chip-row">{statusChips(d)}</div>
                      </td>
                      <td className="col-actions">
                        <div className="row-actions">{actions(d)}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Phone: one card for each driver */}
            <ul className="data-cards">
              {pager.slice.map((d) => (
                <li key={d.id} className={`record-card${d.active ? "" : " is-off"}`}>
                  <div className="record-card__head">
                    <strong>{d.name}</strong>
                  </div>
                  <div className="chip-row">{statusChips(d)}</div>
                  <p className="muted">
                    {d.phone} · {d.email}
                  </p>
                  <p className="muted">Licence {d.licenseNumber}</p>
                  <div className="record-card__actions">{actions(d)}</div>
                </li>
              ))}
            </ul>

            <Pagination page={pager.page} pageCount={pager.pageCount} total={pager.total} from={pager.from} to={pager.to} onPage={pager.setPage} noun="drivers" />
          </>
        )}
      </section>

      {credentials && <CredentialsDialog {...credentials} onClose={() => setCredentials(null)} />}
    </>
  );
}
