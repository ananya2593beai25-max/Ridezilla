// Sign up form (react-hook-form) with field rules, a confirm-password check and a terms box.

import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

export default function RegisterPage() {
  const { register: signUp, isAuthenticated } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from;
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { name: "", email: "", phone: "", password: "", confirm: "", terms: false } });

  if (isAuthenticated) return <Navigate to={from?.pathname || "/dashboard"} replace />;

  async function onSubmit({ name, email, phone, password }) {
    try {
      const user = await signUp({ name, email, phone, password });
      toast(`Welcome, ${user.name.split(" ")[0]}. Your account is ready.`);
      navigate(from ? `${from.pathname}${from.search || ""}` : "/dashboard", { replace: true });
    } catch (error) {
      setError(error.field || "root", { message: error.message || "Could not create your account." });
    }
  }

  const fieldProps = (name) => ({
    "aria-invalid": errors[name] ? "true" : "false",
    "aria-describedby": `${name}-error`,
  });
  const err = (name) => (
    <p id={`${name}-error`} className="field-error" aria-live="polite">
      {errors[name]?.message}
    </p>
  );

  return (
    <div className="container auth">
      <form className="card auth__card" onSubmit={handleSubmit(onSubmit)} noValidate aria-labelledby="register-title">
        <div>
          <h1 id="register-title">Create Your Account</h1>
          <p className="muted" style={{ marginTop: 8 }}>
            One account lets you book rides and keep a record of the CO₂ you save.
          </p>
        </div>

        {errors.root && (
          <div className="notice notice--error" role="alert">
            {errors.root.message}
          </div>
        )}

        <div className="field">
          <label htmlFor="name">Full name</label>
          <input
            id="name"
            className="input"
            autoComplete="name"
            placeholder="Aryan Gupta…"
            {...fieldProps("name")}
            {...register("name", {
              required: "Enter your full name.",
              minLength: { value: 2, message: "Name needs at least 2 letters." },
              pattern: { value: /^[\p{L} .'-]+$/u, message: "Use letters only." },
            })}
          />
          {err("name")}
        </div>

        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            className="input"
            type="email"
            autoComplete="email"
            spellCheck="false"
            placeholder="name@example.com…"
            {...fieldProps("email")}
            {...register("email", {
              required: "Enter your email.",
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, message: "Enter an email like name@example.com." },
            })}
          />
          {err("email")}
        </div>

        <div className="field">
          <label htmlFor="phone">Mobile number</label>
          <input
            id="phone"
            className="input"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            maxLength={10}
            placeholder="9876543210…"
            {...fieldProps("phone")}
            {...register("phone", {
              required: "Enter your mobile number.",
              pattern: { value: /^[6-9]\d{9}$/, message: "Enter 10 digits starting with 6, 7, 8 or 9." },
            })}
          />
          {err("phone")}
        </div>

        <div className="form-grid">
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              className="input"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              {...fieldProps("password")}
              {...register("password", {
                required: "Choose a password.",
                minLength: { value: 8, message: "Use at least 8 characters." },
                validate: (v) => (/[A-Za-z]/.test(v) && /\d/.test(v)) || "Include at least one letter and one number.",
              })}
            />
            {err("password")}
          </div>
          <div className="field">
            <label htmlFor="confirm">Confirm password</label>
            <input
              id="confirm"
              className="input"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              {...fieldProps("confirm")}
              {...register("confirm", {
                required: "Type the password again.",
                validate: (v) => v === getValues("password") || "The passwords do not match.",
              })}
            />
            {err("confirm")}
          </div>
        </div>

        <label className="check">
          <input type="checkbox" checked={showPassword} onChange={(e) => setShowPassword(e.target.checked)} />
          Show passwords
        </label>

        <div className="field">
          <label className="check">
            <input type="checkbox" {...fieldProps("terms")} {...register("terms", { required: "Please accept to continue." })} />
            I agree to the terms of use and the privacy policy.
          </label>
          {err("terms")}
        </div>

        <button className="btn btn--primary btn--lg btn--block" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating account…" : "Create Account"}
        </button>

        <p className="muted" style={{ textAlign: "center" }}>
          Already registered? <Link to="/login" state={{ from }}>Log in</Link>
        </p>
      </form>
    </div>
  );
}
