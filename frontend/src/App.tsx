import React from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "./auth/AuthContext";
import { PublicLayout } from "./layouts/PublicLayout";
import { AppLayout } from "./layouts/AppLayout";
import Landing from "./pages/public/Landing";
import Login from "./pages/public/Login";
import Register from "./pages/public/Register";
import About from "./pages/public/About";
import HowItWorks from "./pages/public/HowItWorks";
import PublicOpportunities from "./pages/public/PublicOpportunities";
import OpportunityDetail from "./pages/public/OpportunityDetail";
import AssistantPage from "./pages/public/AssistantPage";

import VolunteerDashboard from "./pages/volunteer/Dashboard";
import Explore from "./pages/volunteer/Explore";
import Recommendations from "./pages/volunteer/Recommendations";
import Applications from "./pages/volunteer/Applications";
import SchedulePage from "./pages/volunteer/Schedule";
import TasksPage from "./pages/volunteer/Tasks";
import HistoryPage from "./pages/volunteer/History";
import SavedPage from "./pages/volunteer/Saved";
import VolunteerProfile from "./pages/volunteer/Profile";

import NgoDashboard from "./pages/ngo/Dashboard";
import NgoOpportunities from "./pages/ngo/Opportunities";
import OpportunityForm from "./pages/ngo/OpportunityForm";
import Applicants from "./pages/ngo/Applicants";
import NgoTasks from "./pages/ngo/Tasks";
import NgoParticipation from "./pages/ngo/Participation";
import NgoProfile from "./pages/ngo/Profile";

import AdminDashboard from "./pages/admin/Dashboard";
import AdminUsers from "./pages/admin/Users";
import AdminNgos from "./pages/admin/Ngos";
import AdminOpportunities from "./pages/admin/Opportunities";
import NotificationCenter from "./pages/NotificationCenter";

function Protected({ role, children }: { role: "volunteer" | "ngo" | "admin"; children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-sm text-slate-500">Loading session...</div>;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (user.role !== role) return <Navigate to={`/${user.role}`} replace />;
  return <>{children}</>;
}

export default function App() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/about" element={<About />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/opportunities" element={<PublicOpportunities />} />
        <Route path="/opportunities/:id" element={<OpportunityDetail />} />
        <Route path="/assistant" element={<AssistantPage />} />
        <Route path="/login" element={user ? <Navigate to={`/${user.role}`} replace /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to={`/${user.role}`} replace /> : <Register />} />
      </Route>
      <Route path="/volunteer" element={<Protected role="volunteer"><AppLayout /></Protected>}>
        <Route index element={<VolunteerDashboard />} />
        <Route path="explore" element={<Explore />} />
        <Route path="recommendations" element={<Recommendations />} />
        <Route path="applications" element={<Applications />} />
        <Route path="saved" element={<SavedPage />} />
        <Route path="schedule" element={<SchedulePage />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="assistant" element={<AssistantPage />} />
        <Route path="profile" element={<VolunteerProfile />} />
        <Route path="notifications" element={<NotificationCenter />} />
      </Route>
      <Route path="/ngo" element={<Protected role="ngo"><AppLayout /></Protected>}>
        <Route index element={<NgoDashboard />} />
        <Route path="opportunities" element={<NgoOpportunities />} />
        <Route path="opportunities/new" element={<OpportunityForm />} />
        <Route path="opportunities/:id/edit" element={<OpportunityForm />} />
        <Route path="applicants" element={<Applicants />} />
        <Route path="tasks" element={<NgoTasks />} />
        <Route path="participation" element={<NgoParticipation />} />
        <Route path="profile" element={<NgoProfile />} />
        <Route path="notifications" element={<NotificationCenter />} />
      </Route>
      <Route path="/admin" element={<Protected role="admin"><AppLayout /></Protected>}>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="ngos" element={<AdminNgos />} />
        <Route path="opportunities" element={<AdminOpportunities />} />
        <Route path="assistant" element={<AssistantPage />} />
        <Route path="notifications" element={<NotificationCenter />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
