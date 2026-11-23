import { Link } from 'react-router';
import type { ColumnSchema, TableSchema } from '../engine/core';

/** PK / FK markers for a column, as used in the schema guide. */
export function KeyBadges({ column }: { column: Pick<ColumnSchema, 'pk' | 'references'> }) {
  const ref = column.references;
  return (
    <>
      {column.pk && (
        <abbr className="key-badge pk" title="Primary key: identifies each row">
          PK
        </abbr>
      )}
      {ref && (
        <abbr className="key-badge fk" title={`Foreign key: points to ${ref.table}${ref.column ? `.${ref.column}` : ''}`}>
          FK
        </abbr>
      )}
    </>
  );
}

export function SchemaPanel({ schema, onInsert }: { schema: TableSchema[]; onInsert: (name: string) => void }) {
  if (!schema.length) return <p className="placeholder">Loading tables…</p>;
  return (
    <div className="schema">
      <p className="meta">
        Click a name to insert it into your query. <abbr title="Primary key">PK</abbr> and <abbr title="Foreign key">FK</abbr> mark
        the keys that link tables. <Link to="/guide">How to read a schema</Link>
      </p>
      {schema.map((t) => (
        <section key={t.name}>
          <button className="schema-table" onClick={() => onInsert(t.name)}>
            {t.name}
          </button>
          <ul>
            {t.columns.map((c) => (
              <li key={c.name}>
                <span className="col">
                  <button onClick={() => onInsert(c.name)}>{c.name}</button>
                  <KeyBadges column={c} />
                </span>
                <span className="type">{c.type.toLowerCase()}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
