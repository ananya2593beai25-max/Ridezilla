// Route table. Layout routes (AppLayout, AdminLayout, DriverLayout) wrap groups of pages,
// and guard routes (ProtectedRoute for clients, RoleRoute for staff) decide who may enter.
// Pages with maps or lots of code are lazy: their code is fetched only when first visited.
//
//   Client site   /  /rides  /book  /bookings  /dashboard  /support  /login  /register  /faq
//   Admin panel   /admin/login  /admin  /admin/requests  /admin/drivers  /admin/fleet  /admin/support
//   Driver panel  /driver/login  /driver  /driver/history  /driver/profile
//
// The staff panels are not linked from the client site. Staff open their URL directly.

import ForgotPasswordPage from "./features/auth/ForgotPasswordPage";
import AccountPage from "./features/auth/AccountPage";
import { lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleRoute from "./components/RoleRoute";
import HomePage from "./pages/HomePage";
import FaqPage from "./pages/FaqPage";
import NotFoundPage from "./pages/NotFoundPage";
import LoginPage from "./features/auth/LoginPage";
import RegisterPage from "./features/auth/RegisterPage";
import StaffLoginPage from "./features/staff/StaffLoginPage";
import SetPasswordPage from "./features/staff/SetPasswordPage";

// Client
const RidesPage = lazy(() => import("./features/vehicles/RidesPage"));
const BookingPage = lazy(() => import("./features/bookings/BookingPage"));
const BookingDetailPage = lazy(() => import("./features/bookings/BookingDetailPage"));
const BookingsPage = lazy(() => import("./features/bookings/BookingsPage"));
const DashboardPage = lazy(() => import("./features/dashboard/DashboardPage"));
const ClientSupportPage = lazy(() => import("./features/support/ClientSupportPage"));
const NewTicketPage = lazy(() => import("./features/support/NewTicketPage"));

// Admin
const AdminLayout = lazy(() => import("./features/admin/AdminLayout"));
const AdminOverview = lazy(() => import("./features/admin/AdminOverview"));
const AdminRequestsPage = lazy(() => import("./features/admin/AdminRequestsPage"));
const AdminRequestDetail = lazy(() => import("./features/admin/AdminRequestDetail"));
const AdminDriversPage = lazy(() => import("./features/admin/AdminDriversPage"));
const AdminFleetPage = lazy(() => import("./features/admin/AdminFleetPage"));
const AdminPricingPage = lazy(() => import("./features/admin/AdminPricingPage"));
const AdminSupportPage = lazy(() => import("./features/admin/AdminSupportPage"));
const AdminCustomersPage = lazy(() => import("./features/admin/AdminCustomersPage"));

// Driver
const DriverLayout = lazy(() => import("./features/driver/DriverLayout"));
const DriverRidePage = lazy(() => import("./features/driver/DriverRidePage"));
const DriverHistoryPage = lazy(() => import("./features/driver/DriverHistoryPage"));
const DriverProfilePage = lazy(() => import("./features/driver/DriverProfilePage"));

export default function App() {
  return (
    <Routes>
      {/* Client site with the normal header and footer */}
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="faq" element={<FaqPage />} />
        <Route path="contact" element={<Navigate to="/faq" replace />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage role="client" />} />

        {/* Signed-in client pages. They share the same header as the rest of the site. */}
        <Route element={<ProtectedRoute />}>
          <Route path="rides" element={<RidesPage />} />
          <Route path="book" element={<BookingPage />} />
          <Route path="bookings" element={<BookingsPage />} />
          <Route path="bookings/:id" element={<BookingDetailPage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="support" element={<ClientSupportPage />} />
          <Route path="support/new" element={<NewTicketPage />} />
          <Route path="support/:id" element={<ClientSupportPage />} />
          <Route path="account" element={<AccountPage />} />
        </Route>
      </Route>

      {/* A rider who logged in with a temporary password chooses their own here */}
      <Route element={<ProtectedRoute />}>
        <Route path="account/set-password" element={<SetPasswordPage role="client" />} />
      </Route>

      {/* Admin panel */}
      <Route path="admin/login" element={<StaffLoginPage role="admin" />} />
      <Route element={<RoleRoute role="admin" loginPath="/admin/login" />}>
        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<AdminOverview />} />
          <Route path="requests" element={<AdminRequestsPage />} />
          <Route path="requests/:id" element={<AdminRequestDetail />} />
          <Route path="customers" element={<AdminCustomersPage />} />
          <Route path="drivers" element={<AdminDriversPage />} />
          <Route path="fleet" element={<AdminFleetPage />} />
          <Route path="pricing" element={<AdminPricingPage />} />
          <Route path="support" element={<AdminSupportPage />} />
          <Route path="support/:id" element={<AdminSupportPage />} />
        </Route>
      </Route>

      {/* Driver panel */}
      <Route path="driver/login" element={<StaffLoginPage role="driver" />} />
      <Route path="driver/forgot-password" element={<ForgotPasswordPage role="driver" />} />
      <Route element={<RoleRoute role="driver" loginPath="/driver/login" />}>
        <Route path="driver/set-password" element={<SetPasswordPage role="driver" />} />
        <Route path="driver" element={<DriverLayout />}>
          <Route index element={<DriverRidePage />} />
          <Route path="history" element={<DriverHistoryPage />} />
          <Route path="profile" element={<DriverProfilePage />} />
        </Route>
      </Route>

      <Route element={<AppLayout />}>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
