// Dataset seeds (CREATE + INSERT) as text. Each one is a separate chunk that loads
// the first time it's used, so large datasets don't slow down the first page.
const loaders = import.meta.glob('/content/datasets/*.sql', { query: '?raw', import: 'default' }) as Record<
  string,
  () => Promise<string>
>;

const byId: Record<string, () => Promise<string>> = Object.fromEntries(
  Object.entries(loaders).map(([path, load]) => [path.split('/').at(-1)!.replace(/\.sql$/, ''), load]),
);

export const datasetIds = Object.keys(byId).sort();

/** One line about each dataset, for the home page and the schema guide. */
export const DATASETS = [
  { id: 'school', blurb: 'A university: colleges, instructors, courses, students, and which students take which courses.' },
  { id: 'store', blurb: 'An electronics shop: customers, products, orders, and the items in each order.' },
  {
    id: 'chinook',
    blurb: 'A digital music store with 11 tables: artists, albums, tracks, playlists, customers, invoices and employees.',
  },
  { id: 'penguins', blurb: 'One table of 344 penguins. Nothing to join, which makes it ideal for filtering and aggregates.' },
];

export function loadDataset(id: string): Promise<string> {
  const load = byId[id];
  return load ? load() : Promise.reject(new Error(`Unknown dataset "${id}"`));
}
