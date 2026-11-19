import React, { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import {
  ArrowUpRight,
  HeartHandshake,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Sparkles,
  Sun,
  X,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useDarkMode } from '../hooks/useDarkMode';

const navItems = [
  { to: '/opportunities', label: 'Discover' },
  { to: '/how-it-works', label: 'How it works' },
  { to: '/register?role=ngo', label: 'For organizers' },
  { to: '/assistant', label: 'AI assistant' },
];

export function PublicLayout() {
  const { user, logout } = useAuth();
  const { dark, toggle } = useDarkMode();
  const [open, setOpen] = useState(false);
  const dashboard = user ? `/${user.role}` : '/login';
  const initials = (user?.full_name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F9F8] dark:bg-slate-950">
      {/* Slim announcement strip */}
      <div className="bg-ink-950 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2 text-[11px] sm:px-6 lg:px-8">
          <p className="inline-flex items-center gap-2 text-slate-300">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-pulse-dot rounded-full bg-emerald-400" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            Now onboarding volunteers and organizers for the 2026 event season
          </p>
          <Link
            to="/register?role=ngo"
            className="hidden items-center gap-1 font-semibold text-emerald-300 hover:text-emerald-200 sm:inline-flex"
          >
            List your event <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/85">
        <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex shrink-0 items-center gap-2.5" onClick={() => setOpen(false)}>
            <span className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-xl bg-ink-950 text-emerald-400 shadow-sm">
              <HeartHandshake className="h-5 w-5" />
              <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-emerald-500/70 blur-[2px]" />
            </span>
            <span className="font-display text-[15px] font-extrabold tracking-tight text-ink-900 dark:text-white">
              VolunteerMatch <span className="text-emerald-600 dark:text-emerald-400">AI</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-full px-3.5 py-2 text-[13px] font-semibold transition ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-ink-900 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={toggle}
              aria-label="Toggle theme"
              className="grid h-9 w-9 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900"
            >
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {user ? (
              <>
                <Link
                  to={dashboard}
                  className="hidden items-center gap-2 rounded-full bg-ink-950 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-emerald-600 dark:bg-emerald-500 dark:text-ink-950 dark:hover:bg-emerald-400 sm:inline-flex"
                >
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  Dashboard
                </Link>
                <span className="hidden h-9 w-9 place-items-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 sm:grid">
                  {initials || 'V'}
                </span>
                <button
                  onClick={logout}
                  aria-label="Log out"
                  className="grid h-9 w-9 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-rose-600 dark:text-slate-300 dark:hover:bg-slate-900"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden rounded-full px-3.5 py-2 text-[13px] font-semibold text-slate-600 transition hover:text-ink-900 dark:text-slate-300 dark:hover:text-white sm:inline-flex"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-[13px] font-bold text-white shadow-sm transition hover:bg-emerald-700 dark:bg-emerald-500 dark:text-ink-950 dark:hover:bg-emerald-400"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Join free
                </Link>
              </>
            )}

            <button
              onClick={() => setOpen((value) => !value)}
              aria-label="Toggle navigation"
              aria-expanded={open}
              className="grid h-9 w-9 place-items-center rounded-full text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900 lg:hidden"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {open && (
          <div className="animate-fade-in border-t border-slate-200 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-950 lg:hidden">
            <nav className="space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `block rounded-xl px-3 py-2.5 text-sm font-semibold ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                        : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
              <NavLink
                to="/about"
                onClick={() => setOpen(false)}
                className="block rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900"
              >
                About
              </NavLink>
              {user ? (
                <Link
                  to={dashboard}
                  onClick={() => setOpen(false)}
                  className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-ink-950 px-3 py-2.5 text-sm font-bold text-white dark:bg-emerald-500 dark:text-ink-950"
                >
                  <LayoutDashboard className="h-4 w-4" /> Go to dashboard
                </Link>
              ) : (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <Link
                    to="/login"
                    onClick={() => setOpen(false)}
                    className="rounded-xl border border-slate-300 px-3 py-2.5 text-center text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200"
                  >
                    Log in
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setOpen(false)}
                    className="rounded-xl bg-emerald-600 px-3 py-2.5 text-center text-sm font-bold text-white"
                  >
                    Join free
                  </Link>
                </div>
              )}
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
            <div>
              <Link to="/" className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-ink-950 text-emerald-400">
                  <HeartHandshake className="h-5 w-5" />
                </span>
                <span className="font-display text-[15px] font-extrabold text-ink-900 dark:text-white">
                  VolunteerMatch <span className="text-emerald-600 dark:text-emerald-400">AI</span>
                </span>
              </Link>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                The volunteer discovery and event coordination platform for concerts, college
                fests, cultural events, marathons, campaigns and community causes.
              </p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-[11px] font-medium text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                MCA AI Fundamentals project · Cause Crew
              </div>
            </div>

            <FooterColumn
              title="Explore"
              links={[
                { label: 'All opportunities', to: '/opportunities' },
                { label: 'Concerts & festivals', to: `/opportunities?category=${encodeURIComponent('Concerts & Music Festivals')}` },
                { label: 'College fests', to: `/opportunities?category=${encodeURIComponent('College Fests')}` },
                { label: 'Sports & marathons', to: `/opportunities?category=${encodeURIComponent('Sports & Marathons')}` },
                { label: 'NGOs & social causes', to: `/opportunities?category=${encodeURIComponent('NGOs & Social Causes')}` },
              ]}
            />
            <FooterColumn
              title="For organizers"
              links={[
                { label: 'Post an opportunity', to: '/register?role=ngo' },
                { label: 'Organizer workspace', to: '/login' },
                { label: 'How it works', to: '/how-it-works' },
                { label: 'AI assistant', to: '/assistant' },
              ]}
            />
            <FooterColumn
              title="Platform"
              links={[
                { label: 'About', to: '/about' },
                { label: 'Volunteer login', to: '/login' },
                { label: 'Create an account', to: '/register' },
                { label: 'Admin console', to: '/admin' },
              ]}
            />
          </div>

          <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-slate-200 pt-6 text-xs text-slate-400 dark:border-slate-800 sm:flex-row sm:items-center">
            <p>© {new Date().getFullYear()} VolunteerMatch AI. Built for smarter community participation.</p>
            <p className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              Seeded listings are demo data for this academic prototype.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: Array<{ label: string; to: string }>;
}) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">{title}</p>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              to={link.to}
              className="text-sm font-medium text-slate-600 transition hover:text-emerald-700 dark:text-slate-300 dark:hover:text-emerald-400"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
