import {
  ArrowRight,
  BarChart3,
  CalendarCheck,
  CheckCircle2,
  ClipboardCheck,
  Compass,
  Search,
  Sparkles,
  UserPlus,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";

const volunteerSteps = [
  {
    icon: Search,
    title: "Discover",
    text: "Browse concerts, college fests, cultural events, marathons, campaigns and causes. Filter by category, location, date, skills and availability.",
  },
  {
    icon: UserPlus,
    title: "Create your profile",
    text: "Add your skills, interests, experience, availability, preferred categories and remote preference.",
  },
  {
    icon: Sparkles,
    title: "Connect",
    text: "See ranked, explainable matches with factor-level scores, then apply to the opportunities that fit your life.",
  },
  {
    icon: ClipboardCheck,
    title: "Participate",
    text: "Complete event-day tasks, build a schedule, receive verified hours and leave feedback after the event.",
  },
];

const organizerSteps = [
  {
    icon: CalendarCheck,
    title: "Post your event",
    text: "Publish a concert, fest, civic drive, conference, marathon or community initiative with a cover image.",
  },
  {
    icon: Users,
    title: "Set requirements",
    text: "Define skills, shifts, capacity, location, mode and application deadlines.",
  },
  {
    icon: CheckCircle2,
    title: "Review applications",
    text: "Approve or decline applicants with capacity checks and duplicate protection.",
  },
  {
    icon: BarChart3,
    title: "Coordinate and verify",
    text: "Assign tasks, schedule volunteers, verify participation hours and watch your dashboard update.",
  },
];

const scoring = [
  { label: "Skills", weight: 35 },
  { label: "Interests", weight: 20 },
  { label: "Availability", weight: 20 },
  { label: "Experience", weight: 10 },
  { label: "Location", weight: 10 },
  { label: "Preferences", weight: 5 },
];

function Step({ step, index, total }: { step: { icon: any; title: string; text: string }; index: number; total: number }) {
  return (
    <div className="relative flex gap-4">
      <div className="flex flex-col items-center">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
          <step.icon className="h-5 w-5" />
        </span>
        {index < total - 1 && <span className="mt-2 h-full w-px bg-slate-200 dark:bg-slate-800" />}
      </div>
      <div className="pb-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
          Step {index + 1}
        </p>
        <h3 className="mt-0.5 font-bold text-ink-900 dark:text-white">{step.title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{step.text}</p>
      </div>
    </div>
  );
}

export default function HowItWorks() {
  return (
    <div className="overflow-hidden bg-[#F7F9F8] dark:bg-slate-950">
      <section className="relative overflow-hidden bg-ink-950 text-white">
        <div className="pointer-events-none absolute inset-0 mesh-emerald opacity-80" />
        <div className="pointer-events-none absolute inset-0 hero-grid opacity-40" />
        <div className="relative mx-auto max-w-5xl px-4 py-20 text-center sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">
            How it works
          </p>
          <h1 className="display mx-auto mt-4 max-w-3xl text-4xl font-extrabold leading-tight sm:text-5xl">
            One workflow. Every kind of event. Three roles.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-300">
            Whether you are showing up for a cause or running a festival, the platform keeps
            discovery, applications, scheduling and verified impact in one place.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-400">
                  For volunteers
                </p>
                <h2 className="mt-1 text-2xl font-extrabold text-ink-900 dark:text-white">
                  Find your people. Find your purpose.
                </h2>
              </div>
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                <Compass className="h-6 w-6" />
              </span>
            </div>
            <div className="mt-7">
              {volunteerSteps.map((step, index) => (
                <Step key={step.title} step={step} index={index} total={volunteerSteps.length} />
              ))}
            </div>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
            >
              Start volunteering <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="rounded-[1.75rem] bg-ink-950 p-6 text-white shadow-soft sm:p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300">
                  For organizers
                </p>
                <h2 className="mt-1 text-2xl font-extrabold">Build your crew, not a spreadsheet.</h2>
              </div>
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/10 text-emerald-300">
                <CalendarCheck className="h-6 w-6" />
              </span>
            </div>
            <div className="mt-7">
              {organizerSteps.map((step, index) => (
                <div key={step.title} className="relative flex gap-4">
                  <div className="flex flex-col items-center">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/10 text-emerald-300">
                      <step.icon className="h-5 w-5" />
                    </span>
                    {index < organizerSteps.length - 1 && (
                      <span className="mt-2 h-full w-px bg-white/10" />
                    )}
                  </div>
                  <div className="pb-6">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                      Step {index + 1}
                    </p>
                    <h3 className="mt-0.5 font-bold text-white">{step.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-slate-400">{step.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link
              to="/register?role=ngo"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-ink-950 transition hover:bg-emerald-400"
            >
              Become an organizer <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="mt-6 rounded-[1.75rem] border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-400">
                Under the hood
              </p>
              <h2 className="mt-2 text-2xl font-extrabold text-ink-900 dark:text-white">
                Matching you can actually understand.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                The engine scores every open opportunity against the volunteer's real profile.
                Matched skills, missing skills, availability compatibility, location fit and
                preference alignment are all returned with the score — plus suggestions to improve
                it.
              </p>
              <div className="mt-5 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                {[
                  "No random or fabricated match percentages",
                  "Schedule conflict warnings before you commit",
                  "Category and capacity checks when you apply",
                ].map((line) => (
                  <p key={line} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    {line}
                  </p>
                ))}
              </div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-5 dark:bg-slate-950/60">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                  Weighted score
                </p>
                <span className="rounded-full bg-emerald-600 px-2.5 py-1 text-[10px] font-bold text-white">
                  100 points
                </span>
              </div>
              <div className="mt-4 space-y-3.5">
                {scoring.map((factor) => (
                  <div key={factor.label}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-600 dark:text-slate-300">{factor.label}</span>
                      <span className="font-bold text-ink-900 dark:text-white">{factor.weight}%</span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                        style={{ width: `${factor.weight * (100 / 35)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-[1.5rem] border border-slate-200 bg-white p-6 text-center dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:text-left">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Ready to try the full flow? Demo accounts are available on the sign-in page.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Link
              to="/opportunities"
              className="rounded-xl bg-ink-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 dark:bg-emerald-500 dark:text-ink-950 dark:hover:bg-emerald-400"
            >
              Explore opportunities
            </Link>
            <Link
              to="/login"
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 dark:border-slate-700 dark:text-slate-200"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
