// Loads modules, lessons and exercises from /content at build time.
import { parse } from 'yaml';
import type { Check } from '../engine/compare';

export interface Exercise {
  id: string;
  prompt: string;
  dataset: string;
  starter?: string;
  solution: string;
  check?: Check;
  hints?: string[];
}

export interface Lesson {
  id: string;
  slug: string;       // file name, e.g. 01-first-query
  moduleSlug: string; // folder name, e.g. 01-select
  title: string;
  dataset: string;
  body: string;       // markdown
  exercises: Exercise[];
}

export interface Module {
  slug: string;
  title: string;
  summary: string;
  lessons: Lesson[];
}

type Files = Record<string, string>;
// Vite parses import.meta.glob statically: options must be an inline object literal, not a variable.
const moduleFiles = import.meta.glob('/content/modules/*/module.yaml', { query: '?raw', import: 'default', eager: true }) as Files;
const lessonFiles = import.meta.glob('/content/modules/*/*.md', { query: '?raw', import: 'default', eager: true }) as Files;
const exerciseFiles = import.meta.glob('/content/modules/*/*.exercises.yaml', { query: '?raw', import: 'default', eager: true }) as Files;

export function parseFrontmatter(md: string): { data: Record<string, unknown>; body: string } {
  const m = md.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!m) throw new Error('Lesson file is missing its --- frontmatter --- block');
  return { data: parse(m[1]) ?? {}, body: m[2] };
}

const folderOf = (path: string) => path.split('/').at(-2)!;
const fileOf = (path: string) => path.split('/').at(-1)!;

export const modules: Module[] = Object.entries(moduleFiles)
  .map(([path, yaml]) => {
    const slug = folderOf(path);
    const meta = parse(yaml) as { title: string; summary: string };
    const lessons = Object.entries(lessonFiles)
      .filter(([p]) => folderOf(p) === slug)
      .map(([p, md]): Lesson => {
        const { data, body } = parseFrontmatter(md);
        const lessonSlug = fileOf(p).replace(/\.md$/, '');
        const exPath = p.replace(/\.md$/, '.exercises.yaml');
        const exercises = (exerciseFiles[exPath] ? parse(exerciseFiles[exPath]) : []) as Exercise[];
        return {
          id: String(data.id),
          slug: lessonSlug,
          moduleSlug: slug,
          title: String(data.title),
          dataset: String(data.dataset),
          body,
          exercises: exercises ?? [],
        };
      })
      .sort((a, b) => a.slug.localeCompare(b.slug));
    return { slug, title: meta.title, summary: meta.summary, lessons };
  })
  .sort((a, b) => a.slug.localeCompare(b.slug));

export const lessons: Lesson[] = modules.flatMap((m) => m.lessons);
export const exercises: Exercise[] = lessons.flatMap((l) => l.exercises);

export function findLesson(moduleSlug?: string, lessonSlug?: string) {
  const index = lessons.findIndex((l) => l.moduleSlug === moduleSlug && l.slug === lessonSlug);
  return index === -1
    ? null
    : { lesson: lessons[index], module: modules.find((m) => m.slug === moduleSlug)!, prev: lessons[index - 1], next: lessons[index + 1] };
}

export const lessonPath = (l: Lesson) => `/learn/${l.moduleSlug}/${l.slug}`;
