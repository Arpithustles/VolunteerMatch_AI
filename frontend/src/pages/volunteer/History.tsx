import React, { useEffect, useState } from "react";
import { api } from "../../api/client";
import { useToast } from "../../components/Toast";
import { Card, PageHeader, Spinner, ErrorState, EmptyState, Badge, StatCard } from "../../components/UI";
import { Clock, CheckCircle2, Star } from "lucide-react";

export default function HistoryPage() {
  const { push } = useToast();
  const [parts, setParts] = useState<any[]>([]);
  const [apps, setApps] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState<{ appId: number | null; rating: number; comment: string }>({ appId: null, rating: 5, comment: "" });

  const load = async () => {
    setLoading(true); setError("");
    try {
      const [p, a, f] = await Promise.all([api.get<any[]>("/participation/me"), api.get<any[]>("/applications/me"), api.get<any[]>("/feedback/me")]);
      setParts(p); setApps(a); setFeedback(f);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const totalHours = parts.filter((p) => p.verified).reduce((s, p) => s + Number(p.hours || 0), 0);
  const submitted = new Set(feedback.map((f) => f.application_id));
  const eligible = apps.filter((a) => ["approved", "completed"].includes(a.status) && !submitted.has(a.id));

  const submitFeedback = async (appId: number) => {
    try {
      await api.post("/feedback", { application_id: appId, rating: form.rating, comment: form.comment });
      push("Feedback submitted", "success"); setForm({ appId: null, rating: 5, comment: "" }); load();
    } catch (e: any) { push(e.message, "error"); }
  };

  return (
    <div>
      <PageHeader title="Participation history" subtitle="Verified hours and organizer participation records." />
      {error && <ErrorState message={error} onRetry={load} />}
      {loading ? <Spinner /> : (
        <>
          <div className="grid sm:grid-cols-3 gap-4 mb-6">
            <StatCard label="Verified hours" value={totalHours} hint="Only verified records count" icon={<Clock className="w-5 h-5" />} />
            <StatCard label="Activities" value={parts.length} hint="Completed participation records" icon={<CheckCircle2 className="w-5 h-5" />} />
            <StatCard label="Feedback given" value={feedback.length} hint="Your reviews of activities" icon={<Star className="w-5 h-5" />} />
          </div>
          <Card className="overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800"><h2 className="font-bold text-slate-900 dark:text-white">Verified participation</h2></div>
            {parts.length === 0 ? <EmptyState title="No verified participation yet" description="Once an organizer verifies your completed activity, it appears here." /> : (
              <div className="overflow-x-auto"><table className="w-full text-left text-sm">
                <thead><tr className="bg-slate-50 dark:bg-slate-800/50 text-[11px] uppercase tracking-wider text-slate-500"><th className="py-3 px-6">Opportunity</th><th className="py-3 px-6">Hours</th><th className="py-3 px-6">Verified</th><th className="py-3 px-6">Date</th></tr></thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {parts.map((p) => (
                    <tr key={p.id}><td className="py-3 px-6 font-medium text-slate-800 dark:text-slate-200">{p.opportunity_title}</td><td className="py-3 px-6">{p.hours}</td><td className="py-3 px-6"><Badge tone={p.verified ? "emerald" : "amber"}>{p.verified ? "Verified" : "Pending"}</Badge></td><td className="py-3 px-6 text-slate-500">{new Date(p.completed_at).toLocaleDateString()}</td></tr>
                  ))}
                </tbody>
              </table></div>
            )}
          </Card>
          <Card className="p-6">
            <h2 className="font-bold text-slate-900 dark:text-white mb-1">Feedback</h2>
            <p className="text-sm text-slate-500 mb-4">Share feedback for approved or completed activities.</p>
            {eligible.length === 0 ? <p className="text-sm text-slate-500">No activities awaiting feedback.</p> : (
              <div className="space-y-3">
                {eligible.map((a) => (
                  <div key={a.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div><p className="font-semibold text-slate-800 dark:text-slate-200">{a.opportunity_title}</p><p className="text-xs text-slate-500">{a.organization_name}</p></div>
                      {form.appId === a.id ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <select value={form.rating} onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })} className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-950 text-sm">{[1,2,3,4,5].map((n) => <option key={n} value={n}>{n} star{n>1?"s":""}</option>)}</select>
                          <input value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} placeholder="Comment (optional)" className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-950 text-sm" />
                          <button onClick={() => submitFeedback(a.id)} className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold">Submit</button>
                        </div>
                      ) : <button onClick={() => setForm({ ...form, appId: a.id })} className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold">Give feedback</button>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
