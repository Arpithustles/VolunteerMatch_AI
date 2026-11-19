import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { api } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { useToast } from "../../components/Toast";
import { Spinner, ErrorState } from "../../components/UI";
import { getCategoryImage } from "../../data/eventCategories";

const formatDate = (value?: string | null) => {
  if (!value) return "TBD";
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const dateRange = (start?: string | null, end?: string | null) => {
  if (!start && !end) return "Dates to be announced";
  if (!end || start === end) return formatDate(start);
  return `${formatDate(start)} – ${formatDate(end)}`;
};

export default function OpportunityDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const { push } = useToast();
  const [opp, setOpp] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .get<any>(`/opportunities/${id}`)
      .then(setOpp)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const skills = useMemo(
    () =>
      (opp?.required_skills || "")
        .split(",")
        .map((skill: string) => skill.trim())
        .filter(Boolean),
    [opp?.required_skills],
  );
  const preferred = useMemo(
    () =>
      (opp?.preferred_skills || "")
        .split(",")
        .map((skill: string) => skill.trim())
        .filter(Boolean),
    [opp?.preferred_skills],
  );

  const apply = async () => {
    if (!user) {
      nav("/login");
      return;
    }
    if (user.role !== "volunteer") {
      push("Only volunteer accounts can apply to opportunities", "error");
      return;
    }
    setApplying(true);
    try {
      await api.post("/applications", { opportunity_id: Number(id) });
      push("Application submitted. You can track its status in Applications.", "success");
      nav("/volunteer/applications");
    } catch (e: any) {
      push(e.message || "Could not apply", "error");
    } finally {
      setApplying(false);
    }
  };

  if (loading) return <Spinner label="Loading opportunity..." />;
  if (error)
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <ErrorState message={error} />
      </div>
    );
  if (!opp) return null;

  const cover = opp.cover_image || getCategoryImage(opp.category);
  const spots = Math.max(
    0,
    Number(opp.volunteers_required || 0) - Number(opp.approved_count || 0),
  );
  const isOpen = opp.status === "open" && !opp.is_full;

  return (
    <div className="bg-[#F7F9F8] dark:bg-slate-950">
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <button
          onClick={() => nav(-1)}
          className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-ink-900 dark:text-slate-400 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> Back to opportunities
        </button>

        {/* Hero */}
        <div className="relative h-[320px] overflow-hidden rounded-[1.8rem] bg-ink-900 sm:h-[400px]">
          <img
            src={cover}
            alt=""
            className="h-full w-full object-cover"
            onError={(event) => {
              event.currentTarget.src = getCategoryImage(opp.category);
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/35 to-ink-950/10" />
          <div className="absolute inset-x-5 top-5 flex flex-wrap items-center gap-2 sm:inset-x-8 sm:top-7">
            <span className="rounded-full bg-white/95 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-900 shadow-sm">
              {opp.category}
            </span>
            <span className="rounded-full bg-white/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white capitalize backdrop-blur">
              {opp.mode}
            </span>
            {opp.is_demo && (
              <span className="rounded-full bg-amber-400 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-amber-950">
                Demo listing
              </span>
            )}
          </div>
          <div className="absolute inset-x-5 bottom-6 sm:inset-x-8 sm:bottom-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-300">
              {opp.organization_name || "Community organizer"}
            </p>
            <h1 className="display mt-2 max-w-3xl text-3xl font-extrabold leading-tight text-white sm:text-4xl lg:text-[2.9rem]">
              {opp.title}
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-200">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-emerald-300" />
                {opp.location || "Location TBD"}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4 text-emerald-300" />
                {dateRange(opp.start_date, opp.end_date)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-4 w-4 text-emerald-300" />
                {opp.volunteers_required} positions
              </span>
            </div>
          </div>
        </div>

        {opp.is_demo && (
          <p className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/80 px-3.5 py-2.5 text-xs text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300">
            <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
            This is a seeded demo listing for an academic prototype. It is not a confirmed
            real-world event and applications are stored only in the local demo database.
          </p>
        )}

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.55fr_1fr]">
          {/* Main content */}
          <div className="space-y-6">
            <section className="rounded-[1.5rem] border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 sm:p-7">
              <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-400">
                About this opportunity
              </h2>
              <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-slate-700 dark:text-slate-300">
                {opp.description}
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <Info
                  icon={<MapPin className="h-4 w-4" />}
                  label="Location"
                  value={opp.location || "TBD"}
                />
                <Info
                  icon={<CalendarDays className="h-4 w-4" />}
                  label="Dates"
                  value={dateRange(opp.start_date, opp.end_date)}
                />
                <Info
                  icon={<Clock3 className="h-4 w-4" />}
                  label="Working hours"
                  value={`${opp.working_hours || "Flexible"} · ${opp.available_days || "Flexible days"}`}
                />
                <Info
                  icon={<Users className="h-4 w-4" />}
                  label="Volunteers"
                  value={`${opp.approved_count || 0} approved of ${opp.volunteers_required}`}
                />
              </div>
            </section>

            <section className="rounded-[1.5rem] border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 sm:p-7">
              <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-400">
                What you will bring
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Required skills
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {skills.length > 0 ? (
                      skills.map((skill: string) => (
                        <span
                          key={skill}
                          className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                        >
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-slate-500">No specific skills required</span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Good to have
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {preferred.length > 0 ? (
                      preferred.map((skill: string) => (
                        <span
                          key={skill}
                          className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                        >
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-slate-500">Everyone is welcome</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-x-8 gap-y-3 border-t border-slate-100 pt-5 text-sm dark:border-slate-800">
                <p className="text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    Experience:
                  </span>{" "}
                  {opp.experience_required || "No prior experience needed"}
                </p>
                <p className="text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    Application deadline:
                  </span>{" "}
                  {opp.application_deadline ? formatDate(opp.application_deadline) : "Open until filled"}
                </p>
              </div>
            </section>

            <section className="rounded-[1.5rem] border border-emerald-200/70 bg-emerald-50/60 p-6 dark:border-emerald-900/60 dark:bg-emerald-950/20 sm:p-7">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-600 text-white">
                  <Sparkles className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-bold text-ink-900 dark:text-white">
                    Want a match score for this opportunity?
                  </h2>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                    Sign in as a volunteer to see how your skills, interests, availability and
                    location line up — with plain-language explanations and suggestions.
                  </p>
                  <Link
                    to={user ? "/volunteer/recommendations" : "/login"}
                    className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400"
                  >
                    {user ? "View AI recommendations" : "Sign in to see your fit"}{" "}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </section>
          </div>

          {/* Sticky apply panel */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                  Applications
                </p>
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${
                    isOpen
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                      : "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                  }`}
                >
                  {opp.is_full ? "Full" : opp.status}
                </span>
              </div>

              <p className="mt-4 text-3xl font-extrabold text-ink-900 dark:text-white">
                {spots > 0 ? spots : 0}
                <span className="ml-1.5 text-sm font-medium text-slate-400">
                  {spots === 1 ? "spot left" : "spots left"}
                </span>
              </p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round(
                        (Number(opp.approved_count || 0) /
                          Math.max(1, Number(opp.volunteers_required || 1))) *
                          100,
                      ),
                    )}%`,
                  }}
                />
              </div>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                {opp.approved_count || 0} of {opp.volunteers_required} positions approved
              </p>

              <div className="mt-5 space-y-2.5 rounded-xl bg-slate-50 p-4 text-sm dark:bg-slate-950/60">
                <Row label="Deadline" value={opp.application_deadline ? formatDate(opp.application_deadline) : "Open"} />
                <Row label="Commitment" value={opp.available_days || "Flexible"} />
                <Row label="Mode" value={opp.mode} capitalize />
              </div>

              <button
                onClick={apply}
                disabled={applying || opp.is_full || opp.status !== "open"}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {applying ? "Submitting..." : "Apply to participate"}
                <ArrowRight className="h-4 w-4" />
              </button>
              <p className="mt-3 flex items-start gap-1.5 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                {user
                  ? "Your application goes directly to the organizer for review."
                  : "You will be asked to sign in as a volunteer before applying."}
              </p>
            </div>

            <div className="mt-4 rounded-[1.5rem] border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                Organizer
              </p>
              <div className="mt-3 flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-ink-950 text-sm font-bold text-emerald-300">
                  {(opp.organization_name || "O").slice(0, 1)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-ink-900 dark:text-white">
                    {opp.organization_name || "Community organizer"}
                  </p>
                  <p className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                    <ShieldCheck className="h-3 w-3 text-emerald-600" /> Verified organizer account
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function Info({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-200 p-3.5 dark:border-slate-800">
      <div className="mt-0.5 text-emerald-600 dark:text-emerald-400">{icon}</div>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-[0.1em] text-slate-400">{label}</p>
        <p className="mt-0.5 truncate font-medium text-slate-800 dark:text-slate-200">{value}</p>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  capitalize,
}: {
  label: string;
  value?: string | null;
  capitalize?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-slate-400">{label}</span>
      <span
        className={`font-semibold text-slate-700 dark:text-slate-200 ${capitalize ? "capitalize" : ""}`}
      >
        {value || "—"}
      </span>
    </div>
  );
}
