// Change your own password while logged in: the current password, then the new one twice.
// Used on the rider's Account page and the driver's Profile page.

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useStaffAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { verifyPassword } from "./authService";

export default function ChangePasswordForm({ role }) {
  const { user, changePassword } = useStaffAuth(role);
  const toast = useToast();
  const [show, setShow] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { current: "", password: "", confirm: "" } });

  async function onSubmit({ current, password }) {
    if (!(await verifyPassword(user.id, current))) {
      setError("current", { message: "That is not your current password." });
      return;
    }
    try {
      await changePassword(password);
      reset();
      toast("Password changed.");
    } catch (error) {
      setError("root", { message: error.message || "Could not change the password." });
    }
  }

  const type = show ? "text" : "password";
  const fp = (name) => ({ "aria-invalid": errors[name] ? "true" : "false", "aria-describedby": `${name}-error` });
  const err = (name) => (
    <p id={`${name}-error`} className="field-error" aria-live="polite">
      {errors[name]?.message}
    </p>
  );

  return (
    <form className="card" onSubmit={handleSubmit(onSubmit)} noValidate aria-labelledby="change-pw-title">
      <div className="card__head">
        <h2 id="change-pw-title">Change Password</h2>
      </div>

      {errors.root && (
        <div className="notice notice--error" role="alert" style={{ marginBottom: 14 }}>
          {errors.root.message}
        </div>
      )}

      <div className="form-grid">
        <div className="field full">
          <label htmlFor="current">Current password</label>
          <input id="current" className="input" type={type} autoComplete="current-password" {...fp("current")} {...register("current", { required: "Enter your current password." })} />
          {err("current")}
        </div>
        <div className="field">
          <label htmlFor="password">New password</label>
          <input
            id="password"
            className="input"
            type={type}
            autoComplete="new-password"
            {...fp("password")}
            {...register("password", {
              required: "Choose a new password.",
              minLength: { value: 8, message: "Use at least 8 characters." },
              validate: (v) => (/[A-Za-z]/.test(v) && /\d/.test(v)) || "Include at least one letter and one number.",
            })}
          />
          {err("password")}
        </div>
        <div className="field">
          <label htmlFor="confirm">Confirm new password</label>
          <input
            id="confirm"
            className="input"
            type={type}
            autoComplete="new-password"
            {...fp("confirm")}
            {...register("confirm", { required: "Type the password again.", validate: (v) => v === getValues("password") || "The passwords do not match." })}
          />
          {err("confirm")}
        </div>
      </div>

      <label className="check" style={{ marginTop: 4 }}>
        <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} />
        Show passwords
      </label>

      <button className="btn btn--primary btn--lg btn--block" type="submit" disabled={isSubmitting} style={{ marginTop: 12 }}>
        {isSubmitting ? "Saving…" : "Change Password"}
      </button>
    </form>
  );
}
