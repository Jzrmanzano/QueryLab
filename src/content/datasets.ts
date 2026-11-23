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

export function loadDataset(id: string): Promise<string> {
  const load = byId[id];
  return load ? load() : Promise.reject(new Error(`Unknown dataset "${id}"`));
}
