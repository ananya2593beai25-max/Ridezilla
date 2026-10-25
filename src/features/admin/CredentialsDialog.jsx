// Shown once after a driver is registered, or after a password reset: the login details to hand to the driver.
// The temporary password lives only in this dialog's props. It is not saved anywhere as text, so it cannot be shown again.

import { useState } from "react";
import { useToast } from "../../context/ToastContext";
import Icon from "../../components/Icon";
import Modal from "../../components/Modal";
import { copyText } from "../../lib/clipboard";

export default function CredentialsDialog({ driver, tempPassword, isNew, role = "driver", onClose }) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const rider = role === "client";
  const loginUrl = `${window.location.origin}${rider ? "/login" : "/driver/login"}`;

  // The message an admin can paste into WhatsApp or SMS.
  const message = [
    rider ? "Ridezilla login" : "Ridezilla driver login",
    `Login page: ${loginUrl}`,
    `Email: ${driver.email}`,
    `Temporary password: ${tempPassword}`,
    "You will be asked to choose your own password the first time you log in.",
  ].join("\n");

  async function copy() {
    const ok = await copyText(message);
    setCopied(ok);
    if (ok) setTimeout(() => setCopied(false), 2500);
    // Some browsers refuse clipboard access. Say so, and point to the way that always works.
    else toast("Could not copy automatically. Tap the temporary password to select it, then copy it by hand.");
  }

  return (
    <Modal title={isNew ? "Driver Registered" : "New Temporary Password"} onClose={onClose}>
      <p className="muted" style={{ marginBottom: 16 }}>
        Share these details with <strong style={{ color: "var(--text)" }}>{driver.name}</strong>. {rider ? "They" : "The driver"} must choose a new password at the next login.
      </p>

      <dl className="cred">
        <div>
          <dt>Login page</dt>
          <dd>{loginUrl}</dd>
        </div>
        <div>
          <dt>Email</dt>
          <dd>{driver.email}</dd>
        </div>
        <div>
          <dt>Temporary password</dt>
          <dd className="cred__secret">{tempPassword}</dd>
        </div>
      </dl>

      <div className="notice notice--warn" style={{ margin: "16px 0" }}>
        <div>This password is shown only now and is not saved as text, not even for admins. Copy it before you close this box. If it gets lost, reset the password again from the list.</div>
      </div>

      <div className="cta-actions">
        <button type="button" className="btn btn--primary btn--lg" onClick={copy}>
          <Icon name={copied ? "check" : "list"} size={18} />
          {copied ? "Copied" : "Copy Details"}
        </button>
        <button type="button" className="btn btn--ghost btn--lg" onClick={onClose}>
          Done
        </button>
      </div>
    </Modal>
  );
}
