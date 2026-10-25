// The client's side of the start and end codes. The client generates a 4 digit code and reads it to the driver,
// who types it into their app. That proves the driver is at the pickup, and later that the ride is over,
// and the time between the two codes is logged as the journey time.

import { useDispatch } from "react-redux";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { generateOtp } from "./rideLifecycle";

export default function RideOtp({ booking }) {
  const dispatch = useDispatch();
  const toast = useToast();
  const { user } = useAuth();

  // Which code is needed now: none before a driver is assigned or after the ride has finished.
  const kind = booking.status === "assigned" ? "start" : booking.status === "in_progress" ? "end" : null;
  if (!kind) return null;

  const code = booking.otp?.[kind]?.code;
  const text =
    kind === "start"
      ? { title: "Start code", help: "When your driver reaches the pickup, generate a code and tell it to them. The ride starts once they enter it.", button: "Generate Start Code" }
      : { title: "End code", help: "When you reach the drop-off, generate a code and tell it to your driver. The ride ends once they enter it.", button: "Generate End Code" };

  async function generate() {
    const result = await dispatch(generateOtp({ bookingId: booking.id, userId: user.id, kind }));
    if (result.error) toast(result.payload?.message || "Could not make a code.");
  }

  return (
    <div className="otp-box" aria-live="polite">
      <div>
        <strong>{text.title}</strong>
        <p className="muted otp-box__help">{text.help}</p>
      </div>
      {code ? (
        <div className="otp-code" aria-label={`${text.title}: ${code.split("").join(" ")}`}>
          {code.split("").map((digit, i) => (
            <span key={i} className="otp-code__digit num">
              {digit}
            </span>
          ))}
        </div>
      ) : (
        <button className="btn btn--primary" type="button" onClick={generate}>
          {text.button}
        </button>
      )}
    </div>
  );
}
