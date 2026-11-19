import {
  ArrowRight,
  BarChart3,
  Building2,
  HeartHandshake,
  Landmark,
  Lock,
  Music2,
  Sparkles,
  Target,
  Trophy,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";

const organizers = [
  { icon: Music2, label: "Concerts & festivals" },
  { icon: Building2, label: "NGOs & charities" },
  { icon: Landmark, label: "Government & civic" },
  { icon: Trophy, label: "Sports & marathons" },
  { icon: Users, label: "Colleges & communities" },
];

const pillars = [
  {
    icon: Target,
    title: "One place for every kind of event",
    text: "VolunteerMatch AI is a universal discovery and coordination platform for concerts, college fests, cultural events, carnivals, government campaigns, sports events, summits and social causes.",
  },
  {
    icon: Sparkles,
    title: "Explainable AI matching",
    text: "Recommendations are ranked with a transparent weighted score across skills, interests, availability, experience, location and preferences. Every match shows why it works.",
  },
  {
    icon: Lock,
    title: "Trust and role-based access",
    text: "JWT authentication, hashed passwords, ownership checks and validated APIs separate volunteer, organizer and admin workspaces.",
  },
  {
    icon: BarChart3,
    title: "Impact you can verify",
    text: "Applications, schedules, tasks and verified participation hours connect the whole journey — from a first click to a measurable contribution.",
  },
];

export default function About() {
  return (
    <div className="overflow-hidden bg-[#F7F9F8] dark:bg-slate-950">
      <section className="relative overflow-hidden bg-ink-950 text-white">
        <div className="pointer-events-none absolute inset-0 mesh-emerald opacity-80" />
        <div className="pointer-events-none absolute inset-0 hero-grid opacity-40" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">
            About the platform
          </p>
          <h1 className="display mt-4 max-w-3xl text-4xl font-extrabold leading-tight sm:text-5xl">
            Volunteer coordinating for every kind of moment.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
            VolunteerMatch AI is an academic MCA AI Fundamentals project by Team Cause Crew. It
            connects people who want to show up with the organizers who make events happen — and
            supports the whole journey from discovery to verified participation.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-2">
            {organizers.map((item) => (
              <span
                key={item.label}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1.5 text-xs font-medium text-slate-200 backdrop-blur"
              >
                <item.icon className="h-3.5 w-3.5 text-emerald-300" />
                {item.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-5 sm:grid-cols-2">
          {pillars.map((pillar) => (
            <div
              key={pillar.title}
              className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-600 text-white">
                <pillar.icon className="h-5 w-5" />
              </span>
              <h2 className="mt-4 text-lg font-bold text-ink-900 dark:text-white">{pillar.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {pillar.text}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 sm:p-8">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-400">
              Built end to end
            </p>
            <h2 className="mt-2 text-2xl font-extrabold text-ink-900 dark:text-white">
              A working full-stack prototype, not a mockup.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              The project pairs a React + TypeScript front end with a FastAPI + SQLAlchemy
              backend. Role-based routes, explainable matching, application review, scheduling,
              tasks, participation verification, feedback, analytics and an assistant are all
              backed by live APIs and a seeded demo database.
            </p>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {[
                "FastAPI · SQLAlchemy · SQLite",
                "React · Vite · TypeScript · Tailwind",
                "JWT auth with three roles",
                "Pytest-tested API workflows",
              ].map((line) => (
                <p key={line} className="rounded-lg bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 dark:bg-slate-950/60 dark:text-slate-300">
                  {line}
                </p>
              ))}
            </div>
          </div>

          <div className="rounded-[1.5rem] bg-ink-950 p-6 text-white sm:p-8">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300">
              Team Cause Crew
            </p>
            <h2 className="mt-2 text-xl font-extrabold">MCA AI Fundamentals project</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              Arpit Singh (team lead), Anshika Sharma, Archita Katiyar, Arjun Singh and Aditya.
            </p>
            <div className="mt-6 border-t border-white/10 pt-4 text-xs leading-relaxed text-slate-400">
              All seeded listings are demo data created for this academic prototype and are not
              confirmed real-world events.
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 rounded-[1.5rem] border border-emerald-200/70 bg-emerald-50/70 p-6 text-center dark:border-emerald-900/60 dark:bg-emerald-950/20 sm:flex-row sm:text-left">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-600 text-white">
              <HeartHandshake className="h-5 w-5" />
            </span>
            <div>
              <p className="font-bold text-ink-900 dark:text-white">Ready to find your place?</p>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Explore live opportunities or bring your own event to the platform.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <Link
              to="/opportunities"
              className="inline-flex items-center gap-1.5 rounded-xl bg-ink-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 dark:bg-emerald-500 dark:text-ink-950 dark:hover:bg-emerald-400"
            >
              Explore <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/register?role=ngo"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              Become an organizer
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
