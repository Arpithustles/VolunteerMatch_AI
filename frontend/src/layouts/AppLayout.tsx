import React, { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  HeartHandshake, LayoutDashboard, Compass, Sparkles, FileText, CalendarDays,
  ListChecks, History, MessageSquare, User, Building2, PlusCircle, Users,
  ClipboardList, BarChart3, Shield, LogOut, Moon, Sun, Menu, X, Star,
  Bell, CheckCheck, Trash2
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { useDarkMode } from "../hooks/useDarkMode";
import { api } from "../api/client";

type NotificationItem = { id: number; title: string; message: string; target_url?: string | null; is_read: boolean; created_at: string };

const volunteerNav = [
  { to: "/volunteer", label: "Dashboard", icon: LayoutDashboard },
  { to: "/volunteer/explore", label: "Explore", icon: Compass },
  { to: "/volunteer/recommendations", label: "AI recommendations", icon: Sparkles },
  { to: "/volunteer/applications", label: "Applications", icon: FileText },
  { to: "/volunteer/saved", label: "Saved", icon: Star },
  { to: "/volunteer/schedule", label: "Schedule", icon: CalendarDays },
  { to: "/volunteer/tasks", label: "Tasks", icon: ListChecks },
  { to: "/volunteer/history", label: "Participation", icon: History },
  { to: "/volunteer/assistant", label: "AI Assistant", icon: MessageSquare },
  { to: "/volunteer/profile", label: "Profile", icon: User },
];

const ngoNav = [
  { to: "/ngo", label: "Dashboard", icon: LayoutDashboard },
  { to: "/ngo/opportunities", label: "My events", icon: Building2 },
  { to: "/ngo/opportunities/new", label: "Create opportunity", icon: PlusCircle },
  { to: "/ngo/applicants", label: "Applicants", icon: Users },
  { to: "/ngo/tasks", label: "Tasks", icon: ClipboardList },
  { to: "/ngo/participation", label: "Participation", icon: History },
  { to: "/ngo/profile", label: "Organization", icon: User },
];

const adminNav = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/ngos", label: "Organizations", icon: Building2 },
  { to: "/admin/opportunities", label: "Opportunities", icon: ClipboardList },
  { to: "/admin/assistant", label: "AI Assistant", icon: MessageSquare },
];

export function AppLayout() {
  const { user, logout } = useAuth();
  const { dark, toggle } = useDarkMode();
  const [open, setOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const nav = user?.role === "ngo" ? ngoNav : user?.role === "admin" ? adminNav : volunteerNav;
  const roleLabel = user?.role === "ngo" ? "Organizer workspace" : user?.role === "admin" ? "Admin console" : "Volunteer hub";
  const accent = user?.role === "ngo" ? "teal" : user?.role === "admin" ? "violet" : "emerald";

  const loadNotifications = async () => {
    try {
      const result = await api.get<{ items: NotificationItem[]; unread_count: number }>("/notifications");
      setNotifications(result.items);
      setUnreadCount(result.unread_count);
    } catch (error) {
      console.error("Could not load notifications", error);
    }
  };
  useEffect(() => {
    if (!user) return;
    loadNotifications();
    const timer = window.setInterval(loadNotifications, 30000);
    return () => window.clearInterval(timer);
  }, [user?.id]);

  const markRead = async (item: NotificationItem) => {
    try {
      await api.patch(`/notifications/${item.id}/read`);
      await loadNotifications();
    } catch (error) {
      console.error("Could not mark notification as read", error);
    }
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition ${isActive ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"}`;

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950">
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transform transition-transform lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-200 dark:border-slate-800">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center"><HeartHandshake className="w-4 h-4" /></div>
            <span className="font-bold text-sm text-slate-900 dark:text-white">VolunteerMatch <span className="text-emerald-600">AI</span></span>
          </Link>
          <button className="lg:hidden text-slate-500" onClick={() => setOpen(false)}><X className="w-5 h-5" /></button>
        </div>
        <div className="p-4">
          <div className="mb-4 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{roleLabel}</p>
            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{user?.full_name}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          </div>
          <nav className="space-y-0.5">
            {nav.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.to.split("/").length <= 2} onClick={() => setOpen(false)} className={linkClass}>
                <item.icon className="w-4 h-4" />{item.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <button onClick={toggle} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">{dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}{dark ? "Light mode" : "Dark mode"}</button>
          <button onClick={() => { logout(); }} className="flex items-center gap-2 text-sm text-rose-600"><LogOut className="w-4 h-4" />Logout</button>
        </div>
      </aside>
      {open && <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={() => setOpen(false)} />}
      <div className="flex-1 lg:pl-64">
        <header className="sticky top-0 z-30 h-16 bg-white/85 dark:bg-slate-950/85 backdrop-blur border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6">
          <button className="lg:hidden p-2 text-slate-600 dark:text-slate-300" onClick={() => setOpen(true)}><Menu className="w-5 h-5" /></button>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"><Shield className="w-3.5 h-3.5" />{user?.role === "admin" ? "Administrator" : user?.role === "ngo" ? "Organizer verified" : "Volunteer"}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <button type="button" aria-label="Notifications" onClick={() => { setNotificationsOpen((value) => !value); loadNotifications(); }} className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && <span className="absolute -right-0.5 -top-0.5 min-w-4 rounded-full bg-rose-600 px-1 text-center text-[10px] font-bold text-white">{unreadCount > 99 ? "99+" : unreadCount}</span>}
              </button>
              {notificationsOpen && <div className="absolute right-0 top-12 z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                  <span className="font-bold text-slate-900 dark:text-white">Notifications</span>
                  <button type="button" onClick={async () => { try { await api.post("/notifications/read-all"); await loadNotifications(); } catch (error) { console.error("Could not mark notifications as read", error); } }} className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Mark all read</button>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? <p className="p-5 text-sm text-slate-500">You’re all caught up.</p> : notifications.map((item) => <div key={item.id} className={`border-b border-slate-100 p-4 last:border-0 dark:border-slate-800 ${item.is_read ? "" : "bg-emerald-50/60 dark:bg-emerald-950/20"}`}>
                    <button type="button" onClick={async () => { if (!item.is_read) await markRead(item); setNotificationsOpen(false); if (item.target_url) navigate(item.target_url); }} className="block w-full text-left">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{item.title}</p>
                      <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">{item.message}</p>
                    </button>
                    <div className="mt-2 flex justify-end gap-2">
                      {!item.is_read && <button aria-label="Mark as read" onClick={() => markRead(item)} className="rounded p-1 text-slate-400 hover:text-emerald-600"><CheckCheck className="h-4 w-4" /></button>}
                      <button aria-label="Delete notification" onClick={async () => { try { await api.del(`/notifications/${item.id}`); await loadNotifications(); } catch (error) { console.error("Could not delete notification", error); } }} className="rounded p-1 text-slate-400 hover:text-rose-600"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>)}
                </div>
                <Link to={`/${user?.role === "ngo" ? "ngo" : user?.role === "admin" ? "admin" : "volunteer"}/notifications`} onClick={() => setNotificationsOpen(false)} className="block border-t border-slate-100 px-4 py-3 text-center text-xs font-bold text-emerald-700 dark:border-slate-800 dark:text-emerald-400">View all notifications</Link>
              </div>}
            </div>
            <Link to="/" className="text-sm text-slate-500 hover:text-slate-800 dark:hover:text-white">Back to site</Link>
          </div>
        </header>
        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto"><Outlet /></main>
      </div>
    </div>
  );
}
