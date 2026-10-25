// The rider's account: details, and a form to change the password.

import { useAuth } from "../../context/AuthContext";
import ChangePasswordForm from "./ChangePasswordForm";

const Row = ({ label, children }) => (
  <div>
    <dt>{label}</dt>
    <dd>{children}</dd>
  </div>
);

export default function AccountPage() {
  const { user } = useAuth();
  return (
    <div className="container account">
      <div className="page-head">
        <div>
          <h1>Account</h1>
          <p>Your details and password.</p>
        </div>
      </div>

      <div className="account__grid">
        <section className="card" aria-labelledby="account-details">
          <div className="card__head">
            <h2 id="account-details">Your Details</h2>
          </div>
          <dl className="summary-list">
            <Row label="Name">{user.name}</Row>
            <Row label="Email">{user.email}</Row>
            <Row label="Mobile">{user.phone || "Not given"}</Row>
          </dl>
        </section>

        <ChangePasswordForm role="client" />
      </div>
    </div>
  );
}
