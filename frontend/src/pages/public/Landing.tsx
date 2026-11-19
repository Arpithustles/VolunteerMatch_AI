import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Building2,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Compass,
  GraduationCap,
  HeartHandshake,
  Landmark,
  MapPin,
  Music2,
  Search,
  ShieldCheck,
  Sparkles,
  Trophy,
  UserPlus,
  Users,
  Wrench,
} from 'lucide-react';
import { api } from '../../api/client';
import { OpportunityCard, type OpportunityCardData } from '../../components/OpportunityCard';
import { EVENT_CATEGORIES } from '../../data/eventCategories';

type PublicStats = {
  volunteers: number;
  organizers: number;
  opportunities: number;
  verified_hours: number;
};

const numberFormat = new Intl.NumberFormat('en-IN');

const formatHeroDate = (value?: string | null) => {
  if (!value) return 'This season';
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime())
    ? value
    : parsed.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

const heroMain =
  'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1400&q=85';
const heroCampus =
  'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=700&q=80';
const heroRun =
  'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?auto=format&fit=crop&w=700&q=80';
const ctaImage =
  'https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=1600&q=80';

const organiserTypes = [
  { icon: Music2, label: 'Festivals & concerts' },
  { icon: GraduationCap, label: 'Colleges & universities' },
  { icon: Trophy, label: 'Sports & marathons' },
  { icon: Building2, label: 'NGOs & charities' },
  { icon: Landmark, label: 'Government & civic' },
  { icon: HeartHandshake, label: 'Community groups' },
];

const scoring = [
  { label: 'Skills', weight: 35 },
  { label: 'Interests', weight: 20 },
  { label: 'Availability', weight: 20 },
  { label: 'Experience', weight: 10 },
  { label: 'Location', weight: 10 },
  { label: 'Preferences', weight: 5 },
];

const volunteerSteps = [
  { icon: Compass, title: 'Discover', text: 'Explore concerts, festivals, marathons, campaigns and causes near you.' },
  { icon: UserPlus, title: 'Create your profile', text: 'Add your interests, skills, experience and availability in minutes.' },
  { icon: Sparkles, title: 'Connect', text: 'Get ranked, explainable matches and apply to the opportunities that fit.' },
  { icon: ClipboardCheck, title: 'Participate', text: 'Complete tasks, build verified experience and track your impact.' },
];

const organizerSteps = [
  { icon: CalendarCheck, title: 'Post your event', text: 'Publish an opportunity for a concert, fest, campaign or community drive.' },
  { icon: Users, title: 'Set requirements', text: 'Define skills, shift timings, volunteer capacity and deadlines.' },
  { icon: CheckCircle2, title: 'Review and approve', text: 'Manage applications in one place with capacity-aware approvals.' },
  { icon: BarChart3, title: 'Coordinate and verify', text: 'Assign tasks, build schedules and verify participation hours.' },
];

