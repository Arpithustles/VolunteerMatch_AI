import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PlusCircle, Building2, Users, ClipboardList, ArrowRight } from "lucide-react";
import { api } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { Card, PageHeader, StatCard, Spinner, ErrorState, Badge, EmptyState } from "../../components/UI";

export default function NgoDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [opps, setOpps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true); setError("");
    try {
      const [s, o] = await Promise.all([api.get<any>("/analytics/ngo"), api.get<any[]>("/opportunities/mine")]);
      setStats(s); setOpps(o);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  const ts = stats?.task_stats || {};

  return (
    <div>
      <PageHeader title={`${user?.full_name} dashboard`} subtitle="Manage opportunities, applicants and participation from one place." actions={<Link to="/ngo/opportunities/new" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold"><PlusCircle className="w-4 h-4" />Create opportunity</Link>} />
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Opportunities" value={stats?.total_opportunities ?? 0} hint={`${stats?.active_opportunities ?? 0} active`} icon={<Building2 className="w-5 h-5" />} />
        <StatCard label="Applicants" value={stats?.total_applicants ?? 0} hint={`${stats?.pending_applications ?? 0} pending review`} icon={<Users className="w-5 h-5" />} />
        <StatCard label="Approved volunteers" value={stats?.approved_volunteers ?? 0} hint="Approved applications" icon={<Users className="w-5 h-5" />} />
        <StatCard label="Verified hours" value={stats?.participation?.verified_hours ?? 0} hint={`${stats?.participation?.records ?? 0} participation records`} icon={<ClipboardList className="w-5 h-5" />} />
      </div>
      <div className="grid lg:grid-cols-3 gap-5 mt-6">
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-3"><h2 className="font-bold text-slate-900 dark:text-white">Your opportunities</h2><Link to="/ngo/opportunities" className="text-sm font-semibold text-teal-600 inline-flex items-center gap-1">Manage all <ArrowRight className="w-4 h-4" /></Link></div>
          {opps.length === 0 ? <EmptyState title="No opportunities yet" description="Create your first opportunity to start receiving applications." action={<Link to="/ngo/opportunities/new" className="text-sm font-semibold text-teal-600">Create opportunity</Link>} /> : (
            <div className="space-y-2">
              {opps.slice(0, 5).map((o) => (
                <div key={o.id} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div><p className="font-semibold text-sm text-slate-900 dark:text-white">{o.title}</p><p className="text-xs text-slate-500">{o.category} · {o.location || o.mode}</p></div>
                  <div className="flex items-center gap-2"><Badge tone={o.status === "open" ? "emerald" : "slate"}>{o.status}</Badge><Link to={`/ngo/opportunities/${o.id}/edit`} className="text-xs font-semibold text-teal-600">Edit</Link></div>
                </div>
              ))}
            </div>
          )}
        </Card>
        <div className="space-y-4">
          <Card className="p-5">
            <h2 className="font-bold text-slate-900 dark:text-white">Task overview</h2>
            <div className="mt-3 space-y-2 text-sm">
              <Row label="Total tasks" value={ts.total ?? 0} />
              <Row label="Pending" value={ts.pending ?? 0} />
              <Row label="In progress" value={ts.in_progress ?? 0} />
              <Row label="Completed" value={ts.completed ?? 0} />
            </div>
            <Link to="/ngo/tasks" className="mt-3 inline-flex text-sm font-semibold text-teal-600">Manage tasks →</Link>
          </Card>
          <Card className="p-5">
            <h2 className="font-bold text-slate-900 dark:text-white">Quick actions</h2>
            <div className="mt-3 space-y-2">
              <Link to="/ngo/applicants" className="block text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-teal-600">Review applicants ({stats?.pending_applications ?? 0} pending)</Link>
              <Link to="/ngo/participation" className="block text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-teal-600">Verify participation</Link>
              <Link to="/ngo/profile" className="block text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-teal-600">Edit organization profile</Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="flex items-center justify-between"><span className="text-slate-500">{label}</span><span className="font-semibold text-slate-800 dark:text-slate-200">{value}</span></div>;
}
