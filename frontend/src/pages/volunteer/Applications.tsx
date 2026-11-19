import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, MapPin, Sparkles } from "lucide-react";
import { api } from "../../api/client";
import { useToast } from "../../components/Toast";
import { Card, PageHeader, Spinner, ErrorState, EmptyState, Badge } from "../../components/UI";
import { getCategoryImage } from "../../data/eventCategories";

const tone = (status: string) => status === "approved" ? "emerald" : status === "pending" ? "amber" : status === "completed" ? "blue" : status === "rejected" ? "rose" : "slate";

const formatDate = (value?: string | null) => {
  if (!value) return "Date flexible";
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime())
    ? value
    : parsed.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

export default function Applications() {
  const { push } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true); setError("");
    try { setItems(await api.get<any[]>("/applications/me")); } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const withdraw = async (id: number) => {
    if (!confirm("Withdraw this application? This cannot be undone.")) return;
    try { await api.patch(`/applications/${id}`, { status: "withdrawn" }); push("Application withdrawn", "success"); load(); }
    catch (e: any) { push(e.message, "error"); }
  };

  const counts = useMemo(() => {
    const base = { total: items.length, pending: 0, approved: 0, completed: 0 };
    for (const item of items) {
      if (item.status === "pending") base.pending += 1;
      if (item.status === "approved") base.approved += 1;
      if (item.status === "completed") base.completed += 1;
    }
    return base;
  }, [items]);

  return (
    <div>
      <PageHeader title="My applications" subtitle="Track every application and its current status." actions={<Link to="/volunteer/explore" className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"><Sparkles className="h-4 w-4" />Explore events</Link>} />

      {!loading && !error && items.length > 0 && (
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Total", value: counts.total, tone: "text-slate-900 dark:text-white" },
            { label: "Pending", value: counts.pending, tone: "text-amber-600" },
            { label: "Approved", value: counts.approved, tone: "text-emerald-600" },
            { label: "Completed", value: counts.completed, tone: "text-sky-600" },
          ].map((stat) => (
            <Card key={stat.label} className="p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">{stat.label}</p>
              <p className={`mt-1 text-2xl font-extrabold ${stat.tone}`}>{stat.value}</p>
            </Card>
          ))}
        </div>
      )}

      {error && <ErrorState message={error} onRetry={load} />}
      {loading ? <Spinner /> : items.length === 0 ? <Card><EmptyState title="No applications yet" description="Explore opportunities and apply to get started." action={<Link to="/volunteer/explore" className="text-sm font-semibold text-emerald-600">Explore opportunities</Link>} /></Card> : (
        <div className="space-y-3">
          {items.map((a) => (
            <Card key={a.id} className="overflow-hidden p-0">
              <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                <img
                  src={a.opportunity_cover_image || getCategoryImage(a.opportunity_category)}
                  alt={a.opportunity_title || "Opportunity"}
                  loading="lazy"
                  className="h-24 w-full shrink-0 rounded-xl object-cover sm:h-20 sm:w-32"
                  onError={(event) => { event.currentTarget.src = getCategoryImage(a.opportunity_category); }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-bold text-slate-900 dark:text-white">{a.opportunity_title}</h2>
                    <Badge tone={tone(a.status) as any}>{a.status}</Badge>
                    {a.is_demo && <Badge tone="amber">demo</Badge>}
                  </div>
                  <p className="mt-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">{a.organization_name}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                    {a.opportunity_category && <span>{a.opportunity_category}</span>}
                    <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{a.opportunity_location || "Flexible"}</span>
                    <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{formatDate(a.opportunity_start_date)}</span>
                    <span>Applied {a.applied_at ? new Date(a.applied_at).toLocaleDateString("en-IN") : ""}</span>
                  </div>
                  {a.message && <p className="mt-2 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">“{a.message}”</p>}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Link to={`/opportunities/${a.opportunity_id}`} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200">View event</Link>
                  {["pending", "approved"].includes(a.status) && <button onClick={() => withdraw(a.id)} className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">Withdraw</button>}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
