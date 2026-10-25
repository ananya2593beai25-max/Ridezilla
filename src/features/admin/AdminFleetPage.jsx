// Admin: register electric vehicles and set them to available or under maintenance.
// Laptop: a table with search, status and category filters, and pagination. Phone: one card per vehicle.

import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { useToast } from "../../context/ToastContext";
import FilterBar from "../../components/FilterBar";
import FormSheet from "../../components/FormSheet";
import Pagination from "../../components/Pagination";
import Select from "../../components/Select";
import { SERVICE_AREA } from "../../lib/config";
import { usePagination } from "../../hooks/usePagination";
import { fleetSelectors, registerVehicle, vehicleUpdated } from "../fleet/fleetSlice";
import { fetchVehicles, selectVehicles } from "../vehicles/vehiclesSlice";
import { formatPlate } from "../bookings/AssignmentInfo";

const VEHICLE_STATUS = {
  available: { label: "Available", chip: "chip--green" },
  on_ride: { label: "On a ride", chip: "chip--warn" },
  maintenance: { label: "Under maintenance", chip: "" },
};

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "available", label: "Available" },
  { value: "on_ride", label: "On a ride" },
  { value: "maintenance", label: "Under maintenance" },
];

const PAGE_SIZE = 8;
const locationOf = (v) => (!v.city ? "Not set" : v.city === v.state ? v.city : `${v.city}, ${v.state}`);
const citiesOf = (state) => SERVICE_AREA.find((a) => a.state === state)?.cities || [];

