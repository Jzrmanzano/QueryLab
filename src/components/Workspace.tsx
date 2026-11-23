import { useEffect, useRef, useState, type ReactNode } from 'react';
import { SqlEditor, focusEditor, insertIntoEditor } from './SqlEditor';
import { ResultsTable, type RunState } from './ResultsTable';
import { SchemaPanel } from './SchemaPanel';
import { getSchema, runQuery } from '../engine/client';
import type { TableSchema } from '../engine/core';

interface Props {
  datasetId: string;
  /** Shown above the editor, e.g. the current exercise prompt. */
  task?: ReactNode;
  value: string;
  onChange: (sql: string) => void;
  /** Extra buttons next to Run, e.g. Submit. */
  actions?: ReactNode;
  /** When set, a Feedback tab is shown; changing `feedbackKey` switches to it. */
  feedback?: ReactNode;
  feedbackKey?: number;
  /** Run the starting query as soon as the workspace appears (used by the home page demo). */
  autoRun?: boolean;
  /** Show a Clear results button on the Results tab (used by the playground). */
  clearable?: boolean;
}

type Tab = 'results' | 'schema' | 'feedback';

export function Workspace({ datasetId, task, value, onChange, actions, feedback, feedbackKey, autoRun = false, clearable = false }: Props) {
  const [run, setRun] = useState<RunState>({ kind: 'idle' });
  const [schema, setSchema] = useState<TableSchema[]>([]);
  const [tab, setTab] = useState<Tab>('results');
  const box = useRef<HTMLDivElement>(null);
  // Each run gets a number; a result that arrives after a newer run or a clear is dropped.
  const runId = useRef(0);

  useEffect(() => {
    runId.current++;
    setSchema([]);
    setRun({ kind: 'idle' });
    getSchema(datasetId).then(setSchema, (e: Error) => setRun({ kind: 'error', message: e.message }));
  }, [datasetId]);

  useEffect(() => {
    if (feedbackKey) setTab('feedback');
  }, [feedbackKey]);

  useEffect(() => {
    if (autoRun) execute();
    // Only on first appearance: later runs are the learner's.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function execute() {
    if (!value.trim()) return;
    const id = ++runId.current;
    setTab('results');
    setRun({ kind: 'running' });
    runQuery(datasetId, value).then(
      (out) => id === runId.current && setRun({ kind: 'ok', out }),
      (e: Error) => id === runId.current && setRun({ kind: 'error', message: e.message }),
    );
  }

  function clear() {
    runId.current++;
    setRun({ kind: 'idle' });
    focusEditor(box.current); // the button disables itself, so focus goes back to writing
  }

  const tabs: [Tab, string][] = [
    ['results', 'Results'],
    ['schema', 'Schema'],
    ...(feedback ? ([['feedback', 'Feedback']] as [Tab, string][]) : []),
  ];

  return (
    <div className="workspace" ref={box}>
      {task && <div className="task">{task}</div>}
      <div className="editor-frame">
        <SqlEditor value={value} onChange={onChange} onRun={execute} schema={schema} />
        <div className="editor-bar">
          <span className="dataset-label">
            Dataset: <strong>{datasetId}</strong>
          </span>
          <span className="spacer" />
          {actions}
          {/* When there's a graded action (Check answer), Run steps back to secondary. */}
          <button className={actions ? 'btn' : 'btn primary'} onClick={execute} title="Run (Ctrl+Enter)">
            Run <kbd>Ctrl+Enter</kbd>
          </button>
        </div>
      </div>
      <div className="output">
        <div className="tabs" role="tablist">
          {tabs.map(([id, label]) => (
            <button key={id} role="tab" aria-selected={tab === id} className="tab" onClick={() => setTab(id)}>
              {label}
            </button>
          ))}
          {clearable && tab === 'results' && (
            <button className="btn small clear-results" onClick={clear} disabled={run.kind === 'idle'}>
              Clear results
            </button>
          )}
        </div>
        <div className="tab-body" role="tabpanel">
          {tab === 'results' && <ResultsTable state={run} />}
          {tab === 'schema' && <SchemaPanel schema={schema} onInsert={(n) => insertIntoEditor(box.current, n)} />}
          {tab === 'feedback' && feedback}
        </div>
      </div>
    </div>
  );
}
