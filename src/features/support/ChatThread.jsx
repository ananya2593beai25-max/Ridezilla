// One complaint conversation. The same component serves the client and the admin, so `role` decides
// which side is "me", who can resolve or reopen, and which messages count as read.

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import Icon from "../../components/Icon";
import { messageSent, selectMessagesForTicket, selectTicketById, threadRead, ticketStatusSet } from "./supportSlice";
import { selectBookingById } from "../bookings/bookingsSlice";

export const TICKET_STATUS = {
  open: { label: "Open", chip: "chip--warn" },
  in_progress: { label: "In progress", chip: "chip--green" },
  resolved: { label: "Resolved", chip: "" },
};

const MAX_INPUT_HEIGHT = 140;

const time = (iso) => new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export default function ChatThread({ ticketId, role, viewerName, onBack }) {
  const dispatch = useDispatch();
  const ticket = useSelector((s) => selectTicketById(s, ticketId));
  const messages = useSelector((s) => selectMessagesForTicket(s, ticketId));
  const booking = useSelector((s) => (ticket?.bookingId ? selectBookingById(s, ticket.bookingId) : null));
  const listRef = useRef(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({ defaultValues: { text: "" } });

  // The box grows with the text, like a messaging app, up to a limit. After that it scrolls.
  const inputRef = useRef(null);
  const { ref: formRef, ...textField } = register("text", { required: "Write a message first.", validate: (v) => v.trim().length > 0 || "Write a message first." });
  const text = watch("text");
  useLayoutEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    if (!text) {
      // Empty: one line, even when the placeholder is long enough to wrap.
      el.style.height = "48px";
      el.style.overflowY = "hidden";
      return;
    }
    el.style.height = "auto";
    const height = Math.min(el.scrollHeight + 2, MAX_INPUT_HEIGHT);
    el.style.height = `${Math.max(height, 48)}px`;
    el.style.overflowY = el.scrollHeight + 2 > MAX_INPUT_HEIGHT ? "auto" : "hidden";
  }, [text]);

  // Opening the thread, or receiving a new message while it is open, marks the other side's messages as read.
  const lastId = messages.at(-1)?.id;
  useEffect(() => {
    if (ticket) dispatch(threadRead({ ticketId, role }));
  }, [dispatch, ticketId, role, lastId, !!ticket]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep the newest message in view.
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lastId]);

  const statusInfo = useMemo(() => TICKET_STATUS[ticket?.status] || TICKET_STATUS.open, [ticket?.status]);

  if (!ticket) {
    return (
      <div className="card empty">
        <h2 style={{ fontSize: "1.2rem" }}>Conversation not found</h2>
        <p>It may have been removed.</p>
        {onBack && (
          <button className="btn btn--ghost" type="button" onClick={onBack}>
            Back to the list
          </button>
        )}
      </div>
    );
  }

  const resolved = ticket.status === "resolved";

  const setStatus = (status, note) => {
    dispatch(ticketStatusSet({ id: ticketId, status }));
    dispatch(messageSent({ ticketId, role: "system", name: "Ridezilla", text: note }));
  };

  function onSend({ text }) {
    dispatch(messageSent({ ticketId, role, name: viewerName, text }));
    reset({ text: "" });
  }

  return (
    <section className="card chat" aria-labelledby="chat-title">
      <header className="chat__head">
        <div style={{ minWidth: 0 }}>
          {onBack && (
            <button className="chat__back btn btn--ghost" type="button" onClick={onBack}>
              Back
            </button>
          )}
          <h2 id="chat-title" className="chat__title">
            {ticket.subject}
          </h2>
          <p className="muted chat__meta">
            {ticket.clientName} · {ticket.category} · opened {time(ticket.createdAt)}
            {booking && (
              <>
                {" · "}
                {role === "admin" ? (
                  <Link to={`/admin/requests/${booking.id}`}>{booking.pickup.name} to {booking.dropoff.name}</Link>
                ) : (
                  <Link to={`/bookings/${booking.id}`}>{booking.pickup.name} to {booking.dropoff.name}</Link>
                )}
              </>
            )}
          </p>
        </div>
        <div className="chat__actions">
          <span className={`chip ${statusInfo.chip}`.trim()}>{statusInfo.label}</span>
          {role === "admin" &&
            (ticket.status === "resolved" ? (
              <button className="btn btn--ghost" type="button" onClick={() => setStatus("open", "The admin reopened this complaint.")}>
                <Icon name="refresh" size={16} /> Reopen
              </button>
            ) : (
              <button className="btn btn--primary" type="button" onClick={() => setStatus("resolved", "The admin marked this complaint as resolved.")}>
                <Icon name="check" size={16} /> Mark Resolved
              </button>
            ))}
        </div>
      </header>

      <div ref={listRef} className="chat__list" role="log" aria-live="polite" aria-label="Messages">
        {messages.map((m) =>
          m.senderRole === "system" ? (
            <p key={m.id} className="chat__system">
              {m.text}
            </p>
          ) : (
            <div key={m.id} className={`chat__msg${m.senderRole === role ? " chat__msg--me" : ""}`}>
              <div className="chat__bubble">{m.text}</div>
              <span className="chat__by">
                {m.senderRole === role ? "You" : m.senderName} · {time(m.createdAt)}
              </span>
            </div>
          )
        )}
      </div>

      {resolved && (
        <div className="chat__closed">
          <p className="muted chat__note">This complaint is resolved, so the chat is closed.</p>
          <button className="btn btn--ghost" type="button" onClick={() => setStatus("open", role === "admin" ? "The admin reopened this complaint." : "The client reopened this complaint.")}>
            <Icon name="refresh" size={16} /> Reopen Chat
          </button>
        </div>
      )}

      <form className="chat__form" onSubmit={handleSubmit(onSend)} noValidate>
        <div className="field" style={{ flex: 1 }}>
          <label htmlFor="chat-text" className="sr-only">
            Your message
          </label>
          <textarea
            id="chat-text"
            className="input chat__input"
            rows={1}
            disabled={resolved}
            placeholder={resolved ? "Reopen the chat to send a message" : role === "admin" ? "Reply to the client…" : "Write a message…"}
            maxLength={1000}
            aria-invalid={errors.text ? "true" : "false"}
            {...textField}
            ref={(el) => {
              formRef(el);
              inputRef.current = el;
            }}
            onKeyDown={(e) => {
              // Enter sends, Shift+Enter adds a new line.
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                handleSubmit(onSend)();
              }
            }}
          />
          <p className="field-error" aria-live="polite">
            {errors.text?.message}
          </p>
        </div>
        <button className="btn btn--primary chat__send" type="submit" disabled={resolved}>
          <Icon name="send" size={18} /> Send
        </button>
      </form>
    </section>
  );
}
