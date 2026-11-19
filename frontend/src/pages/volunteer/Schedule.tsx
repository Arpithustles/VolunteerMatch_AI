import React, { useEffect, useMemo, useState } from "react";
import { CalendarDays, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { api } from "../../api/client";
import { Card, PageHeader, Spinner, ErrorState, EmptyState, Badge } from "../../components/UI";

export default function SchedulePage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [month, setMonth] = useState(() => new Date());

  const load = async () => {
    setLoading(true); setError("");
    try { setItems(await api.get<any[]>("/schedules/me")); } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const scheduledDates = useMemo(() => new Set(items.filter((s) => s.scheduled_date).map((s) => s.scheduled_date)), [items]);
  const upcoming = items.filter((s) => s.status === "upcoming");
  const past = items.filter((s) => s.status !== "upcoming");

  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const offset = firstDay.getDay();
  const cells: (number | null)[] = [...Array(offset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const dateKey = (d: number) => `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  return (
    <div>
      <PageHeader title="My schedule" subtitle="Approved commitments appear here. Conflicts are flagged automatically." />
      {error && <ErrorState message={error} onRetry={load} />}
      {loading ? <Spinner /> : (
        <div className="grid lg:grid-cols-3 gap-5">
          <Card className="p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-900 dark:text-white">{month.toLocaleString("default", { month: "long", year: "numeric" })}</h2>
              <div className="flex gap-1">
                <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-sm">‹</button>
                <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-sm">›</button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase text-slate-400 mb-1">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <div key={d}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {cells.map((d, i) => (
                <div key={i} className={`aspect-square rounded-lg flex flex-col items-center justify-center text-sm ${d && scheduledDates.has(dateKey(d)) ? "bg-emerald-600 text-white font-bold" : "text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40"}`}>
                  {d || ""}{d && scheduledDates.has(dateKey(d)) && <span className="w-1.5 h-1.5 rounded-full bg-white mt-0.5" />}
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-3 flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-600 inline-block" />Scheduled commitment</p>
          </Card>
          <div className="space-y-4">
            <Card className="p-5">
              <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2"><CalendarDays className="w-4 h-4 text-emerald-600" />Upcoming</h2>
              {upcoming.length === 0 ? <p className="text-sm text-slate-500 mt-2">No upcoming commitments. Get approved for an opportunity to appear here.</p> : (
                <div className="mt-3 space-y-3">
                  {upcoming.map((s) => (
                    <div key={s.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                      <p className="font-semibold text-sm text-slate-900 dark:text-white">{s.opportunity_title}</p>
                      <p className="text-xs text-teal-700 dark:text-teal-400">{s.organization_name}</p>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1"><Clock className="w-3 h-3" />{s.scheduled_date || "TBD"}</p>
                      {s.has_conflict && <p className="mt-2 text-xs text-amber-700 flex items-start gap-1"><AlertTriangle className="w-3.5 h-3.5 mt-0.5" />{s.conflict_details}</p>}
                    </div>
                  ))}
                </div>
              )}
            </Card>
            <Card className="p-5">
              <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" />Past</h2>
              {past.length === 0 ? <p className="text-sm text-slate-500 mt-2">No past commitments yet.</p> : <div className="mt-3 space-y-2">{past.map((s) => <div key={s.id} className="text-sm flex items-center justify-between"><span className="text-slate-700 dark:text-slate-300">{s.opportunity_title}</span><Badge tone="slate">{s.status}</Badge></div>)}</div>}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
