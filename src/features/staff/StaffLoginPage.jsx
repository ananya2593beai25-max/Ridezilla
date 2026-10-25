// One login screen for both staff panels. The `role` prop decides which accounts it accepts.
// It lives on its own URL (/admin/login or /driver/login) and is not linked from the client site.

import ThemeToggle from "../../components/ThemeToggle";
import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useStaffAuth } from "../../context/AuthContext";
import { BrandMark } from "../../components/Icon";

const COPY = {
  admin: { title: "Admin Login", blurb: "Manage drivers, vehicles, booking requests and complaints.", home: "/admin" },
  driver: { title: "Driver Login", blurb: "See your vehicle and the rides assigned to you.", home: "/driver" },
};

export default function StaffLoginPage({ role }) {
  const copy = COPY[role];
  const { login, isAuthenticated } = useStaffAuth(role);
  const navigate = useNavigate();
  const from = useLocation().state?.from;
  const [showPassword, setShowPassword] = useState(false);
  const [adminHelp, setAdminHelp] = useState(false); // admins have no reset request: they call the IT team

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { email: "", password: "" } });

  if (isAuthenticated) return <Navigate to={from?.pathname || copy.home} replace />;

  async function onSubmit(data) {
    try {
      await login(data);
      navigate(from ? `${from.pathname}${from.search || ""}` : copy.home, { replace: true });
    } catch (error) {
      setError("root", { message: error.message || "Could not log in. Try again." });
    }
  }

  return (
    <div className="staff-login">
      <ThemeToggle className="staff-login__theme" />
      <form className="card auth__card" onSubmit={handleSubmit(onSubmit)} noValidate aria-labelledby="staff-title">
        <div className="staff-login__brand">
          <BrandMark size={34} />
          <span className="chip">{role === "admin" ? "Staff area" : "Driver area"}</span>
        </div>
        <div>
          <h1 id="staff-title">{copy.title}</h1>
          <p className="muted" style={{ marginTop: 8 }}>
            {copy.blurb}
          </p>
        </div>

        {errors.root && (
          <div className="notice notice--error" role="alert">
            {errors.root.message}
          </div>
        )}

        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            className="input"
            type="email"
            autoComplete="username"
            spellCheck="false"
            aria-invalid={errors.email ? "true" : "false"}
            aria-describedby="email-error"
            {...register("email", {
              required: "Enter your email.",
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, message: "Enter an email like name@example.com." },
            })}
          />
          <p id="email-error" className="field-error" aria-live="polite">
            {errors.email?.message}
          </p>
        </div>

        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            className="input"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            aria-invalid={errors.password ? "true" : "false"}
            aria-describedby="password-error"
            {...register("password", { required: "Enter your password." })}
          />
          <p id="password-error" className="field-error" aria-live="polite">
            {errors.password?.message}
          </p>
        </div>

        <div className="auth__row">
          <label className="check">
            <input type="checkbox" checked={showPassword} onChange={(e) => setShowPassword(e.target.checked)} />
            Show password
          </label>
          {role === "driver" ? (
            <Link to="/driver/forgot-password">Forgot password?</Link>
          ) : (
            <button type="button" className="link-btn" aria-expanded={adminHelp} onClick={() => setAdminHelp((v) => !v)}>
              Forgot password?
            </button>
          )}
        </div>
        {role === "admin" && adminHelp && (
          <div className="notice notice--warn" role="status">
            Admin passwords cannot be reset from this page. Please contact the IT team to reset it.
          </div>
        )}

        <button className="btn btn--primary btn--lg btn--block" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Logging in…" : "Log In"}
        </button>
      </form>
    </div>
  );
}
