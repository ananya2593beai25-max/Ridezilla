// New complaint form (react-hook-form). Can be opened from a booking, which pre-selects that ride.

import { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import Select from "../../components/Select";
import { makeSelectUserBookings } from "../bookings/bookingsSlice";
import { formatDate } from "../../lib/format";
import { ticketOpened } from "./supportSlice";

const CATEGORIES = ["Driver or vehicle", "Fare or payment", "Safety", "Booking problem", "App problem", "Other"];

export default function NewTicketPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const [params] = useSearchParams();

  const selectMine = useMemo(makeSelectUserBookings, []);
  const bookings = useSelector((s) => selectMine(s, user.id));

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      bookingId: bookings.some((b) => b.id === params.get("booking")) ? params.get("booking") : "",
      category: CATEGORIES[0],
      subject: "",
      text: "",
    },
  });

  function onSubmit(form) {
    const action = dispatch(ticketOpened({ user, subject: form.subject, category: form.category, bookingId: form.bookingId, text: form.text }));
    toast("Complaint sent. We will reply here.");
    navigate(`/support/${action.payload.ticket.id}`, { replace: true });
  }

  const fp = (name) => ({ "aria-invalid": errors[name] ? "true" : "false", "aria-describedby": `${name}-error` });
  const err = (name) => (
    <p id={`${name}-error`} className="field-error" aria-live="polite">
      {errors[name]?.message}
    </p>
  );

  return (
    <div className="container auth">
      <form className="card auth__card" style={{ width: "min(100%, 620px)" }} onSubmit={handleSubmit(onSubmit)} noValidate aria-labelledby="new-ticket-title">
        <div>
          <h1 id="new-ticket-title">New Complaint</h1>
          <p className="muted" style={{ marginTop: 8 }}>
            Tell us what went wrong. A team member will reply in the chat.
          </p>
        </div>

        <div className="form-grid">
          <div className="field">
            <label htmlFor="category">What is it about?</label>
            <Select id="category" className="input" {...register("category")}>
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </div>
          <div className="field">
            <label htmlFor="bookingId">Which ride? (optional)</label>
            <Select id="bookingId" className="input" {...register("bookingId")}>
              <option value="">Not about a ride</option>
              {bookings.map((b) => (
                <option key={b.id} value={b.id}>
                  {formatDate(b.date)}: {b.pickup.name} to {b.dropoff.name}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="field">
          <label htmlFor="subject">Subject</label>
          <input
            id="subject"
            className="input"
            placeholder="Driver arrived late…"
            maxLength={80}
            {...fp("subject")}
            {...register("subject", { required: "Add a short subject.", minLength: { value: 4, message: "Use at least 4 characters." } })}
          />
          {err("subject")}
        </div>

        <div className="field">
          <label htmlFor="text">Message</label>
          <textarea
            id="text"
            className="input"
            maxLength={1000}
            placeholder="Describe what happened…"
            {...fp("text")}
            {...register("text", { required: "Describe the problem.", minLength: { value: 10, message: "Write at least 10 characters so we can help." } })}
          />
          {err("text")}
        </div>

        <div className="cta-actions">
          <button className="btn btn--primary btn--lg" type="submit" disabled={isSubmitting}>
            Send Complaint
          </button>
          <Link className="btn btn--ghost btn--lg" to="/support">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
