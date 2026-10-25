// Dashboard: every number is derived from the signed-in user's bookings in the Redux store.

import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import CountUp from "../../components/CountUp";
import Reveal from "../../components/Reveal";
import { VehicleIcon } from "../../components/Icon";
import RideMap from "../ride/RideMap";
import { getRoute } from "../ride/routing";
import { makeSelectUserBookings } from "../bookings/bookingsSlice";
import { getStats } from "../../lib/stats";
import { formatCO2, formatDate, formatKm, formatRupees, greeting } from "../../lib/format";
import UpcomingRides from "../bookings/UpcomingRides";
import MonthlyChart from "./MonthlyChart";
import LevelRing from "./LevelRing";
import VehicleMix from "./VehicleMix";

function LastRoute({ booking }) {
  const [route, setRoute] = useState(null);

  useEffect(() => {
    if (!booking) return;
    let live = true;
    setRoute(null);
    getRoute(booking.pickup, booking.dropoff)
      .then((r) => live && setRoute(r))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [booking?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!booking) {
    return (
      <div className="empty" style={{ height: "100%", padding: 16 }}>
        <p>Your latest route will show here.</p>
      </div>
    );
  }
  return <RideMap pickup={booking.pickup} dropoff={booking.dropoff} route={route} interactive={false} label="Last route" />;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const selectMine = useMemo(makeSelectUserBookings, []);
  const bookings = useSelector((s) => selectMine(s, user.id));
  const stats = useMemo(() => getStats(bookings), [bookings]);
  const recent = useMemo(() => bookings.filter((b) => b.status === "completed").slice(0, 8), [bookings]);

  const delta =
    stats.lastMonth > 0 && stats.thisMonth > 0 ? Math.round(((stats.thisMonth - stats.lastMonth) / stats.lastMonth) * 100) : null;

  return (
    <div className="container page-body">
      <div className="app-top">
        <div>
          <h1>
            {greeting()}, {user.name.split(" ")[0]}
          </h1>
          <p>Here is the CO₂ you have kept out of the air by riding electric.</p>
        </div>
        <Link className="btn btn--primary" to="/#search">
          Book a Ride
        </Link>
      </div>

      <UpcomingRides />

      {stats.rides === 0 && (
        <div className="card empty" style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: "1.3rem" }}>No rides yet</h2>
          <p>Book your first ride. Once it is completed, the CO₂ you saved shows up here.</p>
        </div>
      )}

      <section className="kpi-grid" aria-label="Summary">
        <Reveal className="card kpi kpi--hero" index={0}>
          <span className="kpi__label">CO₂ saved</span>
          <strong className="kpi__value num">
            <CountUp value={stats.savedKg} decimals={1} />
            <small>kg</small>
          </strong>
          <span className={`chip${delta !== null && delta >= 0 ? " chip--green" : ""}`} style={{ width: "fit-content" }}>
            {delta !== null ? `${delta >= 0 ? "Up" : "Down"} ${Math.abs(delta)}% from last month` : `This month: ${(stats.thisMonth / 1000).toFixed(1)} kg`}
          </span>
        </Reveal>
        <Reveal className="card kpi" index={1}>
          <span className="kpi__label">Rides taken</span>
          <strong className="kpi__value num">
            <CountUp value={stats.rides} />
          </strong>
          <span className="muted" style={{ fontSize: "0.85rem" }}>
            {stats.rides ? `${formatRupees(stats.spent)} spent in total` : " "}
          </span>
        </Reveal>
        <Reveal className="card kpi" index={2}>
          <span className="kpi__label">Tree-years of absorption</span>
          <strong className="kpi__value num">
            <CountUp value={stats.trees} decimals={2} />
          </strong>
          <span className="muted" style={{ fontSize: "0.85rem" }}>
            One tree absorbs about 21 kg a year
          </span>
        </Reveal>
        <Reveal className="card kpi" index={3}>
          <span className="kpi__label">Kilometres on electric</span>
          <strong className="kpi__value num">
            <CountUp value={stats.km} decimals={stats.km < 100 ? 1 : 0} />
            <small>km</small>
          </strong>
          <span className="muted" style={{ fontSize: "0.85rem" }}>
            Road distance of booked rides
          </span>
        </Reveal>
      </section>

      <div className="dash-row dash-row--chart">
        <Reveal as="section" className="card" aria-labelledby="chart-title">
          <div className="card__head">
            <h2 id="chart-title">CO₂ Saved Per Month</h2>
            <span className="chip">Last 6 months</span>
          </div>
          <MonthlyChart months={stats.months} />
        </Reveal>

        <Reveal as="section" className="card" index={1} aria-labelledby="level-title">
          <div className="card__head">
            <h2 id="level-title">Eco Level</h2>
          </div>
          <LevelRing level={stats.level} totalKg={stats.savedKg} />
        </Reveal>
      </div>

      <div className="dash-row dash-row--lists">
        <Reveal as="section" className="card" aria-labelledby="rides-title">
          <div className="card__head">
            <h2 id="rides-title">Recent Rides</h2>
            <Link to="/bookings" style={{ fontSize: "0.85rem" }}>
              See all
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="muted">Your booked rides will appear here.</p>
          ) : (
            <ul className="ride-list">
              {recent.map((b) => (
                <li key={b.id}>
                  <Link to={`/bookings/${b.id}`} className="ride-row ride-row--link">
                    <div className="ride-row__icon">
                      <VehicleIcon type={b.vehicleType} size={30} />
                    </div>
                    <div className="ride-row__text">
                      <span className="ride-row__route" title={`${b.pickup.name} to ${b.dropoff.name}`}>
                        {b.pickup.name} to {b.dropoff.name}
                      </span>
                      <span className="ride-row__meta">
                        {formatDate(b.createdAt)} · {formatKm(b.distanceKm)} · {b.vehicleName}
                      </span>
                    </div>
                    <div className="ride-row__chip">
                      <span className="chip chip--green">Saved {formatCO2(b.co2SavedG)}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Reveal>

        <div className="stack">
          <Reveal as="section" className="card" index={1} aria-labelledby="map-title">
            <div className="card__head">
              <h2 id="map-title">Last Route</h2>
            </div>
            <div className="mini-map">
              <LastRoute booking={stats.last} />
            </div>
          </Reveal>

          <Reveal as="section" className="card" index={2} aria-labelledby="mix-title">
            <div className="card__head">
              <h2 id="mix-title">Vehicle Mix</h2>
            </div>
            <VehicleMix mix={stats.mix} />
          </Reveal>

          <Reveal as="section" className="card" index={3} aria-labelledby="vs-title">
            <div className="card__head">
              <h2 id="vs-title">Petrol vs Electric</h2>
            </div>
            {stats.baselineG ? (
              <div className="compare-rows">
                <div className="compare-row">
                  <div className="compare-row__head">
                    <span>If you had taken petrol cars</span>
                    <strong className="num">{formatCO2(stats.baselineG)}</strong>
                  </div>
                  <div className="compare-row__bar">
                    <span className="bar--petrol" style={{ "--w": 1 }} />
                  </div>
                </div>
                <div className="compare-row">
                  <div className="compare-row__head">
                    <span>With your electric rides</span>
                    <strong className="num">{formatCO2(stats.rideG)}</strong>
                  </div>
                  <div className="compare-row__bar">
                    <span className="bar--ev" style={{ "--w": (stats.rideG / stats.baselineG).toFixed(3) }} />
                  </div>
                </div>
              </div>
            ) : (
              <p className="muted">Book a ride to compare.</p>
            )}
          </Reveal>
        </div>
      </div>
    </div>
  );
}
