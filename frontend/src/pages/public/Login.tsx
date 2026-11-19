import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  HeartHandshake,
  Loader2,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { useToast } from "../../components/Toast";

const demoAccounts = [
  {
    label: "Volunteer",
    email: "volunteer@volunteermatch.ai",
    password: "Volunteer@123",
    hint: "Discover events and track applications",
    icon: Users,
  },
  {
    label: "Organizer",
    email: "events@volunteermatch.ai",
    password: "Ngo@123",
    hint: "NCR Live Events organizer workspace",
    icon: CalendarDays,
  },
  {
    label: "Nonprofit",
    email: "ngo1@volunteermatch.ai",
    password: "Ngo@123",
    hint: "Udaan Welfare Foundation",
    icon: HeartHandshake,
  },
  {
    label: "Admin",
    email: "admin@volunteermatch.ai",
    password: "Admin@123",
    hint: "Platform administration",
    icon: ShieldCheck,
  },
];

export default function Login() {
  const { login } = useAuth();
  const { push } = useToast();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const user = await login(email.trim(), password);
      push(`Welcome back, ${user.full_name}`, "success");
      nav(`/${user.role}`);
    } catch (err: any) {
      setError(err.message || "Login failed");
      push(err.message || "Login failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const fill = (nextEmail: string, nextPassword: string) => {
    setEmail(nextEmail);
    setPassword(nextPassword);
  };

  return (
    <div className="relative overflow-hidden bg-[#F7F9F8] dark:bg-slate-950">
      <div className="pointer-events-none absolute inset-0 mesh-emerald opacity-40 dark:opacity-20" />
      <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_1fr] lg:items-center lg:px-8 lg:py-20">
        <div className="hidden overflow-hidden rounded-[2rem] bg-ink-950 text-white lg:block">
          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=85"
              alt="Concert crowd with volunteers"
              className="h-[280px] w-full object-cover opacity-75"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/30 to-transparent" />
            <div className="absolute inset-x-6 bottom-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300">
                VolunteerMatch AI
              </p>
              <p className="mt-1.5 text-2xl font-extrabold leading-tight">
                Your next great story starts with showing up.
              </p>
            </div>
          </div>
          <div className="p-7">
            <p className="text-sm leading-relaxed text-slate-300">
              Pick up where you left off — whether you are applying to festivals, managing a
              campaign, or verifying the impact of your crew.
            </p>
            <div className="mt-6 grid gap-3 text-xs text-slate-300">
              <p className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-300" /> Explainable AI recommendations
              </p>
              <p className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-emerald-300" /> Applications, schedules and event-day tasks
              </p>
              <p className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-300" /> Verified participation hours
              </p>
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-md lg:max-w-none">
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
            className="space-y-4 rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-soft dark:border-slate-800 dark:bg-slate-900 sm:p-8"
          >
            <div>
              <h1 className="text-2xl font-extrabold text-ink-900 dark:text-white">Welcome back</h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Sign in to your volunteer, organizer or admin workspace.
              </p>
            </div>

            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
                {error}
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
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
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-emerald-900/40"
              />
            </div>

            <button
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              Sign in
            </button>

            <p className="text-center text-sm text-slate-500 dark:text-slate-400">
              New here?{" "}
              <Link to="/register" className="font-bold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400">
                Create an account
              </Link>
            </p>
          </form>

          <div className="mt-5 rounded-[1.5rem] border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                Demo accounts (development)
              </p>
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                Seeded
              </span>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {demoAccounts.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => fill(account.email, account.password)}
                  className="group rounded-xl border border-slate-200 bg-slate-50 p-3 text-left transition hover:border-emerald-300 hover:bg-emerald-50/60 dark:border-slate-800 dark:bg-slate-950/60 dark:hover:border-emerald-900 dark:hover:bg-emerald-950/20"
                >
                  <span className="flex items-center gap-1.5 text-[11px] font-bold text-ink-900 dark:text-white">
                    <account.icon className="h-3.5 w-3.5 text-emerald-600" />
                    {account.label}
                  </span>
                  <span className="mt-1 block truncate text-[10px] text-slate-500 dark:text-slate-400">
                    {account.email}
                  </span>
                  <span className="mt-0.5 block text-[10px] font-medium text-slate-400">
                    {account.hint}
                  </span>
                </button>
              ))}
            </div>
            <p className="mt-3 text-[10px] leading-relaxed text-slate-400">
              Click a card to fill the form, then press Sign in. Organizer password is{" "}
              <span className="font-semibold">Ngo@123</span>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
