import React, { useEffect, useState } from "react";
import { api } from "../../api/client";
import { useToast } from "../../components/Toast";
import { Card, PageHeader, Spinner, ErrorState, EmptyState, Badge } from "../../components/UI";
import { errorMessage, type VolunteerApplication } from "../../api/types";

export default function Applicants() {
  const { push } = useToast();
  const [items, setItems] = useState<VolunteerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  const load = async () => {
    setLoading(true); setError("");
    try { setItems(await api.get<VolunteerApplication[]>("/applications/ngo")); } catch (error: unknown) { setError(errorMessage(error)); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const update = async (id: number, status: string) => {
    try { await api.patch(`/applications/${id}`, { status }); push(`Application ${status}`, "success"); load(); }
    catch (error: unknown) { push(errorMessage(error), "error"); }
  };

  const shown = filter === "all" ? items : items.filter((a) => a.status === filter);
  return (
    <div>
      <PageHeader title="Applicants" subtitle="Review volunteer applications and approve within capacity." actions={
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-950 text-sm">
          <option value="all">All statuses</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="completed">Completed</option><option value="withdrawn">Withdrawn</option>
        </select>
      } />
      {error && <ErrorState message={error} onRetry={load} />}
      {loading ? <Spinner /> : shown.length === 0 ? <Card><EmptyState title="No applicants in this view" description="Applications from volunteers will appear here." /></Card> : (
        <div className="space-y-3">
          {shown.map((a) => (
            <Card key={a.id} className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap"><h2 className="font-bold text-slate-900 dark:text-white">{a.volunteer_name}</h2><Badge tone={a.status === "approved" ? "emerald" : a.status === "pending" ? "amber" : a.status === "completed" ? "blue" : "rose"}>{a.status}</Badge></div>
                <p className="text-sm text-slate-600 dark:text-slate-300">{a.opportunity_title}</p>
                <p className="text-xs text-slate-500 mt-1">{a.volunteer_email} · applied {new Date(a.applied_at).toLocaleDateString()}</p>
                {a.message && <p className="text-xs text-slate-500 mt-1 italic">“{a.message}”</p>}
              </div>
              <div className="flex flex-wrap gap-2">
                {a.status === "pending" && <>
                  <button onClick={() => update(a.id, "approved")} className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold">Approve</button>
                  <button onClick={() => update(a.id, "rejected")} className="px-3 py-2 rounded-lg bg-rose-50 text-rose-700 text-xs font-semibold">Reject</button>
                </>}
                {a.status === "approved" && <button onClick={() => update(a.id, "completed")} className="px-3 py-2 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold">Mark completed</button>}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
