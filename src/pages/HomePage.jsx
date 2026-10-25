import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import CountUp from "../components/CountUp";
import Icon, { VehicleIcon } from "../components/Icon";
import Reveal from "../components/Reveal";
import { useAuth } from "../context/AuthContext";
import GuestBookCard from "../features/auth/GuestBookCard";
import SearchForm from "../features/ride/SearchForm";
import ActiveRideCard from "../features/bookings/ActiveRideCard";
import { useActiveRide } from "../features/bookings/useActiveRide";
import { fetchVehicles, selectVehicles } from "../features/vehicles/vehiclesSlice";
import { calcCO2, calcFare } from "../lib/calc";
import { MAX_PASSENGERS } from "../lib/config";
import { formatCO2, formatRupees } from "../lib/format";

const SAMPLE_KM = 10;

function SampleRide({ vehicles }) {
  const pick = vehicles.find((v) => v.id === "erickshaw") || vehicles[0];
  if (!pick) return <div className="skeleton" style={{ height: 300, borderRadius: 16 }} />;

  const co2 = calcCO2(pick, SAMPLE_KM);
  const fare = calcFare(pick, SAMPLE_KM);

  return (
    <Reveal as="article" className="card sample-ride" index={1} style={{ gridColumn: "span 2" }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div>
          <span className="chip chip--green">Sample ride</span>
          <h3 style={{ marginTop: 10 }}>
            {pick.name}, {SAMPLE_KM} km
          </h3>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="muted" style={{ fontSize: "0.8rem" }}>
            {formatRupees(pick.ratePerKm)} per km
          </div>
          <strong className="num" style={{ fontSize: "1.6rem" }}>
            {formatRupees(fare.total)}
          </strong>
        </div>
      </div>
      <div className="compare">
        <div className="compare__bar">
          <span style={{ "--w": (co2.rideG / co2.baselineG).toFixed(3) }} />
        </div>
        <div className="compare__text">
          Petrol car: <strong className="num">{formatCO2(co2.baselineG)}</strong> of CO₂. This ride: <strong className="num">{formatCO2(co2.rideG)}</strong>.
        </div>
      </div>
      <div>
        <div className="muted" style={{ fontSize: "0.85rem" }}>
          CO₂ saved on this ride
        </div>
        <strong className="num" style={{ color: "var(--accent)", fontSize: "2.6rem", lineHeight: 1.1 }}>
          <CountUp value={co2.savedG / 1000} decimals={2} suffix={" kg"} />
        </strong>
      </div>
    </Reveal>
  );
}

export default function HomePage() {
  const dispatch = useDispatch();
  const vehicles = useSelector(selectVehicles);
  const activeRide = useActiveRide();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    dispatch(fetchVehicles());
  }, [dispatch]);

  return (
    <>
      <section className="hero">
        <div className="hero__orb" aria-hidden="true" />
        <div className="container hero__grid">
          <div className="hero__copy">
            <span className="eyebrow">Electric rides in Punjab &amp; Chandigarh</span>
            <h1>
              Ride electric. See the <em>CO₂ you save</em>.
            </h1>
            <p>
              Book an e-bike, e-rickshaw or electric car from Chandigarh, Mohali, Panchkula and across Punjab. Every ride shows how much carbon you
              kept out of the air compared with the same trip in a petrol car.
            </p>
            <ul className="stats" aria-label="Ridezilla at a glance">
              <li className="stat">
                <strong className="stat__value num">
                  <CountUp value={vehicles.length || 4} />
                </strong>
                <span className="stat__label">Electric vehicle types</span>
              </li>
              <li className="stat">
                <strong className="stat__value num">
                  <CountUp value={MAX_PASSENGERS} />
                </strong>
                <span className="stat__label">Passengers per booking, up to</span>
              </li>
              <li className="stat">
                <strong className="stat__value num">
                  <CountUp value={0} />
                </strong>
                <span className="stat__label">Petrol vehicles</span>
              </li>
            </ul>
          </div>

          {/* Visitors who are not logged in get a log in / sign up card. Logged-in clients get the booking form,
              or, while one ride is still open, that ride instead of the form. */}
          {!isAuthenticated ? <GuestBookCard /> : activeRide ? <ActiveRideCard booking={activeRide} /> : <SearchForm />}
        </div>
      </section>

      <section className="section" aria-labelledby="impact-title">
        <div className="container grid-3" style={{ alignItems: "stretch" }}>
          <Reveal className="section__head" style={{ margin: 0 }}>
            <span className="eyebrow">What a ride saves</span>
            <h2 id="impact-title">One 10 km ride, compared with a petrol car</h2>
            <p>These numbers use the same formula as the booking page, so you can check them against any trip.</p>
          </Reveal>
          <SampleRide vehicles={vehicles} />
        </div>
      </section>

      <section className="section" aria-labelledby="how-title" style={{ paddingTop: 0 }}>
        <div className="container">
          <Reveal className="section__head">
            <h2 id="how-title">How It Works</h2>
          </Reveal>
          <div className="grid-3">
            {[
              ["Choose your route", "Type a pickup and drop-off in Punjab, Chandigarh or Panchkula, or click the map. Then set how many people are riding."],
              ["Pick a vehicle that fits", "We show only the electric vehicles with enough seats, with the per-km fare and CO₂ saved on each card."],
              ["Book and track your impact", "Log in, confirm the ride and your dashboard adds the CO₂ saved to your running total."],
            ].map(([title, text], i) => (
              <Reveal as="article" className="card step" index={i} key={title}>
                <div className="step__no">{i + 1}</div>
                <h3>{title}</h3>
                <p>{text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="types-title" style={{ paddingTop: 0 }}>
        <div className="container">
          <Reveal className="section__head">
            <h2 id="types-title">Our Electric Fleet</h2>
            <p>Every vehicle is electric. The petrol car appears only as the baseline we compare against.</p>
          </Reveal>
          <div className="grid-4" aria-live="polite">
            {vehicles.length === 0
              ? [0, 1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 240 }} />)
              : vehicles.map((v, i) => (
                  <Reveal as="article" className="card card--hover type-card" index={i} key={v.id}>
                    <div className="type-card__icon">
                      <VehicleIcon type={v.type} size={40} />
                    </div>
                    <h3>{v.name}</h3>
                    <p>
                      Seats up to {v.seats} {v.seats === 1 ? "rider" : "riders"}. {formatRupees(v.ratePerKm)} per km, minimum {formatRupees(v.minFare)}.
                    </p>
                    <span className="chip chip--green">
                      <Icon name="leaf" size={14} />
                      Saves {formatCO2(calcCO2(v, SAMPLE_KM).savedG)} per {SAMPLE_KM}&nbsp;km
                    </span>
                  </Reveal>
                ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <Reveal className="cta-band">
            {isAuthenticated ? (
              <>
                <h2>{activeRide ? "Your ride is on its way" : "Ready for your next ride?"}</h2>
                <p className="muted" style={{ maxWidth: 520 }}>
                  {activeRide ? "See the vehicle, the driver and the route for your current ride." : "Plan a trip and see the fare and the CO₂ you save before you book."}
                </p>
                <div className="cta-actions">
                  {activeRide ? (
                    <Link className="btn btn--primary btn--lg" to={`/bookings/${activeRide.id}`}>
                      View My Ride
                    </Link>
                  ) : (
                    <Link className="btn btn--primary btn--lg" to="/#search">
                      Plan a Ride
                    </Link>
                  )}
                  <Link className="btn btn--ghost btn--lg" to="/bookings">
                    My Bookings
                  </Link>
                </div>
              </>
            ) : (
              <>
                <h2>Your next ride can be a cleaner one</h2>
                <p className="muted" style={{ maxWidth: 520 }}>
                  Create an account, plan a trip and see the savings before you book.
                </p>
                <div className="cta-actions">
                  <Link className="btn btn--primary btn--lg" to="/register" state={{ from: { pathname: "/" } }}>
                    Create Account
                  </Link>
                  <Link className="btn btn--ghost btn--lg" to="/login" state={{ from: { pathname: "/" } }}>
                    Log In
                  </Link>
                </div>
              </>
            )}
          </Reveal>
        </div>
      </section>
    </>
  );
}
