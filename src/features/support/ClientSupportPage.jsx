// Client support page at /support and /support/:id.

import { useAuth } from "../../context/AuthContext";
import SupportInbox from "./SupportInbox";

export default function ClientSupportPage() {
  const { user } = useAuth();
  return (
    <div className="container">
      <div className="page-head">
        <div>
          <h1>Support</h1>
          <p>Raise a complaint and chat with our team until it is sorted.</p>
        </div>
      </div>
      <SupportInbox role="client" user={user} />
    </div>
  );
}