export default function Landing() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<PublicStats>({
    volunteers: 0,
    organizers: 0,
    opportunities: 0,
    verified_hours: 0,
  });
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [featured, setFeatured] = useState<OpportunityCardData[]>([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [search, setSearch] = useState({
    q: '',
    location: '',
    category: '',
    date_from: '',
    skills: '',
    availability: '',
  });

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api.get<PublicStats>('/analytics/public').catch(() => null),
      api.get<Array<{ name: string; count: number }>>('/analytics/categories').catch(() => []),
      api.get<{ items: OpportunityCardData[] }>('/opportunities?sort=deadline&page_size=20').catch(() => ({ items: [] })),
    ])
      .then(([publicStats, counts, listing]) => {
        if (cancelled) return;
        if (publicStats) {
          setStats({
            volunteers: publicStats.volunteers || 0,
            organizers: publicStats.organizers ?? publicStats.volunteers ?? 0,
            opportunities: publicStats.opportunities || 0,
            verified_hours: publicStats.verified_hours || 0,
          });
        }
        setCategoryCounts(
          Object.fromEntries((counts || []).map((entry) => [entry.name.toLowerCase(), entry.count])),
        );
        setFeatured(listing.items || []);
      })
      .finally(() => {
        if (!cancelled) setLoadingFeatured(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const featuredDisplay = useMemo(() => {
    const order = [
      'Concerts & Music Festivals',
      'College Fests',
      'Sports & Marathons',
      'Cultural Events',
      'Carnivals & Exhibitions',
      'Government Events',
      'Conferences & Summits',
      'NGOs & Social Causes',
      'Environmental Campaigns',
      'Workshops & Seminars',
      'Community Initiatives',
      'Political Events',
    ];
    const picked: OpportunityCardData[] = [];
    const seen = new Set<number>();
    for (const category of order) {
      const item = featured.find((entry) => entry.category === category && !seen.has(entry.id));
      if (item) {
        picked.push(item);
        seen.add(item.id);
      }
      if (picked.length >= 6) break;
    }
    for (const item of featured) {
      if (picked.length >= 6) break;
      if (!seen.has(item.id)) {
        picked.push(item);
        seen.add(item.id);
      }
    }
    return picked;
  }, [featured]);

  const featuredHero = featuredDisplay[0];
  const featuredSecondary =
    featuredDisplay.find((item) => item.category === 'College Fests') || featuredDisplay[1];

  const statsStrip = useMemo(
    () => [
      { label: 'Live opportunities', value: numberFormat.format(stats.opportunities) },
      { label: 'Organizer teams', value: numberFormat.format(stats.organizers) },
      { label: 'Volunteers onboard', value: numberFormat.format(stats.volunteers) },
      { label: 'Verified volunteer hours', value: numberFormat.format(stats.verified_hours) },
    ],
    [stats],
  );

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const params = new URLSearchParams();
    Object.entries(search).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    const query = params.toString();
    navigate(`/opportunities${query ? `?${query}` : ''}`);
  };

  return (
    <div className="overflow-hidden bg-[#F7F9F8] dark:bg-slate-950">
      {/* ------------------------------------------------------------------ */}
      {/* HERO                                                               */}
      {/* ------------------------------------------------------------------ */}
      <section className="relative overflow-hidden bg-ink-950 text-white">
        <div className="pointer-events-none absolute inset-0 mesh-emerald" />
        <div className="pointer-events-none absolute inset-0 hero-grid opacity-50" />
        <div className="pointer-events-none absolute -right-32 -top-40 h-[520px] w-[520px] rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-48 left-1/4 h-[420px] w-[420px] rounded-full bg-teal-400/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 pb-14 pt-14 sm:px-6 lg:px-8 lg:pb-16 lg:pt-20">
          <div className="grid items-center gap-14 lg:grid-cols-[1.04fr_0.96fr] lg:gap-10">
            <div className="animate-fade-up">
              <div className="inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1.5 text-xs font-medium text-emerald-100 backdrop-blur">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-pulse-dot rounded-full bg-emerald-400" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                Live now · {stats.opportunities || '20'} opportunities across every category
              </div>

              <h1 className="display mt-6 text-[2.85rem] font-extrabold leading-[0.98] sm:text-6xl lg:text-[4.35rem]">
                Be part of
                <br />
                <span className="bg-gradient-to-r from-emerald-300 via-emerald-400 to-teal-200 bg-clip-text text-transparent">
                  something bigger.
                </span>
              </h1>

              <p className="mt-5 text-base font-semibold text-white sm:text-lg">
                Find your people. Find your purpose. Make it happen.
              </p>
              <p className="mt-2 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
                From concerts and college festivals to cultural celebrations, marathons and
                community initiatives — discover opportunities to volunteer, contribute your
                skills and create unforgettable experiences.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  to="/opportunities"
                  className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3.5 text-sm font-bold text-ink-950 shadow-[0_16px_40px_-14px_rgba(16,185,129,0.65)] transition hover:-translate-y-0.5 hover:bg-emerald-400"
                >
                  Explore Opportunities <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/register?role=ngo"
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/[0.04] px-6 py-3.5 text-sm font-semibold text-white backdrop-blur transition hover:border-white/35 hover:bg-white/[0.08]"
                >
                  Become an Organizer
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-5">
                <div className="flex -space-x-2.5">
                  {[
                    ['AS', 'from-emerald-400 to-teal-500'],
                    ['NS', 'from-sky-400 to-blue-600'],
                    ['AK', 'from-amber-300 to-orange-500'],
                    ['RS', 'from-rose-400 to-pink-600'],
                  ].map(([initials, gradient]) => (
                    <span
                      key={initials}
                      className={`grid h-9 w-9 place-items-center rounded-full border-2 border-ink-950 bg-gradient-to-br ${gradient} text-[10px] font-bold text-white`}
                    >
                      {initials}
                    </span>
                  ))}
                  <span className="grid h-9 w-9 place-items-center rounded-full border-2 border-ink-950 bg-white/10 text-[10px] font-bold text-white">
                    +
                  </span>
                </div>
                <div className="text-xs leading-relaxed text-slate-400">
                  <p className="font-semibold text-slate-200">Built for every kind of volunteer</p>
                  <p>Students, professionals, first-timers and event crews.</p>
                </div>
              </div>
            </div>

            {/* Hero visual composition */}
            <div className="relative mx-auto w-full max-w-[520px] animate-fade-up animation-delay-150 lg:max-w-none">
              <div className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-white/5 shadow-[0_40px_100px_-35px_rgba(0,0,0,0.8)]">
                <img
                  src={heroMain}
                  alt="Volunteers and a crowd at a live music festival"
                  className="h-[390px] w-full object-cover sm:h-[500px] lg:h-[540px]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/25 to-transparent" />
                <div className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full bg-white/95 px-3.5 py-1.5 text-[11px] font-bold text-ink-900 shadow-lg">
                  <Music2 className="h-3.5 w-3.5 text-emerald-600" />
                  {featuredHero?.category || 'Concerts & music festivals'}
                </div>
                <div className="absolute inset-x-5 bottom-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300">
                    Featured opportunity
                  </p>
                  <Link
                    to={featuredHero ? `/opportunities/${featuredHero.id}` : '/opportunities'}
                    className="mt-1.5 block text-xl font-bold leading-snug text-white transition hover:text-emerald-200"
                  >
                    {featuredHero?.title || 'Join the crew behind the next big event'}
                  </Link>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-300">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" />
                      {featuredHero?.location || 'Delhi NCR'}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {formatHeroDate(featuredHero?.start_date)}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      {featuredHero?.volunteers_required || 40} positions
                    </span>
                  </div>
                </div>
              </div>

              {/* Floating campus card */}
              <div className="absolute -left-3 bottom-24 hidden w-[210px] animate-float rounded-2xl border border-white/60 bg-white p-3 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.55)] sm:block lg:-left-10">
                <div className="flex items-center gap-2.5">
                  <img
                    src={featuredSecondary?.cover_image || heroCampus}
                    alt=""
                    className="h-12 w-12 rounded-xl object-cover"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-bold text-ink-900">
                      {featuredSecondary?.title || 'College cultural fest crew'}
                    </p>
                    <p className="mt-0.5 text-[10px] font-medium text-slate-500">
                      {featuredSecondary?.location || 'Noida · this weekend'}
                    </p>
                  </div>
                </div>
                <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2">
                  <span className="text-[10px] font-semibold text-emerald-700">Now accepting applications</span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-emerald-600" />
                </div>
              </div>

              {/* Floating AI card */}
              <div className="absolute -right-2 top-16 hidden w-[190px] animate-float-slow rounded-2xl border border-emerald-300/20 bg-emerald-500 p-3.5 text-ink-950 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.65)] sm:block lg:-right-6">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.12em]">AI match preview</p>
                </div>
                <p className="mt-2 text-2xl font-extrabold leading-none">94%</p>
                <p className="mt-1 text-[11px] font-medium text-emerald-950/80">
                  Skills · availability · interests
                </p>
                <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-emerald-950/20">
                  <div className="h-full w-[94%] rounded-full bg-ink-950" />
                </div>
              </div>

              <div className="absolute -bottom-5 right-4 hidden items-center gap-2 rounded-full border border-white/15 bg-ink-900/80 px-4 py-2 text-[11px] font-medium text-slate-200 backdrop-blur sm:flex">
                <img src={heroRun} alt="" className="h-6 w-6 rounded-full object-cover" />
                Race-day crews, campus fests and causes — all in one place.
              </div>
            </div>
          </div>

          {/* Search */}
          <form
            onSubmit={submitSearch}
            className="relative mt-12 rounded-[1.75rem] border border-white/50 bg-white p-2.5 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.65)] dark:border-slate-700 dark:bg-slate-900 lg:mt-14"
          >
            <div className="grid gap-2 lg:grid-cols-[1.5fr_1fr_1fr_0.9fr_auto]">
              <label className="flex items-center gap-3 rounded-2xl px-4 py-3 transition hover:bg-slate-50 dark:hover:bg-slate-800/60">
                <Search className="h-5 w-5 shrink-0 text-emerald-600" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                    What
                  </span>
                  <input
                    value={search.q}
                    onChange={(event) => setSearch({ ...search, q: event.target.value })}
                    placeholder="Search concerts, fests, NGOs, events..."
                    className="mt-0.5 w-full border-0 bg-transparent p-0 text-sm font-medium text-ink-900 outline-none placeholder:text-slate-400 dark:text-white"
                  />
                </span>
              </label>

              <label className="flex items-center gap-3 rounded-2xl border-t border-slate-100 px-4 py-3 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60 lg:border-l lg:border-t-0">
                <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                    Where
                  </span>
                  <input
                    value={search.location}
                    onChange={(event) => setSearch({ ...search, location: event.target.value })}
                    placeholder="City or remote"
                    className="mt-0.5 w-full border-0 bg-transparent p-0 text-sm font-medium text-ink-900 outline-none placeholder:text-slate-400 dark:text-white"
                  />
                </span>
              </label>

              <label className="flex items-center gap-3 rounded-2xl border-t border-slate-100 px-4 py-3 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60 lg:border-l lg:border-t-0">
                <Sparkles className="h-4 w-4 shrink-0 text-slate-400" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                    Category
                  </span>
                  <select
                    value={search.category}
                    onChange={(event) => setSearch({ ...search, category: event.target.value })}
                    className="mt-0.5 w-full cursor-pointer appearance-none border-0 bg-transparent p-0 text-sm font-medium text-ink-900 outline-none dark:text-white"
                  >
                    <option value="">Any kind of event</option>
                    {EVENT_CATEGORIES.map((category) => (
                      <option key={category.name} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </span>
              </label>

              <label className="flex items-center gap-3 rounded-2xl border-t border-slate-100 px-4 py-3 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60 lg:border-l lg:border-t-0">
                <CalendarDays className="h-4 w-4 shrink-0 text-slate-400" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                    When
                  </span>
                  <input
                    type="date"
                    value={search.date_from}
                    onChange={(event) => setSearch({ ...search, date_from: event.target.value })}
                    className="mt-0.5 w-full border-0 bg-transparent p-0 text-sm font-medium text-ink-900 outline-none dark:text-white"
                  />
                </span>
              </label>

              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-ink-950 px-6 py-4 text-sm font-bold text-white transition hover:bg-emerald-600 dark:bg-emerald-500 dark:text-ink-950 dark:hover:bg-emerald-400"
              >
                <Search className="h-4 w-4" />
                Search
              </button>
            </div>

            <div className="mt-2 grid gap-2 border-t border-slate-100 px-1 pt-2 dark:border-slate-800 sm:grid-cols-2">
              <label className="flex items-center gap-2.5 rounded-xl bg-slate-50 px-3.5 py-2.5 transition focus-within:bg-emerald-50/60 dark:bg-slate-950/60 dark:focus-within:bg-emerald-950/20">
                <Wrench className="h-4 w-4 shrink-0 text-slate-400" />
                <input
                  value={search.skills}
                  onChange={(event) => setSearch({ ...search, skills: event.target.value })}
                  placeholder="Skills, e.g. event management, first aid"
                  className="w-full border-0 bg-transparent p-0 text-xs font-medium text-ink-900 outline-none placeholder:text-slate-400 dark:text-white"
                />
              </label>
              <label className="flex items-center gap-2.5 rounded-xl bg-slate-50 px-3.5 py-2.5 transition focus-within:bg-emerald-50/60 dark:bg-slate-950/60 dark:focus-within:bg-emerald-950/20">
                <Clock3 className="h-4 w-4 shrink-0 text-slate-400" />
                <input
                  value={search.availability}
                  onChange={(event) => setSearch({ ...search, availability: event.target.value })}
                  placeholder="Availability, e.g. Saturday, weekdays"
                  className="w-full border-0 bg-transparent p-0 text-xs font-medium text-ink-900 outline-none placeholder:text-slate-400 dark:text-white"
                />
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-2 px-3 pb-1 pt-3 lg:px-4">
              <span className="text-[11px] font-semibold text-slate-400">Popular:</span>
              {['Music festivals', 'College fests', 'Marathons', 'NGO causes', 'Remote'].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    if (tag === 'Remote') {
                      navigate('/opportunities?mode=remote');
                    } else {
                      const category =
                        tag === 'Music festivals'
                          ? 'Concerts & Music Festivals'
                          : tag === 'College fests'
                            ? 'College Fests'
                            : tag === 'Marathons'
                              ? 'Sports & Marathons'
                              : 'NGOs & Social Causes';
                      navigate(`/opportunities?category=${encodeURIComponent(category)}`);
                    }
                  }}
                  className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  {tag}
                </button>
              ))}
            </div>
          </form>

          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-6 border-t border-white/10 pt-7 sm:grid-cols-4">
            {statsStrip.map((stat) => (
              <div key={stat.label}>
                <p className="display text-2xl font-extrabold text-white sm:text-3xl">{stat.value}</p>
                <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Organizer types strip */}
      <section className="border-b border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-4 py-5 sm:px-6 lg:px-8">
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
            Built for
          </span>
          {organiserTypes.map((type) => (
            <span
              key={type.label}
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400"
            >
              <type.icon className="h-4 w-4 text-emerald-600" />
              {type.label}
            </span>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* CATEGORIES                                                         */}
      {/* ------------------------------------------------------------------ */}
      <section id="categories" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-400">
              Explore by moment
            </p>
            <h2 className="display mt-3 text-3xl font-extrabold text-ink-900 dark:text-white sm:text-4xl">
              There is a place for you in every kind of event.
            </h2>
            <p className="mt-3 text-slate-600 dark:text-slate-300">
              Whatever your interests, there is an event waiting for your contribution. Pick a
              world and see who needs a hand.
            </p>
          </div>
          <Link
            to="/opportunities"
            className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-emerald-400 hover:text-emerald-700 dark:border-slate-700 dark:text-slate-200"
          >
            View all opportunities <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {EVENT_CATEGORIES.map((category) => {
            const count = categoryCounts[category.name.toLowerCase()] || 0;
            return (
              <Link
                key={category.name}
                to={`/opportunities?category=${encodeURIComponent(category.name)}`}
                className="group relative h-60 overflow-hidden rounded-[1.4rem] bg-ink-900 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lift"
              >
                <img
                  src={category.image}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover opacity-90 transition duration-700 group-hover:scale-[1.06] group-hover:opacity-100"
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${category.tone} via-ink-950/20 to-transparent`} />
                <div className="absolute inset-x-4 top-4 flex items-center justify-between">
                  <span className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white backdrop-blur">
                    {count > 0 ? `${count} live` : 'Opening soon'}
                  </span>
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-white opacity-0 backdrop-blur transition group-hover:opacity-100">
                    <ArrowUpRight className="h-4 w-4" />
                  </span>
                </div>
                <div className="absolute inset-x-4 bottom-4">
                  <h3 className="text-lg font-extrabold leading-tight text-white">{category.name}</h3>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-white/75">
                    {category.description}
                  </p>
                  <span className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-300">
                    Explore <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* FEATURED                                                           */}
      {/* ------------------------------------------------------------------ */}
      <section className="border-y border-slate-200/80 bg-white py-20 dark:border-slate-800 dark:bg-slate-900 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-400">
                Handpicked opportunities
              </p>
              <h2 className="display mt-3 text-3xl font-extrabold text-ink-900 dark:text-white sm:text-4xl">
                Find your next opportunity.
              </h2>
              <p className="mt-3 text-slate-600 dark:text-slate-300">
                A mix of live opportunities from across the platform — from festival crews to
                weekend teaching and race-day teams.
              </p>
            </div>
            <Link
              to="/opportunities"
              className="inline-flex w-fit items-center gap-2 rounded-full bg-ink-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600 dark:bg-emerald-500 dark:text-ink-950 dark:hover:bg-emerald-400"
            >
              Browse everything <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-5 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/80 px-3.5 py-2.5 text-xs text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300">
            <span className="mt-0.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
            Listings marked <strong className="mx-1">Demo</strong> are seeded examples for this
            academic prototype. They are not confirmed real-world events.
          </div>

          <div className="mt-8">
            {loadingFeatured ? (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-[430px] animate-pulse rounded-[1.6rem] border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-800"
                  />
                ))}
              </div>
            ) : featuredDisplay.length > 0 ? (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {featuredDisplay.map((opportunity) => (
                  <OpportunityCard key={opportunity.id} opportunity={opportunity} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900">
                New opportunities will appear here as organizers publish them.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* AI MATCHING                                                        */}
      {/* ------------------------------------------------------------------ */}
      <section className="relative overflow-hidden bg-ink-950 text-white">
        <div className="pointer-events-none absolute inset-0 mesh-emerald opacity-70" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-24">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3.5 py-1.5 text-xs font-semibold text-emerald-300">
              <Sparkles className="h-3.5 w-3.5" />
              Explainable AI matching
            </div>
            <h2 className="display mt-5 text-3xl font-extrabold leading-tight sm:text-4xl">
              Not sure where to start?
              <br />
              <span className="text-emerald-300">Let the AI find your fit.</span>
            </h2>
            <p className="mt-4 max-w-lg text-slate-300">
              Every recommendation is ranked with a transparent weighted score using your real
              profile and live opportunities. You always see why a match works — and what could
              make it stronger.
            </p>
            <ul className="mt-7 space-y-3.5">
              {[
                'Matched skills and missing skills, clearly listed',
                'Availability, location and preference compatibility',
                'Schedule conflict warnings before you commit',
                'Practical suggestions to improve your match score',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-slate-200">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-ink-950 transition hover:bg-emerald-400"
              >
                Get matched <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/how-it-works"
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/5"
              >
                How scoring works
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-[1.75rem] border border-white/15 bg-white/[0.06] p-6 backdrop-blur-lg sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300">
                    Match score anatomy
                  </p>
                  <h3 className="mt-1.5 text-xl font-bold">Transparent by design</h3>
                </div>
                <div className="rounded-2xl bg-emerald-500 px-3.5 py-2 text-center text-ink-950">
                  <p className="text-2xl font-extrabold leading-none">100</p>
                  <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.12em]">points</p>
                </div>
              </div>

              <div className="mt-7 space-y-4">
                {scoring.map((factor) => (
                  <div key={factor.label}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-300">{factor.label}</span>
                      <span className="font-bold text-white">{factor.weight}%</span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-300"
                        style={{ width: `${factor.weight * (100 / 35)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-7 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-300">
                  What you get back
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-200">
                  Match percentage, category, matched and missing skills, factor-level
                  compatibility, a plain-language explanation and improvement suggestions.
                </p>
              </div>
            </div>
            <div className="absolute -right-4 -top-4 hidden h-20 w-20 rotate-12 items-center justify-center rounded-2xl border border-white/15 bg-ink-900/80 text-emerald-300 backdrop-blur sm:flex">
              <Sparkles className="h-8 w-8" />
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* HOW IT WORKS                                                       */}
      {/* ------------------------------------------------------------------ */}
      <section id="how-it-works" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-400">
            How it works
          </p>
          <h2 className="display mt-3 text-3xl font-extrabold text-ink-900 dark:text-white sm:text-4xl">
            From first click to real impact.
          </h2>
          <p className="mt-3 text-slate-600 dark:text-slate-300">
            One platform for the people who show up and the teams who make events happen.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-600">
                  For volunteers
                </p>
                <h3 className="mt-1 text-xl font-extrabold text-ink-900 dark:text-white">
                  Find your people. Find your purpose.
                </h3>
              </div>
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                <Compass className="h-5 w-5" />
              </span>
            </div>
            <div className="mt-7 space-y-5">
              {volunteerSteps.map((step, index) => (
                <div key={step.title} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                      <step.icon className="h-4 w-4" />
                    </span>
                    {index < volunteerSteps.length - 1 && (
                      <span className="mt-2 h-full w-px bg-slate-200 dark:bg-slate-800" />
                    )}
                  </div>
                  <div className="pb-1">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                      0{index + 1}
                    </p>
                    <h4 className="font-bold text-ink-900 dark:text-white">{step.title}</h4>
                    <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{step.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link
              to="/register"
              className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400"
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
                <h3 className="mt-1 text-xl font-extrabold">Build your crew, not a spreadsheet.</h3>
              </div>
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10 text-emerald-300">
                <CalendarCheck className="h-5 w-5" />
              </span>
            </div>
            <div className="mt-7 space-y-5">
              {organizerSteps.map((step, index) => (
                <div key={step.title} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10 text-emerald-300">
                      <step.icon className="h-4 w-4" />
                    </span>
                    {index < organizerSteps.length - 1 && (
                      <span className="mt-2 h-full w-px bg-white/10" />
                    )}
                  </div>
                  <div className="pb-1">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                      0{index + 1}
                    </p>
                    <h4 className="font-bold text-white">{step.title}</h4>
                    <p className="mt-0.5 text-sm text-slate-400">{step.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link
              to="/register?role=ngo"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-ink-950 transition hover:bg-emerald-400"
            >
              Become an organizer <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* PLATFORM FEATURES                                                  */}
      {/* ------------------------------------------------------------------ */}
      <section className="border-y border-slate-200/80 bg-white py-20 dark:border-slate-800 dark:bg-slate-900 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-400">
              The whole journey
            </p>
            <h2 className="display mt-3 text-3xl font-extrabold text-ink-900 dark:text-white sm:text-4xl">
              Everything a volunteer-powered event needs.
            </h2>
            <p className="mt-3 text-slate-600 dark:text-slate-300">
              Discovery, applications, scheduling, tasks and verified participation — connected
              end to end.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Sparkles, title: 'Explainable recommendations', text: 'Weighted scoring across skills, interests, availability, experience, location and preferences.' },
              { icon: ShieldCheck, title: 'Role-based access', text: 'Separate volunteer, organizer and administrator workspaces with ownership checks.' },
              { icon: CalendarCheck, title: 'Smart scheduling', text: 'Approved applications become schedule entries with overlap and conflict detection.' },
              { icon: ClipboardCheck, title: 'Tasks and checklists', text: 'Organizers assign event-day work; volunteers update progress from pending to complete.' },
              { icon: Users, title: 'Application workflow', text: 'Apply, review, approve or decline with capacity checks and duplicate protection.' },
              { icon: BarChart3, title: 'Verified analytics', text: 'Real participation hours and role-specific dashboards backed by the database.' },
            ].map((feature) => (
              <div
                key={feature.title}
                className="group rounded-2xl border border-slate-200 bg-slate-50/60 p-6 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-white hover:shadow-soft dark:border-slate-800 dark:bg-slate-950/40 dark:hover:border-emerald-900 dark:hover:bg-slate-900"
              >
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-600 text-white shadow-sm">
                  <feature.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-bold text-ink-900 dark:text-white">{feature.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                  {feature.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* FINAL CTA                                                          */}
      {/* ------------------------------------------------------------------ */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="relative overflow-hidden rounded-[2rem] bg-ink-950 px-6 py-14 text-center text-white shadow-lift sm:px-12 lg:px-16 lg:py-20">
          <img
            src={ctaImage}
            alt=""
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-ink-950 via-ink-950/85 to-emerald-950/70" />
          <div className="relative mx-auto max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">
              Your next chapter
            </p>
            <h2 className="display mt-4 text-3xl font-extrabold leading-tight sm:text-4xl lg:text-5xl">
              Your next great story starts with showing up.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-300 sm:text-base">
              Find a cause, a festival or a finish line that needs you. Or bring your own event
              to life with a crew that is ready to help.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                to="/opportunities"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3.5 text-sm font-bold text-ink-950 transition hover:bg-emerald-400"
              >
                Explore opportunities <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/register?role=ngo"
                className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/10"
              >
                Post an opportunity
              </Link>
            </div>
            <p className="mt-6 inline-flex items-center gap-1.5 text-[11px] text-slate-400">
              <Clock3 className="h-3.5 w-3.5" />
              Create a profile in under two minutes · No fees for volunteers
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
