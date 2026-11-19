import React, { useEffect, useState } from "react";
import { api } from "../../api/client";
import { useToast } from "../../components/Toast";
import { Card, PageHeader, Spinner, ErrorState, EmptyState, Badge } from "../../components/UI";

export default function TasksPage() {
  const { push } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true); setError("");
    try { setItems(await api.get<any[]>("/tasks/mine")); } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const update = async (id: number, status: string) => {
    try { await api.patch(`/tasks/${id}`, { status }); push(`Task marked ${status.replace("_", " ")}`, "success"); load(); }
    catch (e: any) { push(e.message, "error"); }
  };

  return (
    <div>
      <PageHeader title="My tasks" subtitle="Tasks assigned by organizers for opportunities you are approved for." />
      {error && <ErrorState message={error} onRetry={load} />}
      {loading ? <Spinner /> : items.length === 0 ? <Card><EmptyState title="No tasks assigned" description="Tasks will appear here after an organizer assigns them to you." /></Card> : (
        <div className="space-y-3">
          {items.map((t) => (
            <Card key={t.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap"><h2 className="font-bold text-slate-900 dark:text-white">{t.title}</h2><Badge tone={t.status === "completed" ? "emerald" : t.status === "in_progress" ? "blue" : "amber"}>{t.status.replace("_", " ")}</Badge></div>
                <p className="text-xs font-semibold text-teal-700 dark:text-teal-400 mt-0.5">{t.opportunity_title}</p>
                {t.description && <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">{t.description}</p>}
                {t.deadline && <p className="text-xs text-slate-500 mt-1">Deadline: {t.deadline}</p>}
              </div>
              <div className="flex gap-2 shrink-0">
                {t.status === "pending" && <button onClick={() => update(t.id, "in_progress")} className="px-3 py-2 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold">Start task</button>}
                {t.status !== "completed" && <button onClick={() => update(t.id, "completed")} className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold">Mark completed</button>}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
