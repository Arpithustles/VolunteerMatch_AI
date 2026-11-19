import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  MapPin,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
} from 'lucide-react';
import { api } from '../../api/client';
import { OpportunityCard, type OpportunityCardData } from '../../components/OpportunityCard';
import { EVENT_CATEGORIES } from '../../data/eventCategories';

type Filters = {
  q: string;
  category: string;
  location: string;
  date_from: string;
  skills: string;
  availability: string;
  mode: string;
  sort: string;
};

const blankFilters: Filters = {
  q: '',
  category: '',
  location: '',
  date_from: '',
  skills: '',
  availability: '',
  mode: '',
  sort: 'deadline',
};

const filtersFromParams = (params: URLSearchParams): Filters => ({
  q: params.get('q') || '',
  category: params.get('category') || '',
  location: params.get('location') || '',
  date_from: params.get('date_from') || '',
  skills: params.get('skills') || '',
  availability: params.get('availability') || '',
  mode: params.get('mode') || '',
  sort: params.get('sort') || 'deadline',
});

export default function PublicOpportunities() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [draft, setDraft] = useState<Filters>(() => filtersFromParams(searchParams));
  const [items, setItems] = useState<OpportunityCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const paramsKey = searchParams.toString();
  const applied = useMemo(() => filtersFromParams(searchParams), [paramsKey]);
  const pageSize = 9;

  useEffect(() => {
    setDraft(applied);
    setPage(1);
  }, [paramsKey]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    const params = new URLSearchParams();
    Object.entries(applied).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    params.set('page', String(page));
    params.set('page_size', String(pageSize));
    api
      .get<{ items: OpportunityCardData[]; total: number }>(`/opportunities?${params.toString()}`)
      .then((data) => {
        if (cancelled) return;
        setItems(data.items || []);
        setTotal(data.total || 0);
      })
      .catch((err: any) => {
        if (!cancelled) setError(err.message || 'Could not load opportunities');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [paramsKey, page]);

  const applyFilters = (event: React.FormEvent) => {
    event.preventDefault();
    const params = new URLSearchParams();
    Object.entries(draft).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    setSearchParams(params);
    setPage(1);
  };

  const chooseCategory = (category: string) => {
    const params = new URLSearchParams(searchParams);
    if (category) params.set('category', category);
    else params.delete('category');
    setSearchParams(params);
    setPage(1);
  };

  const clearFilters = () => {
    setDraft(blankFilters);
    setSearchParams(new URLSearchParams());
    setPage(1);
  };

  const hasFilters = Object.entries(applied).some(
    ([key, value]) => key !== 'sort' && Boolean(value),
  );
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="bg-[#F7F9F8] dark:bg-slate-950">
      {/* Discovery hero */}
      <section className="relative overflow-hidden bg-ink-950 text-white">
        <div className="pointer-events-none absolute inset-0 mesh-emerald opacity-80" />
        <div className="pointer-events-none absolute inset-0 hero-grid opacity-40" />
        <div className="relative mx-auto max-w-7xl px-4 pb-12 pt-12 sm:px-6 lg:px-8 lg:pb-14 lg:pt-16">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">
            Discover opportunities
          </p>
          <h1 className="display mt-3 max-w-3xl text-4xl font-extrabold leading-tight sm:text-5xl">
            Find your next opportunity.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
            Concerts, college fests, cultural celebrations, marathons, government campaigns,
            NGO causes and everything in between. Filter by what fits your life.
          </p>

          <div className="mt-7 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button
              type="button"
              onClick={() => chooseCategory('')}
              className={`whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[11px] font-semibold transition ${
                !applied.category
                  ? 'border-emerald-400 bg-emerald-500 text-ink-950'
                  : 'border-white/20 bg-white/5 text-slate-200 hover:bg-white/10'
              }`}
            >
              All events
            </button>
            {EVENT_CATEGORIES.map((category) => (
              <button
                key={category.name}
                type="button"
                onClick={() => chooseCategory(category.name)}
                className={`whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[11px] font-semibold transition ${
                  applied.category === category.name
                    ? 'border-emerald-400 bg-emerald-500 text-ink-950'
                    : 'border-white/20 bg-white/5 text-slate-200 hover:bg-white/10'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        {/* Filters */}
        <form
          onSubmit={applyFilters}
          className="-mt-20 rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-soft dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="grid gap-3 lg:grid-cols-12">
            <label className="relative lg:col-span-4">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={draft.q}
                onChange={(event) => setDraft({ ...draft, q: event.target.value })}
                placeholder="Search events, organizers, causes..."
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-emerald-900/40"
              />
            </label>

            <label className="relative lg:col-span-3">
              <MapPin className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={draft.location}
                onChange={(event) => setDraft({ ...draft, location: event.target.value })}
                placeholder="City or remote"
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-emerald-900/40"
              />
            </label>

            <label className="relative lg:col-span-2">
              <CalendarDays className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="date"
                value={draft.date_from}
                onChange={(event) => setDraft({ ...draft, date_from: event.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-2 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-emerald-900/40"
              />
            </label>

            <label className="relative lg:col-span-3">
              <Sparkles className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <select
                value={draft.category}
                onChange={(event) => setDraft({ ...draft, category: event.target.value })}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-emerald-900/40"
              >
                <option value="">Any category</option>
                {EVENT_CATEGORIES.map((category) => (
                  <option key={category.name} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-3 grid gap-3 lg:grid-cols-12">
            <input
              value={draft.skills}
              onChange={(event) => setDraft({ ...draft, skills: event.target.value })}
              placeholder="Skills, e.g. event management, first aid"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-emerald-900/40 lg:col-span-3"
            />
            <input
              value={draft.availability}
              onChange={(event) => setDraft({ ...draft, availability: event.target.value })}
              placeholder="Availability, e.g. Saturday"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-emerald-900/40 lg:col-span-3"
            />
            <select
              value={draft.mode}
              onChange={(event) => setDraft({ ...draft, mode: event.target.value })}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-emerald-900/40 lg:col-span-2"
            >
              <option value="">Any mode</option>
              <option value="on-site">On-site</option>
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
            </select>
            <select
              value={draft.sort}
              onChange={(event) => setDraft({ ...draft, sort: event.target.value })}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-emerald-900/40 lg:col-span-2"
            >
              <option value="deadline">Deadline first</option>
              <option value="newest">Newest first</option>
              <option value="title">Title A–Z</option>
            </select>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-ink-950 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-600 dark:bg-emerald-500 dark:text-ink-950 dark:hover:bg-emerald-400 lg:col-span-2"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Apply filters
            </button>
          </div>

          {hasFilters && (
            <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 pt-3 dark:border-slate-800">
              <div className="flex flex-wrap gap-1.5">
                {applied.category && (
                  <FilterChip label={applied.category} onClear={() => chooseCategory('')} />
                )}
                {applied.location && (
                  <FilterChip
                    label={applied.location}
                    onClear={() => {
                      const params = new URLSearchParams(searchParams);
                      params.delete('location');
                      setSearchParams(params);
                    }}
                  />
                )}
                {applied.q && (
                  <FilterChip
                    label={`“${applied.q}”`}
                    onClear={() => {
                      const params = new URLSearchParams(searchParams);
                      params.delete('q');
                      setSearchParams(params);
                    }}
                  />
                )}
                {applied.mode && (
                  <FilterChip
                    label={applied.mode}
                    onClear={() => {
                      const params = new URLSearchParams(searchParams);
                      params.delete('mode');
                      setSearchParams(params);
                    }}
                  />
                )}
              </div>
              <button
                type="button"
                onClick={clearFilters}
                className="shrink-0 text-[11px] font-semibold text-slate-500 hover:text-rose-600"
              >
                Clear all
              </button>
            </div>
          )}
        </form>

        {/* Results */}
        <div className="mt-8 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold text-ink-900 dark:text-white">
              {loading ? 'Finding opportunities...' : `${total} opportunit${total === 1 ? 'y' : 'ies'} found`}
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {applied.category || 'Across every category'} · {applied.location || 'Delhi NCR and remote'}
            </p>
          </div>
          <p className="text-xs font-medium text-slate-400">
            Page {page} of {totalPages}
          </p>
        </div>

        {error && (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
            {error}
          </div>
        )}

        {!loading && items.some((item) => item.is_demo) && (
          <p className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/80 px-3.5 py-2.5 text-xs text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300">
            <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
            Listings marked “Demo” are seeded examples for this academic prototype, not confirmed
            real-world events.
          </p>
        )}

        {loading ? (
          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-[430px] animate-pulse rounded-[1.6rem] border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-white px-6 py-16 text-center dark:border-slate-800 dark:bg-slate-900">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800">
              <Search className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-lg font-extrabold text-ink-900 dark:text-white">
              No opportunities match those filters
            </h3>
            <p className="mx-auto mt-1.5 max-w-md text-sm text-slate-500 dark:text-slate-400">
              Try a different category, widen the location or clear the filters to see everything
              that is currently open.
            </p>
            <button
              onClick={clearFilters}
              className="mt-5 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {items.map((opportunity) => (
              <OpportunityCard key={opportunity.id} opportunity={opportunity} />
            ))}
          </div>
        )}

        {total > pageSize && (
          <div className="mt-10 flex items-center justify-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <ArrowLeft className="h-4 w-4" /> Previous
            </button>
            {Array.from({ length: totalPages }).slice(0, 5).map((_, index) => {
              const pageNumber = index + 1;
              return (
                <button
                  key={pageNumber}
                  onClick={() => setPage(pageNumber)}
                  className={`h-9 w-9 rounded-xl text-sm font-bold transition ${
                    page === pageNumber
                      ? 'bg-ink-950 text-white dark:bg-emerald-500 dark:text-ink-950'
                      : 'border border-slate-200 bg-white text-slate-600 hover:border-emerald-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
                  }`}
                >
                  {pageNumber}
                </button>
              );
            })}
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              Next <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="mt-14 rounded-[1.5rem] border border-slate-200 bg-white p-6 text-center dark:border-slate-800 dark:bg-slate-900 sm:p-8">
          <h3 className="text-lg font-extrabold text-ink-900 dark:text-white">
            Organizing something?
          </h3>
          <p className="mx-auto mt-1.5 max-w-xl text-sm text-slate-500 dark:text-slate-400">
            Publish your event, set the skills and shifts you need, and review volunteers in one
            place.
          </p>
          <Link
            to="/register?role=ngo"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700"
          >
            Become an organizer <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function FilterChip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
      {label}
      <button type="button" onClick={onClear} aria-label={`Clear ${label}`} className="text-slate-400 hover:text-rose-600">
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}
