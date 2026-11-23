import type { QueryOutput, ResultDiff as Diff } from '../engine/compare';
import { show } from './ResultsTable';

type Flag = 'extra' | 'missing' | 'moved';

const FLAGS: Record<Flag, { symbol: string; label: string }> = {
  extra: { symbol: '✗', label: 'not in the expected result' },
  missing: { symbol: '+', label: 'missing from your result' },
  moved: { symbol: '↕', label: 'in a different position' },
};

const rows = (n: number) => `${n} ${n === 1 ? 'row' : 'rows'}`;

function DiffTable(props: {
  title: string;
  out: QueryOutput;
  total: number;
  flagOf: (i: number) => Flag | undefined;
  wrongColumn?: number;
}) {
  const { title, out, total, flagOf, wrongColumn } = props;
  return (
    <div>
      <h3>
        {title} <span className="count">{rows(total)}</span>
      </h3>
      <div className="grid-wrap">
        <table className="grid">
          <thead>
            <tr>
              <th className="flag">
                <span className="sr-only">Row</span>
              </th>
              {out.columns.map((c, i) => (
                <th key={i} className={i === wrongColumn ? 'wrong' : undefined}>
                  {c}
                  {i === wrongColumn && <span className="sr-only"> (wrong name)</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {out.rows.length === 0 && (
              <tr>
                <td className="flag" />
                <td colSpan={Math.max(out.columns.length, 1)} className="null">
                  No rows
                </td>
              </tr>
            )}
            {out.rows.map((r, i) => {
              const flag = flagOf(i);
              return (
                <tr key={i} className={flag}>
                  <td className="flag" title={flag && `Row ${i + 1} is ${FLAGS[flag].label}`}>
                    {i + 1}
                    {flag && (
                      <>
                        <span aria-hidden> {FLAGS[flag].symbol}</span>
                        <span className="sr-only">, {FLAGS[flag].label}</span>
                      </>
                    )}
                  </td>
                  {r.map((v, j) => (
                    <td key={j} className={typeof v === 'number' ? 'num' : undefined}>
                      {show(v)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {total > out.rows.length && <p className="meta">Showing the first {rows(out.rows.length)}.</p>}
    </div>
  );
}

/** Side-by-side view of the learner's result and the expected one, with mismatched rows marked. */
export function ResultDiff({ diff }: { diff: Diff }) {
  const extra = new Set(diff.extra);
  const missing = new Set(diff.missing);
  const moved = new Set(diff.misplaced);
  const legend: [Flag, number][] = (
    [
      ['extra', diff.extra.length],
      ['missing', diff.missing.length],
      ['moved', diff.misplaced.length],
    ] as [Flag, number][]
  ).filter(([, n]) => n > 0);

  return (
    <section className="diff" aria-label="Your result compared with the expected result">
      {legend.length > 0 && (
        <ul className="diff-legend">
          {legend.map(([flag, n]) => (
            <li key={flag} className={flag}>
              <span className="key" aria-hidden>
                {FLAGS[flag].symbol}
              </span>
              {rows(n)} {FLAGS[flag].label}
            </li>
          ))}
        </ul>
      )}
      <div className="diff-tables">
        <DiffTable
          title="Your result"
          out={diff.yours}
          total={diff.yoursTotal}
          flagOf={(i) => (extra.has(i) ? 'extra' : moved.has(i) ? 'moved' : undefined)}
          wrongColumn={diff.wrongColumn}
        />
        <DiffTable
          title="Expected result"
          out={diff.expected}
          total={diff.expectedTotal}
          flagOf={(i) => (missing.has(i) ? 'missing' : moved.has(i) ? 'moved' : undefined)}
        />
      </div>
    </section>
  );
}
