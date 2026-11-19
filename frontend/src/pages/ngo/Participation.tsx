import React, { useEffect, useState } from "react";
import { api } from "../../api/client";
import { useToast } from "../../components/Toast";
import { Card, PageHeader, Spinner, ErrorState, EmptyState, Badge, StatCard } from "../../components/UI";
import { Clock, ShieldCheck } from "lucide-react";

export default function NgoParticipation() {
  const { push } = useToast();
  const [apps, setApps] = useState<any[]>([]);
  const [parts, setParts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState<{ appId: number | null; hours: string; notes: string }>({ appId: null, hours: "", notes: "" });

  const load = async () => {
    setLoading(true); setError("");
    try {
      const [a, p] = await Promise.all([api.get<any[]>("/applications/ngo"), api.get<any[]>("/participation/ngo")]);
      setApps(a); setParts(p);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const verifiedAppIds = new Set(parts.map((p) => p.application_id));
  const eligible = apps.filter((a) => ["approved", "completed"].includes(a.status) && !verifiedAppIds.has(a.id));
  const hours = parts.filter((p) => p.verified).reduce((s, p) => s + Number(p.hours || 0), 0);

  const verify = async (appId: number) => {
    if (!form.hours || Number(form.hours) <= 0) { push("Enter valid hours", "error"); return; }
    try {
      await api.post("/participation", { application_id: appId, hours: Number(form.hours), notes: form.notes, verified: true });
      push("Participation verified and hours recorded", "success");
      setForm({ appId: null, hours: "", notes: "" }); load();
    } catch (e: any) { push(e.message, "error"); }
  };

  return (
    <div>
      <PageHeader title="Participation verification" subtitle="Record verified hours for approved volunteers. Volunteers cannot edit verified hours." />
      {error && <ErrorState message={error} onRetry={load} />}
      {loading ? <Spinner /> : (
        <>
          <div className="grid sm:grid-cols-3 gap-4 mb-6">
            <StatCard label="Participation records" value={parts.length} hint="All verified activities" icon={<ShieldCheck className="w-5 h-5" />} />
            <StatCard label="Verified hours" value={hours} hint="Total recorded by your organization" icon={<Clock className="w-5 h-5" />} />
            <StatCard label="Awaiting verification" value={eligible.length} hint="Approved applications" icon={<Clock className="w-5 h-5" />} />
          </div>
          <Card className="p-5 mb-6">
            <h2 className="font-bold text-slate-900 dark:text-white mb-3">Record participation</h2>
            {eligible.length === 0 ? <p className="text-sm text-slate-500">No approved applications awaiting verification.</p> : (
              <div className="space-y-3">
                {eligible.map((a) => (
                  <div key={a.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div><p className="font-semibold text-slate-800 dark:text-slate-200">{a.volunteer_name}</p><p className="text-xs text-slate-500">{a.opportunity_title}</p></div>
                    {form.appId === a.id ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <input type="number" min={0.5} step={0.5} value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} placeholder="Hours" className="w-24 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-950 text-sm" />
                        <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notes" className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-950 text-sm" />
                        <button onClick={() => verify(a.id)} className="px-3 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-semibold">Verify</button>
                      </div>
                    ) : <button onClick={() => setForm({ appId: a.id, hours: "", notes: "" })} className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold">Record hours</button>}
                  </div>
                ))}
              </div>
            )}
          </Card>
          <Card className="overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800"><h2 className="font-bold text-slate-900 dark:text-white">Participation records</h2></div>
            {parts.length === 0 ? <EmptyState title="No participation recorded yet" description="Record verified hours after volunteers complete activities." /> : (
              <div className="overflow-x-auto"><table className="w-full text-left text-sm">
                <thead><tr className="bg-slate-50 dark:bg-slate-800/50 text-[11px] uppercase tracking-wider text-slate-500"><th className="py-3 px-6">Volunteer</th><th className="py-3 px-6">Opportunity</th><th className="py-3 px-6">Hours</th><th className="py-3 px-6">Verified</th><th className="py-3 px-6">Date</th></tr></thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">{parts.map((p) => (
                  <tr key={p.id}><td className="py-3 px-6 font-medium">{p.volunteer_name}</td><td className="py-3 px-6">{p.opportunity_title}</td><td className="py-3 px-6">{p.hours}</td><td className="py-3 px-6"><Badge tone={p.verified ? "emerald" : "amber"}>{p.verified ? "Verified" : "Pending"}</Badge></td><td className="py-3 px-6 text-slate-500">{new Date(p.completed_at).toLocaleDateString()}</td></tr>
                ))}</tbody>
              </table></div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
