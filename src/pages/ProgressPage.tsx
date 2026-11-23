import { useRef, useState, type ChangeEvent } from 'react';
import { Link } from 'react-router';
import { exercises, lessonPath, modules } from '../content/loader';
import { parseBackup, toBackup, useProgress, type Rows } from '../lib/progress';

const knownIds = new Set(exercises.map((e) => e.id));
const MAX_BACKUP_BYTES = 5 * 1024 * 1024;
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

function Backup() {
  const { rows, restore } = useProgress();
  const fileInput = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const hasProgress = Object.keys(rows).length > 0;

  function download() {
    const url = URL.createObjectURL(new Blob([toBackup(rows)], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `querylab-progress-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setStatus({ ok: true, text: 'Backup downloaded. Keep the file somewhere safe, or open this page on another device and restore it there.' });
  }

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // lets the same file be picked again
    if (!file) return;
    try {
      if (file.size > MAX_BACKUP_BYTES) throw new Error("That file is too large to be a QueryLab backup.");
      const known: Rows = Object.fromEntries(Object.entries(parseBackup(await file.text())).filter(([id]) => knownIds.has(id)));
      const restored = Object.values(known);
      if (restored.length === 0) throw new Error("That backup doesn't contain progress for any current exercise.");
      restore(known);
      const solvedCount = restored.filter((r) => r.status === 'solved').length;
      setStatus({
        ok: true,
        text: `Restored ${plural(restored.length, 'exercise')} (${solvedCount} solved). Progress already in this browser was kept.`,
      });
    } catch (err) {
      setStatus({ ok: false, text: (err as Error).message });
    }
  }

  return (
    <section className="backup" aria-labelledby="backup-heading">
      <h2 id="backup-heading">Backup</h2>
      <p className="meta">
        Your progress is saved in this browser only. Download a backup to keep it safe or to move it to another device.
      </p>
      <div className="backup-actions">
        <button className="btn" onClick={download} disabled={!hasProgress} title={hasProgress ? undefined : 'Solve or try an exercise first'}>
          Download backup
        </button>
        <button className="btn" onClick={() => fileInput.current?.click()}>
          Restore from a backup
        </button>
        <input ref={fileInput} type="file" accept=".json,application/json" hidden onChange={onFile} />
      </div>
      {status && (
        <p className={`verdict ${status.ok ? 'pass' : 'fail'}`} role="status">
          {status.text}
        </p>
      )}
    </section>
  );
}

export function ProgressPage() {
  const { rows } = useProgress();

  const solved = exercises.filter((e) => rows[e.id]?.status === 'solved').length;
  const last = Object.values(rows).sort((a, b) => (b.solved_at ?? '').localeCompare(a.solved_at ?? ''))[0];

  return (
    <div className="page">
      <h1>Your progress</h1>
      <p className="lead">
        You've solved <strong>{solved}</strong> of {exercises.length} exercises.
        {last?.solved_at && ` Last solved on ${new Date(last.solved_at).toLocaleDateString()}.`}
      </p>
      <Backup />
      {modules.map((m) => (
        <section key={m.slug} className="progress-module">
          <h2>{m.title}</h2>
          {m.lessons.map((l) => (
            <div key={l.id} className="progress-lesson">
              <Link to={lessonPath(l)}>{l.title}</Link>
              <ul>
                {l.exercises.map((e, i) => {
                  const row = rows[e.id];
                  return (
                    <li key={e.id} className={row?.status ?? 'todo'}>
                      <span className="mark">{row?.status === 'solved' ? '✓' : i + 1}</span>
                      {e.prompt.replace(/`/g, '')}
                      {row && <span className="count">{row.attempts} {row.attempts === 1 ? 'try' : 'tries'}</span>}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
