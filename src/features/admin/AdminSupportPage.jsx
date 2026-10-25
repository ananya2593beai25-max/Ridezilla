// Admin support page at /admin/support and /admin/support/:id.

import { useStaffAuth } from "../../context/AuthContext";
import SupportInbox from "../support/SupportInbox";

export default function AdminSupportPage() {
  const { user } = useStaffAuth("admin");
  return (
    <>
      <div className="app-top">
        <div>
          <h1>Support</h1>
          <p>Read complaints, reply to the client and mark them resolved.</p>
        </div>
      </div>
      <SupportInbox role="admin" user={user} />
    </>
  );
}
