import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  MapPin,
  Search,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import { api } from '../../api/client';
import { useToast } from '../../components/Toast';
import { OpportunityCard, type OpportunityCardData } from '../../components/OpportunityCard';
import { EmptyState, ErrorState, PageHeader, Spinner } from '../../components/UI';
import { EVENT_CATEGORIES } from '../../data/eventCategories';

type Filters = {
  q: string;
  category: string;
  location: string;
  date_from: string;
  mode: string;
};

const blank: Filters = { q: '', category: '', location: '', date_from: '', mode: '' };

export default function Explore() {
  const { push } = useToast();
  const [items, setItems] = useState<OpportunityCardData[]>([]);
  const [saved, setSaved] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState<Filters>(blank);
  const [applied, setApplied] = useState<Filters>(blank);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 9;

  const load = async (filters: Filters, targetPage = page) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.set(key, value);
      });
      params.set('page', String(targetPage));
      params.set('page_size', String(pageSize));
      const [data, savedList] = await Promise.all([
        api.get<{ items: OpportunityCardData[]; total: number }>(`/opportunities?${params.toString()}`),
        api.get<any[]>('/saved').catch(() => []),
      ]);
      setItems(data.items || []);
      setTotal(data.total || 0);
      setSaved((savedList || []).map((entry) => entry.id));
    } catch (err: any) {
      setError(err.message || 'Could not load opportunities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(applied, page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setPage(1);
    setApplied(draft);
    load(draft, 1);
  };

  const chooseCategory = (category: string) => {
    const next = { ...draft, category };
    setDraft(next);
    setApplied(next);
    setPage(1);
    load(next, 1);
  };

  const clearFilters = () => {
    setDraft(blank);
    setApplied(blank);
    setPage(1);
    load(blank, 1);
  };

  const toggleSave = async (id: number) => {
    try {
      if (saved.includes(id)) {
        await api.del(`/saved/${id}`);
        setSaved((current) => current.filter((value) => value !== id));
        push('Removed from saved', 'info');
      } else {
        await api.post(`/saved/${id}`);
        setSaved((current) => [...current, id]);
        push('Saved for later', 'success');
      }
    } catch (err: any) {
      push(err.message, 'error');
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div>
      <PageHeader
        title="Explore opportunities"
        subtitle="Every kind of event, every kind of cause — filtered around your interests."
        actions={
          <Link
            to="/volunteer/recommendations"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-700"
          >
            <Sparkles className="h-4 w-4" /> AI recommendations
          </Link>
        }
      />

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        <button
          type="button"
          onClick={() => chooseCategory('')}
          className={`whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[11px] font-semibold transition ${
            !draft.category
              ? 'border-emerald-600 bg-emerald-600 text-white'
              : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
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
              draft.category === category.name
                ? 'border-emerald-600 bg-emerald-600 text-white'
                : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <form onSubmit={submit} className="grid gap-2.5 lg:grid-cols-12">
          <label className="relative lg:col-span-4">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={draft.q}
              onChange={(event) => setDraft({ ...draft, q: event.target.value })}
              placeholder="Search events, organizers, causes..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-emerald-400 dark:border-slate-700 dark:bg-slate-950"
            />
          </label>
          <label className="relative lg:col-span-3">
            <MapPin className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={draft.location}
              onChange={(event) => setDraft({ ...draft, location: event.target.value })}
              placeholder="Location"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-emerald-400 dark:border-slate-700 dark:bg-slate-950"
            />
          </label>
          <label className="relative lg:col-span-2">
            <CalendarDays className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="date"
              value={draft.date_from}
              onChange={(event) => setDraft({ ...draft, date_from: event.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-2 text-sm outline-none transition focus:border-emerald-400 dark:border-slate-700 dark:bg-slate-950"
            />
          </label>
          <select
            value={draft.mode}
            onChange={(event) => setDraft({ ...draft, mode: event.target.value })}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-400 dark:border-slate-700 dark:bg-slate-950 lg:col-span-2"
          >
            <option value="">Any mode</option>
            <option value="on-site">On-site</option>
            <option value="remote">Remote</option>
            <option value="hybrid">Hybrid</option>
          </select>
          <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 lg:col-span-1">
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </form>
      </div>

      {error && <div className="mb-4"><ErrorState message={error} onRetry={() => load(applied, page)} /></div>}

      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          <span className="font-bold text-ink-900 dark:text-white">{total}</span> opportunities
          {applied.category ? ` in ${applied.category}` : ''}
        </p>
        {(applied.q || applied.category || applied.location || applied.mode || applied.date_from) && (
          <button onClick={clearFilters} className="text-xs font-semibold text-slate-500 hover:text-rose-600">
            Clear filters
          </button>
        )}
      </div>

      {loading ? (
        <Spinner label="Loading opportunities..." />
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <EmptyState
            title="No opportunities found"
            description="Try different filters or check back later as organizers publish new events."
            action={
              <button onClick={clearFilters} className="text-sm font-semibold text-emerald-600">
                Clear filters
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {items.map((opportunity) => (
            <OpportunityCard
              key={opportunity.id}
              opportunity={opportunity}
              saved={saved.includes(opportunity.id)}
              onToggleSave={() => toggleSave(opportunity.id)}
            />
          ))}
        </div>
      )}

      {total > pageSize && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            <ArrowLeft className="h-4 w-4" /> Previous
          </button>
          <span className="px-3 text-sm font-medium text-slate-500">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            Next <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
