import type { TableSchema } from '../engine/core';

export function SchemaPanel({ schema, onInsert }: { schema: TableSchema[]; onInsert: (name: string) => void }) {
  if (!schema.length) return <p className="placeholder">Loading tables…</p>;
  return (
    <div className="schema">
      <p className="meta">Click a name to insert it into your query.</p>
      {schema.map((t) => (
        <section key={t.name}>
          <button className="schema-table" onClick={() => onInsert(t.name)}>
            {t.name}
          </button>
          <ul>
            {t.columns.map((c) => (
              <li key={c.name}>
                <button onClick={() => onInsert(c.name)}>{c.name}</button>
                <span className="type">{c.type.toLowerCase()}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
