import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="container">
      <div className="card empty" style={{ marginTop: 64 }}>
        <span className="chip">Error 404</span>
        <h1 style={{ fontSize: "1.8rem" }}>This page does not exist</h1>
        <p>The link may be old or mistyped. Head back home and plan a ride.</p>
        <Link className="btn btn--primary" to="/">
          Go Home
        </Link>
      </div>
    </div>
  );
}
