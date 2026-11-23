import { useEffect, useRef } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { keymap } from '@codemirror/view';
import { Compartment, Prec } from '@codemirror/state';
import { sql, SQLite } from '@codemirror/lang-sql';
import type { TableSchema } from '../engine/core';

interface Props {
  value: string;
  onChange: (value: string) => void;
  onRun: () => void;
  schema: TableSchema[];
}

const theme = EditorView.theme({
  '&': { fontSize: '15px', height: '100%' },
  '.cm-content': { fontFamily: 'var(--mono)', padding: '12px 0' },
  '.cm-gutters': { background: 'transparent', border: 'none', color: 'var(--ink-faint)' },
  '.cm-activeLine, .cm-activeLineGutter': { background: 'var(--row-hover)' },
  '&.cm-focused': { outline: 'none' },
});

export function SqlEditor({ value, onChange, onRun, schema }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const language = useRef(new Compartment());
  const callbacks = useRef({ onChange, onRun });
  callbacks.current = { onChange, onRun };

  useEffect(() => {
    view.current = new EditorView({
      parent: host.current!,
      doc: value,
      extensions: [
        Prec.highest(keymap.of([{ key: 'Mod-Enter', run: () => (callbacks.current.onRun(), true) }])),
        basicSetup,
        language.current.of(sql({ dialect: SQLite })),
        theme,
        EditorView.lineWrapping,
        EditorView.updateListener.of((u) => u.docChanged && callbacks.current.onChange(u.state.doc.toString())),
        EditorView.contentAttributes.of({ 'aria-label': 'SQL editor' }),
      ],
    });
    return () => view.current?.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Outside changes (Try it, Reset, switching exercise) replace the text.
  useEffect(() => {
    const v = view.current;
    if (v && v.state.doc.toString() !== value) {
      v.dispatch({ changes: { from: 0, to: v.state.doc.length, insert: value } });
    }
  }, [value]);

  // Autocomplete table and column names from the current dataset.
  useEffect(() => {
    const tables = Object.fromEntries(schema.map((t) => [t.name, t.columns.map((c) => c.name)]));
    view.current?.dispatch({ effects: language.current.reconfigure(sql({ dialect: SQLite, schema: tables })) });
  }, [schema]);

  return <div className="editor" ref={host} />;
}

/** Inserts text at the cursor of the editor inside `container`. */
export function insertIntoEditor(container: HTMLElement | null, text: string) {
  const el = container?.querySelector('.cm-editor');
  const v = el ? EditorView.findFromDOM(el as HTMLElement) : null;
  if (!v) return;
  v.dispatch(v.state.replaceSelection(text));
  v.focus();
}
