// First login with a temporary password: the driver must choose their own before anything else.
// The admin never learns the new password. It is hashed here and only the hash is stored.

import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { useStaffAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { BrandMark } from "../../components/Icon";
import { driverUpdated, selectDriverByUserId } from "../drivers/driversSlice";

export default function SetPasswordPage({ role = "driver" }) {
  const { user, changePassword, logout } = useStaffAuth(role);
  const driver = useSelector((s) => (role === "driver" ? selectDriverByUserId(s, user.id) : null));
  const dispatch = useDispatch();
  const toast = useToast();
  const navigate = useNavigate();
  const [show, setShow] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { password: "", confirm: "" } });

  // Nothing to do if they already chose a password.
  const home = role === "client" ? "/dashboard" : `/${role}`;
  if (!user.mustChangePassword) return <Navigate to={home} replace />;

  async function onSubmit({ password }) {
    try {
      await changePassword(password);
      if (driver) dispatch(driverUpdated({ id: driver.id, changes: { passwordPending: false } }));
      toast("Password saved. You are all set.");
      navigate(home, { replace: true });
    } catch (error) {
      setError("root", { message: error.message || "Could not save the password." });
    }
  }

  const fp = (name) => ({ "aria-invalid": errors[name] ? "true" : "false", "aria-describedby": `${name}-error` });
  const err = (name) => (
    <p id={`${name}-error`} className="field-error" aria-live="polite">
      {errors[name]?.message}
    </p>
  );

  return (
    <div className="staff-login">
      <form className="card auth__card" onSubmit={handleSubmit(onSubmit)} noValidate aria-labelledby="setpw-title">
        <div className="staff-login__brand">
          <BrandMark size={34} />
          <span className="chip chip--warn">First login</span>
        </div>
        <div>
          <h1 id="setpw-title">Choose Your Password</h1>
          <p className="muted" style={{ marginTop: 8 }}>
            Hello {user.name.split(" ")[0]}. You logged in with a temporary password. Choose your own now. Only you will know it, not even the admin.
          </p>
        </div>

        {errors.root && (
          <div className="notice notice--error" role="alert">
            {errors.root.message}
          </div>
        )}

        <div className="field">
          <label htmlFor="password">New password</label>
          <input
            id="password"
            className="input"
            type={show ? "text" : "password"}
            autoComplete="new-password"
            {...fp("password")}
            {...register("password", {
              required: "Choose a password.",
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
            type={show ? "text" : "password"}
            autoComplete="new-password"
            {...fp("confirm")}
            {...register("confirm", {
              required: "Type the password again.",
              validate: (v) => v === getValues("password") || "The passwords do not match.",
            })}
          />
          {err("confirm")}
        </div>

        <label className="check">
          <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} />
          Show passwords
        </label>

        <button className="btn btn--primary btn--lg btn--block" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Save Password"}
        </button>
        <button className="btn btn--ghost btn--block" type="button" onClick={logout}>
          Log Out
        </button>
      </form>
    </div>
  );
}
