import React, { useEffect, useState } from "react";
import { api } from "../../api/client";
import { useToast } from "../../components/Toast";
import { Card, PageHeader, Spinner, ErrorState, EmptyState, Badge } from "../../components/UI";

export default function AdminUsers() {
  const { push } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [role, setRole] = useState("all");

  const load = async () => {
    setLoading(true); setError("");
    try { setUsers(await api.get<any[]>("/users")); } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const toggle = async (u: any) => {
    try { await api.patch(`/users/${u.id}/status?is_active=${!u.is_active}`); push("User status updated", "success"); load(); }
    catch (e: any) { push(e.message, "error"); }
  };

  const shown = role === "all" ? users : users.filter((u) => u.role === role);
  return (
    <div>
      <PageHeader title="User management" subtitle="View and deactivate platform accounts." actions={
        <select value={role} onChange={(e) => setRole(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-950 text-sm"><option value="all">All roles</option><option value="volunteer">Volunteers</option><option value="ngo">Organizers</option><option value="admin">Admins</option></select>
      } />
      {error && <ErrorState message={error} onRetry={load} />}
      {loading ? <Spinner /> : shown.length === 0 ? <EmptyState title="No users found" /> : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto"><table className="w-full text-left text-sm">
            <thead><tr className="bg-slate-50 dark:bg-slate-800/50 text-[11px] uppercase tracking-wider text-slate-500"><th className="py-3 px-6">Name</th><th className="py-3 px-6">Email</th><th className="py-3 px-6">Role</th><th className="py-3 px-6">Status</th><th className="py-3 px-6 text-right">Action</th></tr></thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {shown.map((u) => (
                <tr key={u.id}><td className="py-3 px-6 font-medium">{u.full_name}</td><td className="py-3 px-6 text-slate-500">{u.email}</td><td className="py-3 px-6"><Badge tone={u.role === "admin" ? "violet" : u.role === "ngo" ? "blue" : "emerald"}>{u.role === "ngo" ? "organizer" : u.role}</Badge></td><td className="py-3 px-6"><Badge tone={u.is_active ? "emerald" : "rose"}>{u.is_active ? "active" : "inactive"}</Badge></td><td className="py-3 px-6 text-right">{u.role !== "admin" && <button onClick={() => toggle(u)} className={`text-xs font-semibold ${u.is_active ? "text-rose-600" : "text-emerald-600"}`}>{u.is_active ? "Deactivate" : "Activate"}</button>}</td></tr>
              ))}
            </tbody>
          </table></div>
        </Card>
      )}
    </div>
  );
}
