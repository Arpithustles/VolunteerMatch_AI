import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, CalendarDays, FileText, Clock, ChevronRight } from "lucide-react";
import { api } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { Card, PageHeader, StatCard, Spinner, ErrorState, Badge, Progress, EmptyState } from "../../components/UI";

export default function VolunteerDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [recs, setRecs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true); setError("");
    try {
      const [s, r] = await Promise.all([api.get<any>("/analytics/volunteer"), api.get<any>("/matching/recommendations")]);
      setStats(s); setRecs((r.items || []).slice(0, 3));
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  if (loading) return <Spinner label="Loading your dashboard..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div>
      <PageHeader title={`Welcome back, ${user?.full_name?.split(" ")[0]}`} subtitle="Here is your volunteering snapshot and latest AI matches." />
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Applications" value={stats?.total_applications ?? 0} hint="Total submitted" icon={<FileText className="w-5 h-5" />} />
        <StatCard label="Approved" value={stats?.approved_applications ?? 0} hint="Organizer approvals" icon={<Sparkles className="w-5 h-5" />} />
        <StatCard label="Verified hours" value={`${stats?.volunteering_hours ?? 0}`} hint="From participation records" icon={<Clock className="w-5 h-5" />} />
        <StatCard label="Upcoming events" value={stats?.upcoming_events ?? 0} hint="On your schedule" icon={<CalendarDays className="w-5 h-5" />} />
      </div>

      <div className="grid lg:grid-cols-3 gap-5 mt-6">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-slate-900 dark:text-white">Top AI recommendations</h2>
            <Link to="/volunteer/recommendations" className="text-sm font-semibold text-emerald-600 inline-flex items-center gap-1">View all <ChevronRight className="w-4 h-4" /></Link>
          </div>
          {recs.length === 0 ? <Card><EmptyState title="No recommendations yet" description="Complete your profile so we can rank opportunities for you." action={<Link to="/volunteer/profile" className="text-sm font-semibold text-emerald-600">Complete profile</Link>} /></Card> : (
            <div className="space-y-3">
              {recs.map((r) => (
                <Card key={r.opportunity_id} className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2"><h3 className="font-bold text-slate-900 dark:text-white">{r.opportunity_title}</h3><Badge tone="emerald">{r.match_category}</Badge></div>
                      <p className="text-xs font-semibold text-teal-700 dark:text-teal-400 mt-0.5">{r.organization_name}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 line-clamp-2">{r.explanation}</p>
                    </div>
                    <div className="text-right shrink-0"><p className="text-2xl font-extrabold text-emerald-600">{Math.round(r.match_percentage)}%</p><p className="text-[10px] uppercase tracking-wider text-slate-400">Match</p></div>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
                    <div><span className="text-slate-400">Skills</span><Progress value={r.breakdown?.skills ?? 0} className="mt-1" /></div>
                    <div><span className="text-slate-400">Interests</span><Progress value={r.interest_compatibility ?? 0} className="mt-1" /></div>
                    <div><span className="text-slate-400">Availability</span><Progress value={r.availability_compatibility ?? 0} className="mt-1" /></div>
                  </div>
                  <Link to={`/opportunities/${r.opportunity_id}`} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-emerald-600">View opportunity <ArrowRight className="w-3.5 h-3.5" /></Link>
                </Card>
              ))}
            </div>
          )}
        </div>
        <div className="space-y-5">
          <Card className="p-5">
            <div className="flex items-center justify-between"><h2 className="font-bold text-slate-900 dark:text-white">Profile completion</h2><span className="text-sm font-bold text-emerald-600">{stats?.profile_completion ?? 0}%</span></div>
            <Progress value={stats?.profile_completion ?? 0} className="mt-3" />
            <p className="text-xs text-slate-500 mt-2">Keep skills, availability and preferences updated for accurate matches.</p>
            <Link to="/volunteer/profile" className="mt-3 inline-flex text-sm font-semibold text-emerald-600">Edit profile →</Link>
          </Card>
          <Card className="p-5">
            <h2 className="font-bold text-slate-900 dark:text-white">Recent activity</h2>
            {(stats?.recent_activity || []).length === 0 ? <p className="text-sm text-slate-500 mt-2">No activity yet. Apply to an opportunity to get started.</p> : (
              <div className="mt-3 space-y-3">
                {stats.recent_activity.map((a: any, i: number) => (
                  <div key={i} className="flex items-start justify-between gap-2">
                    <div><p className="text-sm font-medium text-slate-800 dark:text-slate-200">{a.title}</p><p className="text-xs text-slate-400">{a.date ? new Date(a.date).toLocaleDateString() : ""}</p></div>
                    <Badge tone={a.status === "approved" ? "emerald" : a.status === "pending" ? "amber" : a.status === "completed" ? "blue" : "rose"}>{a.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
