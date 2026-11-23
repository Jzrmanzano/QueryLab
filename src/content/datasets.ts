// Dataset seeds (CREATE + INSERT), bundled as text.
const files = import.meta.glob('/content/datasets/*.sql', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

export const datasets: Record<string, string> = Object.fromEntries(
  Object.entries(files).map(([path, sql]) => [path.split('/').at(-1)!.replace('.sql', ''), sql]),
);

export const datasetIds = Object.keys(datasets).sort();