export default function AdminFleetPage() {
  const dispatch = useDispatch();
  const toast = useToast();
  const fleet = useSelector(fleetSelectors.selectAll);
  const catalogue = useSelector(selectVehicles);

  const [sheetOpen, setSheetOpen] = useState(false); // the add form, as a popup
  const [status, setStatusFilter] = useState("all");
  const [category, setCategory] = useState("all");
  const [stateFilter, setStateFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [query, setQuery] = useState("");
  const closeSheet = useCallback(() => setSheetOpen(false), []);

  useEffect(() => {
    dispatch(fetchVehicles());
  }, [dispatch]);

  // Counts for the status filter respect the chosen category and search, so the numbers match what the table would show.
  const q = query.trim().toLowerCase();
  const base = useMemo(
    () => fleet.filter((v) => (category === "all" || v.catalogueId === category) &&
        (stateFilter === "all" || v.state === stateFilter) &&
        (cityFilter === "all" || v.city === cityFilter) &&
        (!q || `${v.modelName} ${v.plateNumber} ${v.color} ${v.city}`.toLowerCase().includes(q))),
    [fleet, category, stateFilter, cityFilter, q]
  );
  const counts = useMemo(() => Object.fromEntries(STATUS_FILTERS.map((f) => [f.value, base.filter((v) => f.value === "all" || v.status === f.value).length])), [base]);
  const filtered = useMemo(() => base.filter((v) => status === "all" || v.status === status), [base, status]);

  const pager = usePagination(filtered, PAGE_SIZE, `${status}|${category}|${stateFilter}|${cityFilter}|${query}`);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { catalogueId: "", modelName: "", plateNumber: "", color: "", state: "", city: "" } });

  const chosen = catalogue.find((c) => c.id === watch("catalogueId"));
  const formCities = citiesOf(watch("state"));

  async function onSubmit(form) {
    const result = await dispatch(registerVehicle(form));
    if (result.error) {
      const { field, message } = result.payload || {};
      setError(field || "root", { message: message || "Could not add the vehicle." });
      return;
    }
    toast(`${form.modelName} was added to the fleet.`);
    reset();
    setSheetOpen(false);
  }

  function setStatus(vehicle, next) {
    dispatch(vehicleUpdated({ id: vehicle.id, changes: { status: next } }));
    toast(next === "maintenance" ? `${vehicle.modelName} is now under maintenance and will not be assigned.` : `${vehicle.modelName} is available again.`);
  }

  const fp = (name) => ({ "aria-invalid": errors[name] ? "true" : "false", "aria-describedby": `${name}-error` });
  const err = (name) => (
    <p id={`${name}-error`} className="field-error" aria-live="polite">
      {errors[name]?.message}
    </p>
  );

  const statusChip = (v) => <span className={`chip ${VEHICLE_STATUS[v.status]?.chip || ""}`.trim()}>{VEHICLE_STATUS[v.status]?.label}</span>;

  // The same action in the table row and on the phone card.
  const action = (v) =>
    v.status === "on_ride" ? (
      <span className="muted" style={{ fontSize: "0.8rem" }}>
        Free it from the request
      </span>
    ) : (
      <button className={`btn ${v.status === "available" ? "btn--warn" : "btn--ok"}`} type="button" onClick={() => setStatus(v, v.status === "available" ? "maintenance" : "available")}>
        {v.status === "available" ? "Send to Maintenance" : "Mark Available"}
      </button>
    );

  return (
    <>
      <div className="app-top">
        <div>
          <h1>Fleet</h1>
          <p>Register the electric vehicles you can assign to rides.</p>
        </div>
        <button className="btn btn--primary sheet__open-btn" type="button" onClick={() => setSheetOpen(true)}>
          Add Vehicle
        </button>
      </div>

      <FormSheet open={sheetOpen} onClose={closeSheet} title="Add Vehicle">
        <form className="card" onSubmit={handleSubmit(onSubmit)} noValidate aria-labelledby="add-vehicle">
          <div className="card__head">
            <h2 id="add-vehicle">Add Vehicle</h2>
          </div>

          {errors.root && (
            <div className="notice notice--error" role="alert" style={{ marginBottom: 14 }}>
              {errors.root.message}
            </div>
          )}

          <div className="form-grid">
            <div className="field full">
              <label htmlFor="catalogueId">Category</label>
              <Select id="catalogueId" className="input" {...fp("catalogueId")} {...register("catalogueId", { required: "Choose a category." })}>
                <option value="">Select a category…</option>
                {catalogue.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (seats {c.seats})
                  </option>
                ))}
              </Select>
              {err("catalogueId")}
              {chosen && (
                <p className="muted" style={{ fontSize: "0.8rem" }}>
                  Seats are set from the category: {chosen.seats}.
                </p>
              )}
            </div>
            <div className="field full">
              <label htmlFor="modelName">Model</label>
              <input id="modelName" className="input" autoComplete="off" placeholder="Mahindra Treo…" maxLength={40} {...fp("modelName")}
                {...register("modelName", { required: "Enter the model name.", minLength: { value: 2, message: "Use at least 2 characters." } })} />
              {err("modelName")}
            </div>
            <div className="field">
              <label htmlFor="state">State</label>
              <Select id="state" className="input" {...fp("state")} {...register("state", { required: "Choose a state.", onChange: () => setValue("city", "") })}>
                <option value="">Select a state…</option>
                {SERVICE_AREA.map((a) => (
                  <option key={a.state} value={a.state}>
                    {a.state}
                  </option>
                ))}
              </Select>
              {err("state")}
            </div>
            <div className="field">
              <label htmlFor="city">City</label>
              <Select id="city" className="input" disabled={formCities.length === 0} {...fp("city")} {...register("city", { required: "Choose a city." })}>
                <option value="">{formCities.length ? "Select a city…" : "Choose a state first"}</option>
                {formCities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
              {err("city")}
            </div>
            <div className="field">
              <label htmlFor="plateNumber">Number plate</label>
              <input id="plateNumber" className="input" autoComplete="off" spellCheck="false" placeholder="PB65AB1234…" maxLength={14} {...fp("plateNumber")}
                {...register("plateNumber", { required: "Enter the number plate." })} />
              {err("plateNumber")}
            </div>
            <div className="field">
              <label htmlFor="color">Colour</label>
              <input id="color" className="input" autoComplete="off" placeholder="Yellow…" maxLength={20} {...fp("color")}
                {...register("color", { required: "Enter the colour so riders can spot it." })} />
              {err("color")}
            </div>
          </div>

          <button className="btn btn--primary btn--lg btn--block" type="submit" disabled={isSubmitting} style={{ marginTop: 8 }}>
            Add Vehicle
          </button>
        </form>
      </FormSheet>

      <div className="list-toolbar">
        <div className="field field--search">
          <label htmlFor="fleet-search" className="sr-only">
            Search vehicles
          </label>
          <input id="fleet-search" className="input" type="search" placeholder="Search model, plate, colour or city…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="field field--category">
          <label htmlFor="fleet-category" className="sr-only">
            Category
          </label>
          <Select id="fleet-category" className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="all">All categories</option>
            {catalogue.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="field field--category">
          <label htmlFor="fleet-state" className="sr-only">
            State
          </label>
          <Select
            id="fleet-state"
            className="input"
            value={stateFilter}
            onChange={(e) => {
              setStateFilter(e.target.value);
              setCityFilter("all");
            }}
          >
            <option value="all">All states</option>
            {SERVICE_AREA.map((a) => (
              <option key={a.state} value={a.state}>
                {a.state}
              </option>
            ))}
          </Select>
        </div>
        <div className="field field--category">
          <label htmlFor="fleet-city" className="sr-only">
            City
          </label>
          <Select id="fleet-city" className="input" value={cityFilter} onChange={(e) => setCityFilter(e.target.value)}>
            <option value="all">All cities</option>
            {(stateFilter === "all" ? SERVICE_AREA.flatMap((a) => a.cities) : citiesOf(stateFilter)).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </div>
        <FilterBar label="Filter by status" value={status} onChange={setStatusFilter} options={STATUS_FILTERS.map((f) => ({ ...f, count: counts[f.value] }))} />
      </div>

      {/* The heading sits on the page, not inside a card. */}
      <section aria-labelledby="fleet-list">
        <h2 id="fleet-list" className="list-heading">
          Vehicles <span className="muted">({filtered.length})</span>
        </h2>

        {filtered.length === 0 ? (
          <div className="card empty">
            <h3 style={{ fontSize: "1.1rem" }}>{fleet.length ? "No vehicle matches" : "No vehicles yet"}</h3>
            <p>{fleet.length ? "Try another search or filter." : "Use Add Vehicle to register the first one."}</p>
          </div>
        ) : (
          <>
            {/* Laptop: a table */}
            <div className="data-table table-wrap card">
              <table className="table">
                <caption className="sr-only">Vehicles in the fleet</caption>
                <thead>
                  <tr>
                    <th scope="col">Vehicle</th>
                    <th scope="col">Number plate</th>
                    <th scope="col">Category</th>
                    <th scope="col">Location</th>
                    <th scope="col">Seats</th>
                    <th scope="col">Status</th>
                    <th scope="col" className="col-actions">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pager.slice.map((v) => (
                    <tr key={v.id}>
                      <td>
                        <strong>{v.modelName}</strong>
                        <br />
                        <span className="muted">{v.color}</span>
                      </td>
                      <td>
                        <span className="plate plate--small">{formatPlate(v.plateNumber)}</span>
                      </td>
                      <td>{v.categoryName}</td>
                      <td>{locationOf(v)}</td>
                      <td className="num">{v.seats}</td>
                      <td>{statusChip(v)}</td>
                      <td className="col-actions">
                        <div className="row-actions">{action(v)}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Phone: one card for each vehicle */}
            <ul className="data-cards">
              {pager.slice.map((v) => (
                <li key={v.id} className="record-card">
                  <div className="record-card__head">
                    <strong>{v.modelName}</strong>
                    <span className="plate plate--small">{formatPlate(v.plateNumber)}</span>
                  </div>
                  <div className="chip-row">{statusChip(v)}</div>
                  <p className="muted">
                    {v.categoryName} · seats {v.seats} · {v.color}
                    <br />
                    {locationOf(v)}
                  </p>
                  <div className="record-card__actions">{action(v)}</div>
                </li>
              ))}
            </ul>

            <Pagination page={pager.page} pageCount={pager.pageCount} total={pager.total} from={pager.from} to={pager.to} onPage={pager.setPage} noun="vehicles" />
          </>
        )}
      </section>
    </>
  );
}
