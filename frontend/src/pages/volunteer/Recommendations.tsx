import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  MapPin,
  RefreshCw,
  Sparkles,
  Star,
  Wrench,
} from "lucide-react";
import { api } from "../../api/client";
import { useToast } from "../../components/Toast";
import { Card, PageHeader, Spinner, ErrorState, EmptyState, Badge, Progress } from "../../components/UI";
import { getCategoryImage } from "../../data/eventCategories";

const formatDate = (value?: string | null) => {
  if (!value) return "Date flexible";
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime())
    ? value
    : parsed.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

const scoreTone = (score: number) =>
  score >= 80 ? "emerald" : score >= 60 ? "blue" : "amber";

export default function Recommendations() {
  const { push } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [saved, setSaved] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  const load = async () => {
    setLoading(true); setError("");
    try {
      const [data, savedList] = await Promise.all([api.get<any>("/matching/recommendations"), api.get<any[]>("/saved").catch(() => [])]);
      setItems(data.items || []);
      setSaved((savedList || []).map((x) => x.id));
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const toggleSave = async (id: number) => {
    try {
      if (saved.includes(id)) { await api.del(`/saved/${id}`); setSaved((s) => s.filter((x) => x !== id)); }
      else { await api.post(`/saved/${id}`); setSaved((s) => [...s, id]); push("Saved to your list", "success"); }
    } catch (e: any) { push(e.message, "error"); }
  };

  const shown = items.filter((r) => {
    if (filter === "remote") return r.opportunity?.mode === "remote";
    if (filter === "weekend") return /saturday|sunday|weekend/i.test(r.opportunity?.available_days || "");
    if (filter === "excellent") return r.match_percentage >= 80;
    return true;
  });

  const summary = useMemo(() => {
    if (!items.length) return null;
    const top = Math.round(Math.max(...items.map((r) => r.match_percentage)));
    const avg = Math.round(items.reduce((sum, r) => sum + r.match_percentage, 0) / items.length);
    return { top, avg, total: items.length };
  }, [items]);

  return (
    <div>
      <PageHeader title="AI recommendations" subtitle="Weighted, explainable matches based on your profile and live opportunities." actions={
        <>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-950 text-sm">
            <option value="all">All matches</option><option value="excellent">Highest match</option><option value="remote">Remote</option><option value="weekend">Weekend</option>
          </select>
          <button onClick={load} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold"><RefreshCw className="w-4 h-4" />Refresh</button>
        </>
      } />

      {summary && !loading && !error && (
        <div className="grid gap-3 sm:grid-cols-3 mb-5">
          <Card className="p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Live matches</p>
            <p className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">{summary.total}</p>
            <p className="text-xs text-slate-500">Open opportunities scored for you</p>
          </Card>
          <Card className="p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Top compatibility</p>
            <p className="mt-1 text-2xl font-extrabold text-emerald-600">{summary.top}%</p>
            <p className="text-xs text-slate-500">Your strongest current fit</p>
          </Card>
          <Card className="p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Average score</p>
            <p className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">{summary.avg}%</p>
            <p className="text-xs text-slate-500">Across all recommendations</p>
          </Card>
        </div>
      )}

      {error && <ErrorState message={error} onRetry={load} />}
      {loading ? <Spinner label="Calculating your matches..." /> : shown.length === 0 ? <EmptyState title="No recommendations match this filter" description="Try a different filter or update your profile for better matches." /> : (
        <div className="grid xl:grid-cols-2 gap-5">
          {shown.map((r) => {
            const opportunity = r.opportunity || {};
            return (
              <Card key={r.opportunity_id} className="overflow-hidden p-0">
                <div className="relative h-36 w-full overflow-hidden bg-slate-100 dark:bg-slate-900">
                  <img
                    src={opportunity.cover_image || getCategoryImage(opportunity.category)}
                    alt={r.opportunity_title}
                    loading="lazy"
                    className="h-full w-full object-cover"
                    onError={(event) => { event.currentTarget.src = getCategoryImage(opportunity.category); }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 via-ink-950/20 to-transparent" />
                  <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-ink-900">{opportunity.category || "Opportunity"}</span>
                      {opportunity.is_demo && <span className="rounded-full bg-amber-400/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-amber-950">Demo</span>}
                    </div>
                    <span className={`shrink-0 rounded-xl px-2.5 py-1.5 text-sm font-extrabold backdrop-blur ${r.match_percentage >= 80 ? "bg-emerald-500/95 text-ink-950" : r.match_percentage >= 60 ? "bg-sky-500/95 text-white" : "bg-amber-400/95 text-amber-950"}`}>
                      {Math.round(r.match_percentage)}%
                    </span>
                  </div>
                  <div className="absolute inset-x-3 bottom-3 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-white">
                    <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{opportunity.location || "Location flexible"}</span>
                    <span className="h-1 w-1 rounded-full bg-white/50" />
                    <span className="inline-flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" />{formatDate(opportunity.start_date)}</span>
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-emerald-700 dark:text-emerald-400">{r.organization_name || opportunity.organization_name}</p>
                      <h2 className="mt-1 text-lg font-bold leading-snug text-slate-900 dark:text-white">{r.opportunity_title}</h2>
                    </div>
                    <Badge tone={scoreTone(r.match_percentage)}>{r.match_category}</Badge>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <Badge tone="slate">{opportunity.mode || "on-site"}</Badge>
                    {opportunity.application_deadline && <Badge tone="slate">Apply by {formatDate(opportunity.application_deadline)}</Badge>}
                    {r.has_schedule_conflict && <Badge tone="rose">Schedule conflict</Badge>}
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-x-5 gap-y-2.5 text-xs">
                    <Factor label="Skills" value={r.breakdown?.skills ?? 0} />
                    <Factor label="Interests" value={r.interest_compatibility ?? 0} />
                    <Factor label="Availability" value={r.availability_compatibility ?? 0} />
                    <Factor label="Experience" value={r.experience_compatibility ?? 0} />
                    <Factor label="Location" value={r.location_compatibility ?? 0} />
                    <Factor label="Preferences" value={r.preference_compatibility ?? 0} />
                  </div>

                  <div className="mt-4 rounded-xl bg-emerald-50/70 p-3 text-sm text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
                    <p className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider"><Sparkles className="w-3.5 h-3.5" />Why this fits you</p>
                    {r.explanation}
                  </div>

                  <div className="mt-3 grid gap-3 text-xs sm:grid-cols-2">
                    <div>
                      <p className="mb-1 font-semibold text-slate-700 dark:text-slate-200">Matched skills</p>
                      <div className="flex flex-wrap gap-1">{r.matched_skills?.length ? r.matched_skills.map((s: string) => <Badge key={s} tone="emerald">{s}</Badge>) : <span className="text-slate-400">None listed</span>}</div>
                    </div>
                    <div>
                      <p className="mb-1 font-semibold text-slate-700 dark:text-slate-200">Skills to build</p>
                      <div className="flex flex-wrap gap-1">{r.missing_skills?.length ? r.missing_skills.map((s: string) => <Badge key={s} tone="amber">{s}</Badge>) : <span className="text-slate-400">No missing required skills</span>}</div>
                    </div>
                  </div>

                  {r.has_schedule_conflict && <p className="mt-3 flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-950/40"><AlertTriangle className="w-3.5 h-3.5" />{r.schedule_conflict_note}</p>}
                  {r.improvement_suggestions?.length > 0 && <p className="mt-2 flex items-start gap-1.5 text-xs text-slate-500"><CheckCircle2 className="mt-0.5 w-3.5 h-3.5 text-emerald-600" />{r.improvement_suggestions[0]}</p>}

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex gap-2">
                      <Link to={`/opportunities/${r.opportunity_id}`} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700">View & apply<ArrowUpRight className="w-3.5 h-3.5" /></Link>
                      <button onClick={() => toggleSave(r.opportunity_id)} className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition ${saved.includes(r.opportunity_id) ? "border-amber-300 text-amber-600" : "border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-300"}`}><Star className="w-3.5 h-3.5" fill={saved.includes(r.opportunity_id) ? "currentColor" : "none"} />{saved.includes(r.opportunity_id) ? "Saved" : "Save"}</button>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-400"><Wrench className="w-3 h-3" />Updated from live data</span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Factor({ label, value }: { label: string; value: number }) {
  return <div><div className="flex justify-between"><span className="text-slate-500">{label}</span><span className="font-semibold text-slate-700 dark:text-slate-200">{Math.round(value)}%</span></div><Progress value={value} className="mt-1" /></div>;
}
