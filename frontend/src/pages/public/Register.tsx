import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  HeartHandshake,
  Loader2,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { useToast } from "../../components/Toast";

const roles = [
  {
    value: "volunteer",
    title: "Volunteer",
    description: "Discover events, get matched and build verified experience.",
    icon: HeartHandshake,
  },
  {
    value: "ngo",
    title: "Organizer",
    description: "Post concerts, fests, campaigns and manage your volunteer crew.",
    icon: CalendarDays,
  },
];

export default function Register() {
  const { register } = useAuth();
  const { push } = useToast();
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get("role") === "ngo" ? "ngo" : "volunteer";
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    role: initialRole,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const user = await register(form);
      push("Account created successfully", "success");
      nav(user.role === "volunteer" ? "/volunteer/profile?onboarding=1" : `/${user.role}`);
    } catch (err: any) {
      setError(err.message || "Registration failed");
      push(err.message || "Registration failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative overflow-hidden bg-[#F7F9F8] dark:bg-slate-950">
      <div className="pointer-events-none absolute inset-0 mesh-emerald opacity-40 dark:opacity-20" />
      <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_1.05fr] lg:items-center lg:px-8 lg:py-20">
        <div className="hidden lg:block">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3.5 py-1.5 text-xs font-bold text-emerald-700 shadow-sm dark:border-emerald-900 dark:bg-slate-900 dark:text-emerald-300">
            <Sparkles className="h-3.5 w-3.5" /> Free for volunteers and organizers
          </span>
          <h1 className="display mt-5 text-4xl font-extrabold leading-tight text-ink-900 dark:text-white">
            One account.
            <br />
            Every kind of
            <span className="text-emerald-600"> moment.</span>
          </h1>
          <p className="mt-4 max-w-md text-slate-600 dark:text-slate-300">
            Join as a volunteer to find your people and your purpose, or as an organizer to build
            a crew for your next concert, fest, campaign or cause.
          </p>
          <div className="mt-8 space-y-3">
            {[
              "Explainable AI matches based on your real profile",
              "Apply, get scheduled and track verified hours",
              "Organizer tools for applications, tasks and analytics",
            ].map((line) => (
              <p key={line} className="flex items-start gap-2.5 text-sm font-medium text-slate-700 dark:text-slate-300">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                {line}
              </p>
            ))}
          </div>
          <div className="mt-8 flex items-center gap-4 rounded-2xl border border-slate-200 bg-white/80 p-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/70">
            <div className="flex -space-x-2">
              {["from-emerald-400 to-teal-500", "from-sky-400 to-blue-600", "from-amber-300 to-orange-500"].map((gradient, index) => (
                <span
                  key={gradient}
                  className={`grid h-9 w-9 place-items-center rounded-full border-2 border-white bg-gradient-to-br ${gradient} text-[10px] font-bold text-white dark:border-slate-900`}
                >
                  {["AS", "NS", "AK"][index]}
                </span>
              ))}
            </div>
            <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              <span className="font-bold text-ink-900 dark:text-white">Volunteers, students and event crews</span>
              <br />
              already discovering opportunities on the platform.
            </p>
          </div>
        </div>

        <div>
          <div className="mb-6 flex items-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-ink-950 text-emerald-400">
              <HeartHandshake className="h-5 w-5" />
            </span>
            <span className="font-display text-lg font-extrabold tracking-tight text-ink-900 dark:text-white">
              VolunteerMatch <span className="text-emerald-600">AI</span>
            </span>
          </div>

          <form
            onSubmit={submit}
            className="space-y-5 rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900 sm:p-8"
          >
            <div>
              <h2 className="text-2xl font-extrabold text-ink-900 dark:text-white">Create your account</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Pick how you want to show up. You can explore first and complete your profile later.
              </p>
            </div>

            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
                {error}
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              {roles.map((role) => {
                const active = form.role === role.value;
                return (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => set("role", role.value)}
                    className={`rounded-2xl border p-4 text-left transition ${
                      active
                        ? "border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-100 dark:border-emerald-500 dark:bg-emerald-950/30 dark:ring-emerald-900/40"
                        : "border-slate-200 hover:border-emerald-200 dark:border-slate-700 dark:hover:border-emerald-800"
                    }`}
                  >
                    <role.icon className={`h-5 w-5 ${active ? "text-emerald-600" : "text-slate-400"}`} />
                    <p className="mt-2.5 text-sm font-bold text-ink-900 dark:text-white">{role.title}</p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                      {role.description}
                    </p>
                  </button>
                );
              })}
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                {form.role === "ngo" ? "Organization or event team name" : "Full name"}
              </label>
              <input
                value={form.full_name}
                onChange={(event) => set("full_name", event.target.value)}
                required
                placeholder={form.role === "ngo" ? "NCR Live Events" : "Your name"}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-emerald-900/40"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(event) => set("email", event.target.value)}
                required
                placeholder="you@example.com"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-emerald-900/40"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                Password
              </label>
              <input
                type="password"
                minLength={6}
                value={form.password}
                onChange={(event) => set("password", event.target.value)}
                required
                placeholder="At least 6 characters"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-emerald-900/40"
              />
            </div>

            <button
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              {form.role === "ngo" ? "Create organizer account" : "Create volunteer account"}
            </button>

            <p className="text-center text-sm text-slate-500 dark:text-slate-400">
              Already registered?{" "}
              <Link to="/login" className="font-bold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400">
                Sign in
              </Link>
            </p>

            <p className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
              <Users className="h-3.5 w-3.5" /> Built for volunteers, organizers and community teams
            </p>
          </form>

          <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 lg:hidden">
            <Building2 className="h-3.5 w-3.5" /> Organizing an event? Choose the Organizer role above.
          </p>
        </div>
      </div>
    </div>
  );
}
