import { describe, expect, it } from 'vitest';
import { highlightSql } from './highlight';

describe('highlightSql', () => {
  it('marks keywords, strings and numbers, and leaves names alone', () => {
    expect(highlightSql("SELECT name FROM t WHERE n > 3 AND c = 'x'")).toBe(
      '<span class="tok-keyword">SELECT</span> name <span class="tok-keyword">FROM</span> t <span class="tok-keyword">WHERE</span> n &gt; <span class="tok-number">3</span> <span class="tok-keyword">AND</span> c = <span class="tok-string">\'x\'</span>',
    );
  });

  it('does not highlight keywords inside strings, and escapes HTML', () => {
    expect(highlightSql("'select <b>'")).toBe('<span class="tok-string">\'select &lt;b&gt;\'</span>');
  });

  it('keeps the original text when the tags are stripped', () => {
    const sql = "SELECT a || ' ' || b AS full_name -- note\nFROM people WHERE id IN (1, 2);";
    const text = highlightSql(sql).replace(/<[^>]+>/g, '').replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
    expect(text).toBe(sql);
  });
});
