import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  CalendarDays,
  Clock3,
  MapPin,
  Star,
  Users,
} from 'lucide-react';
import { getCategoryImage } from '../data/eventCategories';

export type OpportunityCardData = {
  id: number;
  title: string;
  organization_name?: string | null;
  category: string;
  location?: string | null;
  mode?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  application_deadline?: string | null;
  volunteers_required?: number;
  approved_count?: number;
  required_skills?: string | null;
  cover_image?: string | null;
  is_demo?: boolean;
};

const formatDate = (value?: string | null) => {
  if (!value) return null;
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

const modeStyles: Record<string, string> = {
  remote: 'bg-sky-50 text-sky-700 ring-sky-600/10 dark:bg-sky-950/60 dark:text-sky-300',
  hybrid: 'bg-violet-50 text-violet-700 ring-violet-600/10 dark:bg-violet-950/60 dark:text-violet-300',
  'on-site': 'bg-slate-50 text-slate-700 ring-slate-600/10 dark:bg-slate-800 dark:text-slate-300',
};

export function OpportunityCard({
  opportunity,
  saved,
  onToggleSave,
}: {
  opportunity: OpportunityCardData;
  saved?: boolean;
  onToggleSave?: () => void;
}) {
  const start = formatDate(opportunity.start_date);
  const end = formatDate(opportunity.end_date);
  const dateLabel = start && end && start !== end ? `${start} – ${end}` : start || end || 'Flexible dates';
  const spots = Math.max(0, Number(opportunity.volunteers_required || 0) - Number(opportunity.approved_count || 0));
  const skills = (opportunity.required_skills || '')
    .split(',')
    .map((skill) => skill.trim())
    .filter(Boolean)
    .slice(0, 3);
  const image = opportunity.cover_image || getCategoryImage(opportunity.category);
  const deadline = formatDate(opportunity.application_deadline);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[1.6rem] border border-slate-200/80 bg-white shadow-[0_10px_40px_-30px_rgba(6,21,37,0.35)] transition duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lift dark:border-slate-800 dark:bg-slate-900">
      <div className="relative h-52 overflow-hidden bg-slate-100 dark:bg-slate-800">
        <img
          src={image}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.045]"
          onError={(event) => {
            event.currentTarget.src = getCategoryImage(opportunity.category);
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/75 via-ink-950/5 to-transparent" />

        <div className="absolute left-4 top-4 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-white/95 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-900 shadow-sm backdrop-blur">
            {opportunity.category}
          </span>
          {opportunity.is_demo && (
            <span className="rounded-full bg-amber-400/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-amber-950">
              Demo
            </span>
          )}
        </div>

        {onToggleSave && (
          <button
            type="button"
            onClick={onToggleSave}
            aria-label={saved ? 'Remove from saved opportunities' : 'Save opportunity'}
            className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-white/95 text-slate-500 shadow-sm backdrop-blur transition hover:scale-105 hover:text-amber-500 dark:bg-slate-900/90"
          >
            <Star className="h-4 w-4" fill={saved ? 'currentColor' : 'none'} />
          </button>
        )}

        <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3 text-white">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-ink-950/45 px-3 py-1.5 text-xs font-medium backdrop-blur">
            <CalendarDays className="h-3.5 w-3.5" />
            {dateLabel}
          </span>
          <span className={`rounded-full px-3 py-1.5 text-[11px] font-semibold capitalize ring-1 ${modeStyles[opportunity.mode || 'on-site'] || modeStyles['on-site']}`}>
            {opportunity.mode || 'on-site'}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-400">
          {opportunity.organization_name || 'Community organizer'}
        </p>
        <h3 className="mt-2 line-clamp-2 text-lg font-bold leading-snug text-ink-900 dark:text-white">
          {opportunity.title}
        </h3>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            {opportunity.location || 'Location TBD'}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            {spots > 0 ? `${spots} spots left` : 'Positions filled'}
          </span>
          {deadline && (
            <span className="inline-flex items-center gap-1.5">
              <Clock3 className="h-3.5 w-3.5" />
              Apply by {deadline}
            </span>
          )}
        </div>

        {skills.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {skills.map((skill) => (
              <span
                key={skill}
                className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300"
              >
                {skill}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
          <span className="text-xs font-medium text-slate-400">
            {opportunity.volunteers_required || 0} volunteer positions
          </span>
          <Link
            to={`/opportunities/${opportunity.id}`}
            className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-700 transition hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300"
          >
            View & apply <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}
