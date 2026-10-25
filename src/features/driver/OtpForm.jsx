// The driver types the 4 digit code the client read out. Used to start the ride at the pickup and to end it at the drop-off.

import { useForm } from "react-hook-form";

export default function OtpForm({ kind, onVerify }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { otp: "" } });

  const text =
    kind === "start"
      ? { label: "Start code from the client", help: "At the pickup, ask the client to generate the start code in their app.", button: "Verify and Start Ride" }
      : { label: "End code from the client", help: "At the drop-off, ask the client to generate the end code in their app.", button: "Verify and End Ride" };

  return (
    <form
      className="otp-form"
      onSubmit={handleSubmit(async ({ otp }) => {
        await onVerify(otp.trim());
        reset();
      })}
      noValidate
    >
      <div className="field">
        <label htmlFor={`otp-${kind}`}>{text.label}</label>
        <input
          id={`otp-${kind}`}
          className="input otp-form__input num"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={4}
          placeholder="0000"
          aria-invalid={errors.otp ? "true" : "false"}
          {...register("otp", { required: "Enter the 4 digit code.", pattern: { value: /^\d{4}$/, message: "The code has 4 digits." } })}
        />
        <p className="muted" style={{ fontSize: "0.8rem" }}>
          {text.help}
        </p>
        <p className="field-error" aria-live="polite">
          {errors.otp?.message}
        </p>
      </div>
      <button className="btn btn--primary btn--lg btn--block" type="submit" disabled={isSubmitting}>
        {text.button}
      </button>
    </form>
  );
}
