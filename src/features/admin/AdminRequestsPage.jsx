// All booking requests in a table, with a status filter and search. A row opens the request page.

import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import StatusChip from "../../components/StatusChip";
import FilterBar from "../../components/FilterBar";
import { selectBookingsNewestFirst } from "../bookings/bookingsSlice";
import { formatPlate } from "../bookings/AssignmentInfo";
import { STATUS, whenLabel } from "../../lib/bookingStatus";
import { formatRupees } from "../../lib/format";

const FILTERS = ["all", "requested", "assigned", "in_progress", "completed", "closed"];
const FILTER_LABEL = { all: "All", requested: "Requested", assigned: "Assigned", in_progress: "In progress", completed: "Completed", closed: "Cancelled or rejected" };
const inFilter = (b, f) => f === "all" || (f === "closed" ? ["cancelled", "rejected"].includes(b.status) : b.status === f);

export default function AdminRequestsPage() {
  const bookings = useSelector(selectBookingsNewestFirst);
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");

  const counts = useMemo(() => Object.fromEntries(FILTERS.map((f) => [f, bookings.filter((b) => inFilter(b, f)).length])), [bookings]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return bookings.filter(
      (b) => inFilter(b, filter) && (!q || `${b.riderName} ${b.pickup.name} ${b.dropoff.name} ${b.assignment?.driverName || ""} ${b.assignment?.plateNumber || ""}`.toLowerCase().includes(q))
    );
  }, [bookings, filter, query]);

  return (
    <>
      <div className="app-top">
        <div>
          <h1>Booking Requests</h1>
          <p>Open a request to assign a vehicle and a driver.</p>
        </div>
      </div>

      <div className="toolbar">
        <FilterBar
          label="Filter by status"
          value={filter}
          onChange={setFilter}
          options={FILTERS.map((f) => ({ value: f, label: FILTER_LABEL[f], count: counts[f] }))}
        />
        <div className="field" style={{ minWidth: 220 }}>
          <label htmlFor="req-search" className="sr-only">
            Search requests
          </label>
          <input id="req-search" className="input" type="search" placeholder="Search client, place, driver…" value={query} onChange={(e) => setQuery(e.target.value)} style={{ minHeight: 40 }} />
        </div>
      </div>

      {shown.length === 0 ? (
        <div className="card empty">
          <h2 style={{ fontSize: "1.2rem" }}>{bookings.length ? "Nothing in this view" : "No requests yet"}</h2>
          <p>{bookings.length ? "Try another filter or search." : "Requests appear here as soon as a client books a ride."}</p>
        </div>
      ) : (
        <div className="table-wrap card">
          <table className="table">
            <caption className="sr-only">Booking requests</caption>
            <thead>
              <tr>
                <th scope="col">Client</th>
                <th scope="col">Route</th>
                <th scope="col">When</th>
                <th scope="col">Needs</th>
                <th scope="col">Assigned</th>
                <th scope="col">Fare</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((b) => (
                // The whole row opens the request. The name stays a real link, so keyboard and screen reader users can reach it too.
                <tr key={b.id} className="table__row--click" onClick={(e) => !e.target.closest("a") && navigate(`/admin/requests/${b.id}`)}>
                  <td data-label="Client">
                    <Link to={`/admin/requests/${b.id}`} className="table__link">
                      {b.riderName}
                    </Link>
                  </td>
                  <td data-label="Route" className="table__route">
                    {b.pickup.name} to {b.dropoff.name}
                  </td>
                  <td data-label="When">{whenLabel(b)}</td>
                  <td data-label="Needs">
                    {b.vehicleName}, {b.passengers} {b.passengers === 1 ? "rider" : "riders"}
                  </td>
                  <td data-label="Assigned">
                    {b.assignment ? (
                      <>
                        {b.assignment.vehicleModel} <span className="plate plate--small">{formatPlate(b.assignment.plateNumber)}</span>
                        <br />
                        <span className="muted">{b.assignment.driverName}</span>
                      </>
                    ) : (
                      <span className="muted">Not yet</span>
                    )}
                  </td>
                  <td data-label="Fare" className="num">
                    {formatRupees(b.fare)}
                  </td>
                  <td data-label="Status">
                    <StatusChip status={b.status} short />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="muted" style={{ marginTop: 12, fontSize: "0.8rem" }}>
        Statuses: {Object.values(STATUS).map((s) => s.short).join(", ")}.
      </p>
    </>
  );
}
