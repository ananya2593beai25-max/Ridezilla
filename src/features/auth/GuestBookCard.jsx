// Shown on the home page in place of the booking form to visitors who are not logged in.
// Booking needs an account, so they are asked to log in or sign up first and then come back to the form.

import { Link } from "react-router-dom";
import Icon from "../../components/Icon";

const PERKS = [
  "See the fare per kilometre before you confirm",
  "Know the CO₂ you save on every ride",
  "Track your driver and vehicle once assigned",
];

export default function GuestBookCard() {
  const back = { from: { pathname: "/" } }; // after logging in, return to the booking form

  return (
    <section id="search" className="card search-card guest-card" aria-labelledby="guest-title">
      <div>
        <h2 id="guest-title">Book Your Ride</h2>
        <p className="muted" style={{ marginTop: 6, fontSize: "0.9rem" }}>
          Log in or create a free account to plan a ride in Punjab, Chandigarh or Panchkula.
        </p>
      </div>

      <ul className="guest-card__perks">
        {PERKS.map((perk) => (
          <li key={perk}>
            <span className="guest-card__tick">
              <Icon name="check" size={16} />
            </span>
            {perk}
          </li>
        ))}
      </ul>

      <div className="cta-actions">
        <Link className="btn btn--primary btn--lg" to="/login" state={back}>
          Log In
        </Link>
        <Link className="btn btn--ghost btn--lg" to="/register" state={back}>
          Create Account
        </Link>
      </div>
    </section>
  );
}
