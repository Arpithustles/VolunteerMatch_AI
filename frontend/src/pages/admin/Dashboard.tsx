import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Users, Building2, ClipboardList, FileText, Activity, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { api } from "../../api/client";
import { Card, PageHeader, StatCard, Spinner, ErrorState } from "../../components/UI";

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true); setError("");
    try { setStats(await api.get<any>("/analytics/admin")); } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const statusData = Object.entries(stats?.application_status_counts || {}).map(([name, value]) => ({ name: name.replace("_", " "), value }));

  return (
    <div>
      <PageHeader title="Platform overview" subtitle="Real database metrics across users, opportunities and participation." />
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total users" value={stats?.total_users ?? 0} hint={`${stats?.total_volunteers ?? 0} volunteers · ${stats?.total_ngos ?? 0} organizers`} icon={<Users className="w-5 h-5" />} />
        <StatCard label="Organizations" value={stats?.total_organizations ?? 0} hint="Event, NGO and community teams" icon={<Building2 className="w-5 h-5" />} />
        <StatCard label="Opportunities" value={stats?.total_opportunities ?? 0} hint="All published" icon={<ClipboardList className="w-5 h-5" />} />
        <StatCard label="Applications" value={stats?.total_applications ?? 0} hint="All statuses" icon={<FileText className="w-5 h-5" />} />
      </div>
      <div className="grid lg:grid-cols-3 gap-5 mt-6">
        <Card className="p-5 lg:col-span-2">
          <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2"><Activity className="w-4 h-4 text-violet-600" />Application status breakdown</h2>
          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#059669" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <div className="space-y-4">
          <Card className="p-5">
            <h2 className="font-bold text-slate-900 dark:text-white">Completed activities</h2>
            <p className="text-3xl font-extrabold text-violet-600 mt-2">{stats?.total_completed_activities ?? 0}</p>
            <p className="text-xs text-slate-500 mt-1">Verified participation records</p>
          </Card>
          <Card className="p-5">
            <h2 className="font-bold text-slate-900 dark:text-white mb-3">Quick links</h2>
            <div className="space-y-2 text-sm">
              <Link to="/admin/users" className="block font-medium text-slate-700 dark:text-slate-200 hover:text-violet-600">Manage users →</Link>
              <Link to="/admin/ngos" className="block font-medium text-slate-700 dark:text-slate-200 hover:text-violet-600">Manage organizations →</Link>
              <Link to="/admin/opportunities" className="block font-medium text-slate-700 dark:text-slate-200 hover:text-violet-600">Manage opportunities →</Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
