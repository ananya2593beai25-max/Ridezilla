// Admin: the riders with an account. A rider who forgot their password sends a request from the login page, and it shows here.
// The admin makes a temporary password, shown once, and sends it to the rider, who must then choose their own.
// The admin never sees a rider's real password.

import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useToast } from "../../context/ToastContext";
import FilterBar from "../../components/FilterBar";
import Pagination from "../../components/Pagination";
import { usePagination } from "../../hooks/usePagination";
import { STORAGE } from "../../lib/config";
import { formatDate } from "../../lib/format";
import { listClients } from "../auth/authService";
import { resetCustomerPassword, selectOpenRequestUserIds } from "../auth/passwordRequestsSlice";
import CredentialsDialog from "./CredentialsDialog";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "requested", label: "Reset requested" },
];

const PAGE_SIZE = 8;

export default function AdminCustomersPage() {
  const dispatch = useDispatch();
  const toast = useToast();
  const openIds = useSelector(selectOpenRequestUserIds);

  // Rider accounts live in the browser's user list, not in Redux. Read them again when another tab changes it.
  const [customers, setCustomers] = useState(listClients);
  useEffect(() => {
    const onStorage = (e) => e.key === STORAGE.users && setCustomers(listClients());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [credentials, setCredentials] = useState(null); // { driver (the person), tempPassword }
  const [armed, setArmed] = useState(null);

  const counts = useMemo(() => ({ all: customers.length, requested: customers.filter((c) => openIds.has(c.id)).length }), [customers, openIds]);

  // Riders who asked for help come first.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return customers
      .filter((c) => (filter === "all" || openIds.has(c.id)) && (!q || `${c.name} ${c.email} ${c.phone}`.toLowerCase().includes(q)))
      .sort((a, b) => Number(openIds.has(b.id)) - Number(openIds.has(a.id)) || a.name.localeCompare(b.name));
  }, [customers, openIds, filter, query]);

  const pager = usePagination(filtered, PAGE_SIZE, `${filter}|${query}`);

  // A second click confirms, because the old password stops working at once.
  async function reset(customer) {
    if (armed !== customer.id) {
      setArmed(customer.id);
      setTimeout(() => setArmed((a) => (a === customer.id ? null : a)), 4000);
      return;
    }
    setArmed(null);
    const result = await dispatch(resetCustomerPassword(customer.id));
    if (result.error) {
      toast("Could not reset the password.");
      return;
    }
    setCustomers(listClients());
    setCredentials({ driver: customer, tempPassword: result.payload });
  }

  const chips = (c) => (
    <>
      {openIds.has(c.id) ? <span className="chip chip--warn">Reset requested</span> : <span className="chip chip--green">Active</span>}
      {c.mustChangePassword && <span className="chip">Temporary password</span>}
    </>
  );

  const action = (c) => (
    <button className={`btn ${armed === c.id ? "btn--danger is-armed" : openIds.has(c.id) ? "btn--ok" : "btn--info"}`} type="button" onClick={() => reset(c)}>
      {armed === c.id ? "Click Again to Reset" : "Reset Password"}
    </button>
  );

  return (
    <>
      <div className="app-top">
        <div>
          <h1>Customers</h1>
          <p>Riders with an account. When one forgets their password they send a request, and you send them a temporary password.</p>
        </div>
      </div>

      <div className="list-toolbar">
        <div className="field field--search">
          <label htmlFor="customer-search" className="sr-only">
            Search customers
          </label>
          <input id="customer-search" className="input" type="search" placeholder="Search name, email or phone…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <FilterBar label="Filter customers" value={filter} onChange={setFilter} options={FILTERS.map((f) => ({ ...f, count: counts[f.value] }))} />
      </div>

      <section aria-labelledby="customer-list">
        <h2 id="customer-list" className="list-heading">
          Registered Customers <span className="muted">({filtered.length})</span>
        </h2>

        {filtered.length === 0 ? (
          <div className="card empty">
            <h3 style={{ fontSize: "1.1rem" }}>{customers.length ? "No customer matches" : "No customers yet"}</h3>
            <p>{customers.length ? "Try another search or filter." : "Riders appear here after they create an account."}</p>
          </div>
        ) : (
          <>
            <div className="data-table table-wrap card">
              <table className="table">
                <caption className="sr-only">Registered customers</caption>
                <thead>
                  <tr>
                    <th scope="col">Name</th>
                    <th scope="col">Email</th>
                    <th scope="col">Mobile</th>
                    <th scope="col">Joined</th>
                    <th scope="col">Status</th>
                    <th scope="col" className="col-actions">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pager.slice.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <strong>{c.name}</strong>
                      </td>
                      <td>{c.email}</td>
                      <td>{c.phone || "Not given"}</td>
                      <td>{formatDate(c.createdAt)}</td>
                      <td>
                        <div className="chip-row">{chips(c)}</div>
                      </td>
                      <td className="col-actions">
                        <div className="row-actions">{action(c)}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="data-cards">
              {pager.slice.map((c) => (
                <li key={c.id} className="record-card">
                  <div className="record-card__head">
                    <strong>{c.name}</strong>
                  </div>
                  <div className="chip-row">{chips(c)}</div>
                  <p className="muted">
                    {c.phone || "No mobile"} · {c.email}
                  </p>
                  <div className="record-card__actions">{action(c)}</div>
                </li>
              ))}
            </ul>

            <Pagination page={pager.page} pageCount={pager.pageCount} total={pager.total} from={pager.from} to={pager.to} onPage={pager.setPage} noun="customers" />
          </>
        )}
      </section>

      {credentials && <CredentialsDialog {...credentials} role="client" onClose={() => setCredentials(null)} />}
    </>
  );
}
