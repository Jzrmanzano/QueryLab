import { useMemo } from 'react';
import { Marked } from 'marked';

const escape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ```sql run blocks get a "Try it" button that loads the example into the editor.
const md = new Marked({
  renderer: {
    code({ text, lang }) {
      if (!lang?.startsWith('sql')) return false;
      const button = lang.includes('run') ? `<button class="btn small try" data-sql="${escape(text)}">Try it</button>` : '';
      return `<div class="example"><pre><code>${escape(text)}</code></pre>${button}</div>`;
    },
  },
});

export function LessonBody({ markdown, onTry }: { markdown: string; onTry: (sql: string) => void }) {
  const html = useMemo(() => md.parse(markdown) as string, [markdown]);
  return (
    <div
      className="prose"
      dangerouslySetInnerHTML={{ __html: html }}
      onClick={(e) => {
        const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('button.try');
        if (btn?.dataset.sql) onTry(btn.dataset.sql);
      }}
    />
  );
}
