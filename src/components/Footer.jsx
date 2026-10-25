import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { BrandMark } from "./Icon";

export default function Footer() {
  const { isAuthenticated } = useAuth();

  return (
    <footer className="site-footer">
      <div className="container footer__top">
        <div className="footer__brand">
          <Link className="brand" to="/" aria-label="Ridezilla home">
            <BrandMark size={28} />
            Ridezilla
          </Link>
          <p>Electric rides in Punjab and Chandigarh, with the CO₂ you save shown on every trip.</p>
        </div>

        <nav className="footer__col" aria-label="Rides">
          <h2 className="footer__title">Rides</h2>
          <ul>
            <li>
              <Link to="/#search">Book a Ride</Link>
            </li>
            {isAuthenticated ? (
              <>
                <li>
                  <Link to="/bookings">My Bookings</Link>
                </li>
                <li>
                  <Link to="/dashboard">Dashboard</Link>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link to="/login">Log In</Link>
                </li>
                <li>
                  <Link to="/register">Create Account</Link>
                </li>
              </>
            )}
          </ul>
        </nav>

        <nav className="footer__col" aria-label="Help">
          <h2 className="footer__title">Help</h2>
          <ul>
            <li>
              <Link to="/faq">FAQ</Link>
            </li>
            <li>
              <Link to="/support">Support</Link>
            </li>
          </ul>
        </nav>

        <div className="footer__col">
          <h2 className="footer__title">Coverage</h2>
          <ul>
            <li>Chandigarh, Mohali, Panchkula</li>
            <li>Punjab</li>
            <li>E-bikes and e-rickshaws</li>
            <li>Electric cars</li>
          </ul>
        </div>
      </div>

      <div className="container footer__bottom">
        <span>&copy; {new Date().getFullYear()} Ridezilla. All rights reserved.</span>
        <span>CO₂ savings are estimates based on average vehicle emissions.</span>
      </div>
    </footer>
  );
}
