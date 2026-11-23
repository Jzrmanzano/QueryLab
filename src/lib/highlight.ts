// Tiny SQL highlighter for static examples, using the same tok-* classes as the editor.
// Returns escaped HTML, so it's safe to inject.

const KEYWORDS = new Set(
  `select from where and or not null is in like between join inner left right full outer cross on as group by order
   having limit offset distinct all union intersect except case when then else end with exists asc desc insert into
   values update set delete create table primary key references count sum avg min max coalesce round length upper
   lower substr date strftime cast integer text real true false`
    .split(/\s+/)
    .filter(Boolean),
);

const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const TOKEN = /(--[^\n]*)|('(?:[^']|'')*'?)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_][A-Za-z0-9_]*)/g;

export function highlightSql(sql: string): string {
  let out = '';
  let last = 0;
  for (const m of sql.matchAll(TOKEN)) {
    out += escape(sql.slice(last, m.index));
    const [text, comment, string, number, word] = m;
    const cls = comment ? 'comment' : string ? 'string' : number ? 'number' : word && KEYWORDS.has(word.toLowerCase()) ? 'keyword' : '';
    out += cls ? `<span class="tok-${cls}">${escape(text)}</span>` : escape(text);
    last = m.index + text.length;
  }
  return out + escape(sql.slice(last));
}
