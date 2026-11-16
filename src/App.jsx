import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./AuthContext";
import Layout from "./Layout";
import { ToastProvider } from "./ui";
import { Landing, Login, Register, Splash } from "./pages/Public";
import {
  BookFlow,
  BookingDetail,
  BookingsPage,
  EquipmentDetail,
  EquipmentPage,
  GroundDetail,
  GroundsPage,
  NotificationsPage,
  ProfilePage,
  ScanPassPage,
  SportsPage,
  StudentHome,
} from "./pages/Student";
import {
  AdminBookingDetail,
  AdminBookings,
  AdminCategories,
  AdminEquipment,
  AdminGrounds,
  AdminHome,
  AdminIssue,
  AdminMessages,
  AdminNotes,
  AdminReports,
  AdminSettings,
  AdminSports,
  AdminUsers,
} from "./pages/Admin";

function Guard({ children, role }) {
  const { user, ready } = useAuth();
  if (!ready) return <div className="grid min-h-screen place-items-center text-slate-400">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to={user.role === "admin" ? "/admin/dashboard" : "/app/dashboard"} replace />;
  return children;
}

export default function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/" element={<Splash />} />
        <Route path="/landing" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/app"
          element={
            <Guard>
              <Layout mode="student" />
            </Guard>
          }
        >
          <Route path="dashboard" element={<StudentHome />} />
          <Route path="sports" element={<SportsPage />} />
          <Route path="equipment" element={<EquipmentPage />} />
          <Route path="equipment/:id" element={<EquipmentDetail />} />
          <Route path="grounds" element={<GroundsPage />} />
          <Route path="grounds/:id" element={<GroundDetail />} />
          <Route path="book" element={<BookFlow />} />
          <Route path="bookings" element={<BookingsPage />} />
          <Route path="bookings/:id" element={<BookingDetail />} />
          <Route path="scan" element={<ScanPassPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        <Route
          path="/admin"
          element={
            <Guard role="admin">
              <Layout mode="admin" />
            </Guard>
          }
        >
          <Route path="dashboard" element={<AdminHome />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="sports" element={<AdminSports />} />
          <Route path="equipment" element={<AdminEquipment />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="grounds" element={<AdminGrounds />} />
          <Route path="bookings" element={<AdminBookings />} />
          <Route path="bookings/:id" element={<AdminBookingDetail />} />
          <Route path="issue" element={<AdminIssue />} />
          <Route path="messages" element={<AdminMessages />} />
          <Route path="notifications" element={<AdminNotes />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ToastProvider>
  );
}
