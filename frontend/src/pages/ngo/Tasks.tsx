import React, { useEffect, useMemo, useState } from "react";
import { api } from "../../api/client";
import { useToast } from "../../components/Toast";
import { Card, PageHeader, Spinner, ErrorState, EmptyState, Badge } from "../../components/UI";

export default function NgoTasks() {
  const { push } = useToast();
  const [tasks, setTasks] = useState<any[]>([]);
  const [opps, setOpps] = useState<any[]>([]);
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState<any>({ opportunity_id: "", assigned_to_id: "", title: "", description: "", deadline: "" });

  const load = async () => {
    setLoading(true); setError("");
    try {
      const [t, o, a] = await Promise.all([api.get<any[]>("/tasks/ngo"), api.get<any[]>("/opportunities/mine"), api.get<any[]>("/applications/ngo")]);
      setTasks(t); setOpps(o); setApps(a);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const approvedForSelected = useMemo(() => apps.filter((a) => a.status === "approved" && String(a.opportunity_id) === String(form.opportunity_id)), [apps, form.opportunity_id]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/tasks", { ...form, opportunity_id: Number(form.opportunity_id), assigned_to_id: form.assigned_to_id ? Number(form.assigned_to_id) : null, deadline: form.deadline || null });
      push("Task created", "success"); setForm({ opportunity_id: "", assigned_to_id: "", title: "", description: "", deadline: "" }); load();
    } catch (e: any) { push(e.message, "error"); }
  };
  const update = async (id: number, status: string) => {
    try { await api.patch(`/tasks/${id}`, { status }); push("Task updated", "success"); load(); } catch (e: any) { push(e.message, "error"); }
  };
  const remove = async (id: number) => {
    if (!confirm("Delete this task?")) return;
    try { await api.del(`/tasks/${id}`); push("Task deleted", "success"); load(); } catch (e: any) { push(e.message, "error"); }
  };

  const input = "w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-950 text-sm";
  return (
    <div>
      <PageHeader title="Task management" subtitle="Create tasks, assign them to approved volunteers, and track progress." />
      {error && <ErrorState message={error} onRetry={load} />}
      {loading ? <Spinner /> : (
        <div className="grid lg:grid-cols-3 gap-5">
          <Card className="p-5 h-fit">
            <h2 className="font-bold text-slate-900 dark:text-white mb-3">Create task</h2>
            <form onSubmit={create} className="space-y-3">
              <select className={input} value={form.opportunity_id} onChange={(e) => setForm({ ...form, opportunity_id: e.target.value, assigned_to_id: "" })} required>
                <option value="">Select opportunity</option>{opps.map((o) => <option key={o.id} value={o.id}>{o.title}</option>)}
              </select>
              <select className={input} value={form.assigned_to_id} onChange={(e) => setForm({ ...form, assigned_to_id: e.target.value })}>
                <option value="">Unassigned</option>{approvedForSelected.map((a) => <option key={a.id} value={a.volunteer_id}>{a.volunteer_name}</option>)}
              </select>
              <input className={input} placeholder="Task title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              <textarea className={input} rows={2} placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <input type="date" className={input} value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
              <button className="w-full py-2.5 rounded-xl bg-teal-600 text-white text-sm font-semibold">Create task</button>
            </form>
          </Card>
          <div className="lg:col-span-2 space-y-3">
            {tasks.length === 0 ? <Card><EmptyState title="No tasks yet" description="Create tasks for your approved volunteers." /></Card> : tasks.map((t) => (
              <Card key={t.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap"><h3 className="font-semibold text-slate-900 dark:text-white">{t.title}</h3><Badge tone={t.status === "completed" ? "emerald" : t.status === "in_progress" ? "blue" : "amber"}>{t.status.replace("_", " ")}</Badge></div>
                  <p className="text-xs text-slate-500">{t.opportunity_title} · {t.assignee_name || "Unassigned"}{t.deadline ? ` · due ${t.deadline}` : ""}</p>
                </div>
                <div className="flex gap-2">
                  {t.status === "pending" && <button onClick={() => update(t.id, "in_progress")} className="px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold">Start</button>}
                  {t.status !== "completed" && <button onClick={() => update(t.id, "completed")} className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold">Complete</button>}
                  <button onClick={() => remove(t.id)} className="px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-700 text-xs font-semibold">Delete</button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
