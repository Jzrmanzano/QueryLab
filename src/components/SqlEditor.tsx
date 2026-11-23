import { useEffect, useRef } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { keymap, type Command } from '@codemirror/view';
import { Compartment, EditorSelection, Prec } from '@codemirror/state';
import { sql, SQLite } from '@codemirror/lang-sql';
import { indentUnit, syntaxHighlighting } from '@codemirror/language';
import { indentLess, indentMore } from '@codemirror/commands';
import { acceptCompletion } from '@codemirror/autocomplete';
import { classHighlighter } from '@lezer/highlight';
import type { TableSchema } from '../engine/core';

const INDENT = '  ';

/** Tab as in a code editor: take the open suggestion, otherwise indent. With text selected it indents every
 *  selected line; with just a cursor it inserts spaces up to the next indent stop. Shift+Tab un-indents.
 *  Keyboard users can still leave: CodeMirror lets Tab move focus right after Esc, and Ctrl+M (Shift+Alt+M on
 *  a Mac) switches Tab back to moving focus. */
const tab: Command = (view) => {
  if (acceptCompletion(view)) return true;
  const { state } = view;
  if (state.selection.ranges.some((r) => !r.empty)) return indentMore(view);
  const changes = state.changeByRange((range) => {
    const column = range.head - state.doc.lineAt(range.head).from;
    const insert = ' '.repeat(INDENT.length - (column % INDENT.length));
    return { changes: { from: range.head, insert }, range: EditorSelection.cursor(range.head + insert.length) };
  });
  view.dispatch(state.update(changes, { scrollIntoView: true, userEvent: 'input' }));
  return true;
};

interface Props {
  value: string;
  onChange: (value: string) => void;
  onRun: () => void;
  schema: TableSchema[];
}

// The editor lives on the screen: light text on deep navy, the pad's yellow for the cursor.
// Token colours come from the tok-* classes in styles.css, shared with highlighted examples.
const theme = EditorView.theme(
  {
    '&': { fontSize: '15px', height: '100%', color: 'var(--screen-text)', backgroundColor: 'transparent' },
    '.cm-content': { fontFamily: 'var(--mono)', padding: '12px 0', caretColor: 'var(--pad)' },
    '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--pad)', borderLeftWidth: '2px' },
    '.cm-gutters': { background: 'transparent', border: 'none', color: '#5d679c' },
    '.cm-activeLine': { background: 'rgba(255, 255, 255, 0.04)' },
    '.cm-activeLineGutter': { background: 'transparent', color: 'var(--screen-soft)' },
    '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection':
      { backgroundColor: '#2d3f94' },
    '.cm-matchingBracket, &.cm-focused .cm-matchingBracket': { backgroundColor: 'rgba(248, 235, 160, 0.2)', outline: 'none' },
    '.cm-tooltip': { backgroundColor: '#1c2763', border: '1px solid #2a366f', color: 'var(--screen-text)' },
    '.cm-tooltip-autocomplete > ul': { fontFamily: 'var(--mono)' },
    '.cm-tooltip-autocomplete > ul > li[aria-selected]': { backgroundColor: 'var(--pad)', color: 'var(--screen)' },
    '.cm-completionDetail': { color: 'var(--screen-soft)' },
    '&.cm-focused': { outline: 'none' },
  },
  { dark: true },
);

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
        Prec.highest(
          keymap.of([
            { key: 'Mod-Enter', run: () => (callbacks.current.onRun(), true) },
            { key: 'Tab', run: tab, shift: indentLess },
          ]),
        ),
        basicSetup,
        indentUnit.of(INDENT),
        language.current.of(sql({ dialect: SQLite })),
        syntaxHighlighting(classHighlighter),
        theme,
        EditorView.lineWrapping,
        EditorView.updateListener.of((u) => u.docChanged && callbacks.current.onChange(u.state.doc.toString())),
        EditorView.contentAttributes.of({
          'aria-label': 'SQL editor',
          'aria-description': 'Tab indents. To leave the editor, press Escape, then Tab.',
        }),
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

/** Puts the cursor back in the editor inside `container`. */
export function focusEditor(container: HTMLElement | null) {
  const el = container?.querySelector('.cm-editor');
  (el ? EditorView.findFromDOM(el as HTMLElement) : null)?.focus();
}
