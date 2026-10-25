// Forgot password, for riders (/forgot-password) and drivers (/driver/forgot-password).
// There is no email service, so the request goes to the admin, who makes a temporary password and sends it by phone or WhatsApp.

import { useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useForm } from "react-hook-form";
import ThemeToggle from "../../components/ThemeToggle";
import { BrandMark } from "../../components/Icon";
import { submitResetRequest } from "./passwordRequestsSlice";

export default function ForgotPasswordPage({ role = "client" }) {
  const dispatch = useDispatch();
  const [sent, setSent] = useState(false);
  const loginPath = role === "driver" ? "/driver/login" : "/login";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { email: "" } });

  async function onSubmit({ email }) {
    await dispatch(submitResetRequest({ email, role }));
    setSent(true);
  }

  const card = (
    <form className="card auth__card" onSubmit={handleSubmit(onSubmit)} noValidate aria-labelledby="forgot-title">
      {role === "driver" && (
        <div className="staff-login__brand">
          <BrandMark size={34} />
          <span className="chip">Driver area</span>
        </div>
      )}
      <div>
        <h1 id="forgot-title">Forgot Password</h1>
        <p className="muted" style={{ marginTop: 8 }}>
          Enter the email of your account. We tell the admin, who sends you a temporary password. Log in with it and you will be asked to choose your own.
        </p>
      </div>

      {sent ? (
        <>
          <div className="notice notice--ok" role="status">
            If this email has an account, the admin has been told. Wait for the temporary password, then log in with it.
          </div>
          <Link className="btn btn--primary btn--lg btn--block" to={loginPath}>
            Back to Log In
          </Link>
        </>
      ) : (
        <>
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

          <button className="btn btn--primary btn--lg btn--block" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Sending…" : "Send Request to Admin"}
          </button>
          <p className="muted" style={{ textAlign: "center" }}>
            <Link to={loginPath}>Back to Log In</Link>
          </p>
        </>
      )}
    </form>
  );

  if (role === "driver") {
    return (
      <div className="staff-login">
        <ThemeToggle className="staff-login__theme" />
        {card}
      </div>
    );
  }
  return <div className="container auth">{card}</div>;
}
