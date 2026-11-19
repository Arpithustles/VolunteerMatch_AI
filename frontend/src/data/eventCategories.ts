export type EventCategory = {
  name: string;
  description: string;
  image: string;
  tone: string;
};

const unsplash = (id: string, w = 900) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

/**
 * The platform-wide category taxonomy. Category names are stored as plain
 * strings in the database, so these names must match the values sent to the
 * opportunities API exactly.
 */
export const EVENT_CATEGORIES: EventCategory[] = [
  {
    name: 'Concerts & Music Festivals',
    description: 'Live shows, arena tours and weekend festivals that need crowd, production and guest-experience crews.',
    image: unsplash('photo-1501386761578-eac5c94b800a'),
    tone: 'from-violet-950/80',
  },
  {
    name: 'College Fests',
    description: 'Cultural nights, tech fests and inter-college competitions powered by student volunteers.',
    image: unsplash('photo-1523580494863-6f3031224c94'),
    tone: 'from-blue-950/80',
  },
  {
    name: 'Cultural Events',
    description: 'Celebrations, heritage fairs and community festivals across the city.',
    image: unsplash('photo-1533174072545-7a4b6ad7a6c3'),
    tone: 'from-rose-950/80',
  },
  {
    name: 'Carnivals & Exhibitions',
    description: 'Expos, art shows and pop-up carnivals — help visitors, artists and exhibitors.',
    image: unsplash('photo-1531058020387-3be344556be6'),
    tone: 'from-amber-950/80',
  },
  {
    name: 'Government Events',
    description: 'Civic drives, public awareness campaigns and government outreach programmes.',
    image: unsplash('photo-1529107386315-e1a2ed48a620'),
    tone: 'from-slate-950/80',
  },
  {
    name: 'Sports & Marathons',
    description: 'Marathons, tournaments and race-day operations that keep every participant moving.',
    image: unsplash('photo-1452626038306-9aae5e071dd3'),
    tone: 'from-orange-950/80',
  },
  {
    name: 'NGOs & Social Causes',
    description: 'Charitable causes, donation camps and community service with lasting impact.',
    image: unsplash('photo-1559027615-cd4628902d4a'),
    tone: 'from-emerald-950/80',
  },
  {
    name: 'Political Events',
    description: 'Forums, rallies and civic engagement events that bring people together.',
    image: unsplash('photo-1521295121783-8a321d551ad2'),
    tone: 'from-sky-950/80',
  },
  {
    name: 'Conferences & Summits',
    description: 'Summits, business conferences and speaker-led sessions with high-energy teams.',
    image: unsplash('photo-1540575467063-178a50c2df87'),
    tone: 'from-indigo-950/80',
  },
  {
    name: 'Community Initiatives',
    description: 'Neighbourhood meetups, learning circles and local initiatives close to home.',
    image: unsplash('photo-1511632765486-a01980e01a18'),
    tone: 'from-teal-950/80',
  },
  {
    name: 'Environmental Campaigns',
    description: 'Clean-ups, plantation drives and sustainability campaigns for a greener future.',
    image: unsplash('photo-1466611653911-95081537e5b7'),
    tone: 'from-green-950/80',
  },
  {
    name: 'Workshops & Seminars',
    description: 'Classes, seminars and skill-building sessions that run on volunteer energy.',
    image: unsplash('photo-1524178232363-1fb2b075b655'),
    tone: 'from-cyan-950/80',
  },
];

export const CATEGORY_NAMES = EVENT_CATEGORIES.map((category) => category.name);

const categoryLookup = new Map(
  EVENT_CATEGORIES.map((category) => [category.name.toLowerCase(), category]),
);

export function getCategory(name?: string | null): EventCategory | undefined {
  if (!name) return undefined;
  return categoryLookup.get(name.toLowerCase());
}

export function getCategoryImage(name?: string | null): string {
  return getCategory(name)?.image || EVENT_CATEGORIES[9].image;
}
