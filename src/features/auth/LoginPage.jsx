// Log in form (react-hook-form). After a successful login the user goes back to where they came from.

import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useAuth } from "../../context/AuthContext";

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from;
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { email: "", password: "" } });

  if (isAuthenticated) return <Navigate to={from?.pathname || "/dashboard"} replace />;

  async function onSubmit(data) {
    try {
      await login(data);
      navigate(from ? `${from.pathname}${from.search || ""}` : "/dashboard", { replace: true });
    } catch (error) {
      setError("root", { message: error.message || "Could not log in. Try again." });
    }
  }

  return (
    <div className="container auth">
      <form className="card auth__card" onSubmit={handleSubmit(onSubmit)} noValidate aria-labelledby="login-title">
        <div>
          <h1 id="login-title">Log In</h1>
          <p className="muted" style={{ marginTop: 8 }}>
            {from ? "Log in to continue your booking." : "Welcome back. Log in to book rides and see your savings."}
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
            autoComplete="email"
            spellCheck="false"
            placeholder="name@example.com…"
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
          <Link to="/forgot-password">Forgot password?</Link>
        </div>

        <button className="btn btn--primary btn--lg btn--block" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Logging in…" : "Log In"}
        </button>

        <p className="muted" style={{ textAlign: "center" }}>
          New to Ridezilla? <Link to="/register" state={{ from }}>Create an account</Link>
        </p>
      </form>
    </div>
  );
}
