import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Icon from "../components/Icon";

const FAQ = [
  {
    q: "How is the CO₂ saving calculated?",
    open: true,
    a: (
      <>
        <p>
          For each ride we multiply the road distance by the vehicle's emissions per kilometre, then subtract that from what a petrol vehicle would
          emit on the same route.
        </p>
        <code className="formula">saved = distanceKm × (petrolGramsPerKm − vehicleGramsPerKm)</code>
      </>
    ),
  },
  {
    q: "How is the fare calculated?",
    a: (
      <>
        <p>The fare is charged per kilometre of road distance. Each vehicle has its own rate and a minimum fare for very short trips.</p>
        <code className="formula">fare = max(minFare, ratePerKm × distanceKm)</code>
      </>
    ),
  },
  {
    q: "Where do the emission numbers come from?",
    a: (
      <p>
        Electric vehicles use grid-adjusted figures, which means we count the emissions from generating the electricity. The petrol comparison is an
        average car or SUV. Real emissions vary with traffic, load and driving style, so treat the savings as estimates.
      </p>
    ),
  },
  {
    q: "Where does Ridezilla run?",
    a: <p>Punjab, Chandigarh and Panchkula. That covers the tricity of Chandigarh, Mohali and Panchkula. Place search and the map accept locations in these areas only.</p>,
  },
  {
    q: "What happens after I request a ride?",
    a: (
      <p>
        We assign a vehicle and a driver. As soon as that happens you can see the car model, the number plate and the driver's name and phone on
        your ride. You can cancel until the driver starts the trip.
      </p>
    ),
  },
  {
    q: "How is the distance measured?",
    a: (
      <p>
        We use road distance from OpenStreetMap data. If the routing service is unavailable, we fall back to straight-line distance times 1.3 and
        mark the ride as estimated.
      </p>
    ),
  },
  {
    q: "How do I pay?",
    a: <p>You pay the driver in cash or by UPI at the end of the ride. Choose which one when you confirm the booking.</p>,
  },
  {
    q: "How is my account kept safe?",
    a: (
      <p>
        Your password is encrypted before it is saved, and your rides and messages are tied to your account. Log out when you use a shared device.
      </p>
    ),
  },
];

export default function FaqPage() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="container">
      <div className="page-head">
        <div>
          <h1>FAQ</h1>
          <p>Answers to common questions, and a way to reach our team.</p>
        </div>
      </div>

      <div className="contact-grid">
        <section aria-labelledby="faq-title">
          <h2 id="faq-title" className="sr-only">
            Frequently asked questions
          </h2>
          <div className="faq">
            {FAQ.map((item) => (
              <details key={item.q} open={item.open}>
                <summary>{item.q}</summary>
                <div>{item.a}</div>
              </details>
            ))}
          </div>
        </section>

        <aside className="card talk" aria-labelledby="talk-title">
          <span className="talk__icon">
            <Icon name="chat" size={26} />
          </span>
          <h2 id="talk-title">Talk to our team</h2>
          <p className="muted">
            Had a problem with a ride, a driver or a fare? Start a chat and we will reply in the Support section of your account. You will see an
            alert in the menu when we answer.
          </p>
          {isAuthenticated ? (
            <div className="talk__actions">
              <div className="cta-actions">
                <Link className="btn btn--primary btn--lg" to="/support/new">
                  Start a Chat
                </Link>
                <Link className="btn btn--ghost btn--lg" to="/support">
                  My Chats
                </Link>
              </div>
              <p className="muted" style={{ fontSize: "0.85rem" }}>
                Signed in as {user.name}.
              </p>
            </div>
          ) : (
            <div className="talk__actions">
              <div className="cta-actions">
                <Link className="btn btn--primary btn--lg" to="/login" state={{ from: { pathname: "/support/new" } }}>
                  Log In to Chat
                </Link>
                <Link className="btn btn--ghost btn--lg" to="/register" state={{ from: { pathname: "/support/new" } }}>
                  Create Account
                </Link>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
