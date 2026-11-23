import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { KeyBadges } from '../components/SchemaPanel';
import { lessonPath, lessons } from '../content/loader';
import { getSchema } from '../engine/client';
import type { ColumnSchema, TableSchema } from '../engine/core';

/** Lessons the guide links to. A test checks that each id still exists. */
export const GUIDE_LESSON_IDS = ['joins.inner', 'joins.left', 'joins.many-tables', 'joins.self', 'aggregates.missing-values'];

function LessonLink({ id, children }: { id: string; children: ReactNode }) {
  const lesson = lessons.find((l) => l.id === id);
  return lesson ? <Link to={lessonPath(lesson)}>{children}</Link> : <>{children}</>;
}

// ---------- small schema diagrams ----------

type Col = Pick<ColumnSchema, 'name' | 'pk' | 'references'>;
const pk = (name: string): Col => ({ name, pk: true });
const col = (name: string): Col => ({ name, pk: false });
const fk = (name: string, target: string, isPk = false): Col => {
  const [table, column] = target.split('.');
  return { name, pk: isPk, references: { table, column } };
};

function TableCard({ name, cols }: { name: string; cols: Col[] }) {
  return (
    <div className="fig-table">
      <div className="fig-title">{name}</div>
      <ul>
        {cols.map((c) => (
          <li key={c.name}>
            <span>{c.name}</span>
            <KeyBadges column={c} />
          </li>
        ))}
      </ul>
    </div>
  );
}

/** The line between two table cards, labelled with how many rows sit on each end. */
function Connector({ left, right }: { left: string; right: string }) {
  return (
    <div className="fig-link" aria-hidden>
      <span>{left}</span>
      <span className="line" />
      <span>{right}</span>
    </div>
  );
}

function Figure({ caption, children }: { caption: ReactNode; children: ReactNode }) {
  return (
    <figure className="schema-fig">
      <div className="fig-row">{children}</div>
      <figcaption>{caption}</figcaption>
    </figure>
  );
}

function Snippet({ children }: { children: string }) {
  return (
    <pre className="snippet">
      <code>{children}</code>
    </pre>
  );
}

// ---------- dataset explorer: real tables, keys and links, loaded when opened ----------

const DATASETS = [
  {
    id: 'school',
    blurb: 'A university: colleges, instructors, courses, students, and which students take which courses.',
  },
  { id: 'store', blurb: 'An electronics shop: customers, products, orders, and the items in each order.' },
  {
    id: 'chinook',
    blurb: 'A digital music store with 11 tables: artists, albums, tracks, playlists, customers, invoices and employees.',
  },
  { id: 'penguins', blurb: 'One table of 344 penguins. Nothing to join, which makes it ideal for filtering and aggregates.' },
];

function DatasetDetails({ schema }: { schema: TableSchema[] }) {
  const links = schema.flatMap((t) =>
    t.columns.flatMap((c) =>
      c.references ? [{ from: `${t.name}.${c.name}`, to: `${c.references.table}${c.references.column ? `.${c.references.column}` : ''}` }] : [],
    ),
  );
  return (
    <>
      <div className="dataset-tables">
        {schema.map((t) => (
          <TableCard key={t.name} name={t.name} cols={t.columns} />
        ))}
      </div>
      {links.length > 0 ? (
        <div>
          <h4>How the tables link</h4>
          <ul className="link-list">
            {links.map((l) => (
              <li key={l.from}>
                <code>{l.from}</code> → <code>{l.to}</code>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="meta">No foreign keys: everything is in one table.</p>
      )}
    </>
  );
}

function DatasetExplorer({ id, blurb }: { id: string; blurb: string }) {
  const [open, setOpen] = useState(false);
  const [schema, setSchema] = useState<TableSchema[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || schema) return;
    setError(null);
    getSchema(id).then(setSchema, (e: Error) => setError(e.message));
  }, [open, schema, id]);

  return (
    <details className="dataset" onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary>
        <code className="dataset-name">{id}</code>
        <span>{blurb}</span>
      </summary>
      <div className="dataset-body">
        {error ? (
          <p className="error">{error}</p>
        ) : schema ? (
          <DatasetDetails schema={schema} />
        ) : (
          <p className="placeholder">Loading tables…</p>
        )}
        <p>
          <Link className="btn small" to={`/playground?dataset=${id}`}>
            Open {id} in the playground
          </Link>
        </p>
      </div>
    </details>
  );
}

// ---------- the page ----------

export function Guide() {
  return (
    <div className="page guide">
      <h1>How database schemas work</h1>
      <p className="lead">
        A schema is a database's blueprint: which tables exist, what columns each one has, and how the tables connect.
        Reading it first is the fastest way to write a query that works. Every lesson's <strong>Schema</strong> tab shows
        the schema of the data you're querying.
      </p>

      <section aria-labelledby="blocks">
        <h2 id="blocks">The building blocks</h2>
        <div className="prose">
          <p>
            A <strong>table</strong> holds one kind of thing: students, orders, tracks. Each <strong>row</strong> is one
            of those things, and each <strong>column</strong> is one fact about it, with a type such as{' '}
            <code>INTEGER</code>, <code>REAL</code> (a decimal number) or <code>TEXT</code>.
          </p>
          <p>
            A <strong>primary key</strong> <abbr className="key-badge pk">PK</abbr> is a column whose value is different
            in every row, so it identifies exactly one row. It's usually called <code>id</code>.
          </p>
          <p>
            A <strong>foreign key</strong> <abbr className="key-badge fk">FK</abbr> is a column that stores another
            table's primary key. It's how one row points to a row in another table. Here's a real slice of the{' '}
            <code>store</code> dataset:
          </p>
        </div>

        <div className="key-demo">
          <div>
            <h3>customers</h3>
            <table className="grid">
              <thead>
                <tr>
                  <th>id <abbr className="key-badge pk">PK</abbr></th>
                  <th>name</th>
                  <th>city</th>
                </tr>
              </thead>
              <tbody>
                <tr><td className="num tint-1">1</td><td>Aurora Shop</td><td>San Fernando</td></tr>
                <tr><td className="num tint-2">2</td><td>Benito Dela Paz</td><td>Laoag</td></tr>
                <tr><td className="num tint-3">3</td><td>Cecilia Ong</td><td>Manila</td></tr>
              </tbody>
            </table>
          </div>
          <div>
            <h3>orders</h3>
            <table className="grid">
              <thead>
                <tr>
                  <th>id <abbr className="key-badge pk">PK</abbr></th>
                  <th>customer_id <abbr className="key-badge fk">FK</abbr></th>
                  <th>ordered_on</th>
                </tr>
              </thead>
              <tbody>
                <tr><td className="num">4</td><td className="num tint-1">1</td><td>2025-01-28</td></tr>
                <tr><td className="num">5</td><td className="num tint-3">3</td><td>2025-01-24</td></tr>
                <tr><td className="num">9</td><td className="num tint-1">1</td><td>2025-01-17</td></tr>
                <tr><td className="num">20</td><td className="num tint-2">2</td><td>2025-03-27</td></tr>
              </tbody>
            </table>
          </div>
        </div>
        <div className="prose">
          <p>
            Orders 4 and 9 both have <code>customer_id</code> 1, so both belong to Aurora Shop. A join follows exactly
            that pointer:
          </p>
          <Snippet>{`SELECT o.id, o.ordered_on, c.name
FROM orders o
JOIN customers c ON c.id = o.customer_id;`}</Snippet>
          <p>
            The <code>ON</code> line of a join almost always pairs a foreign key with the primary key it points to. Find
            the <abbr className="key-badge fk">FK</abbr> and you've found the join.
          </p>
        </div>
      </section>

      <section aria-labelledby="reading">
        <h2 id="reading">Reading a schema before you query</h2>
        <ol className="steps">
          <li>
            <strong>Find the table</strong> that holds the thing the question is about. "Which tracks…" starts at{' '}
            <code>Track</code>.
          </li>
          <li>
            <strong>Find the columns</strong> you need to show or filter on. If they're all in that table, you don't
            need a join.
          </li>
          <li>
            <strong>Follow the foreign keys</strong> to reach any other table you need, one join per step.
          </li>
        </ol>
      </section>

      <section aria-labelledby="patterns">
        <h2 id="patterns">How tables connect</h2>
        <p className="lead">
          Almost every database is built from the same handful of patterns. QueryLab's datasets include all of them.
        </p>

        <article className="pattern">
          <h3>One-to-many</h3>
          <Figure caption="One customer has many orders; each order belongs to one customer.">
            <TableCard name="customers" cols={[pk('id'), col('name'), col('city')]} />
            <Connector left="one" right="many" />
            <TableCard name="orders" cols={[pk('id'), fk('customer_id', 'customers.id'), col('ordered_on')]} />
          </Figure>
          <div className="prose">
            <p>
              The most common pattern. The foreign key always lives on the <em>many</em> side: an order stores its
              customer's id, never the other way round, because a customer can't hold a list of order ids in one
              column. In QueryLab: <code>store</code> (customers → orders) and <code>school</code> (colleges →
              students). Practise it in <LessonLink id="joins.inner">INNER JOIN</LessonLink>.
            </p>
          </div>
        </article>

        <article className="pattern">
          <h3>Many-to-many, through a linking table</h3>
          <Figure caption="A student takes many courses and a course has many students. Each row of enrollments is one student in one course.">
            <TableCard name="students" cols={[pk('id'), col('first_name')]} />
            <Connector left="one" right="many" />
            <TableCard
              name="enrollments"
              cols={[fk('student_id', 'students.id', true), fk('course_id', 'courses.id', true), col('grade')]}
            />
            <Connector left="many" right="one" />
            <TableCard name="courses" cols={[pk('id'), col('code')]} />
          </Figure>
          <div className="prose">
            <p>
              Neither side can store a single pointer to the other, so a third table stores one row per pair. Its
              primary key is often the two foreign keys together (a <em>composite</em> key), which stops the same
              student enrolling in the same course twice. To go from one side to the other, join through the linking
              table:
            </p>
            <Snippet>{`SELECT s.first_name, c.code
FROM students s
JOIN enrollments e ON e.student_id = s.id
JOIN courses c ON c.id = e.course_id;`}</Snippet>
            <p>
              In QueryLab: <code>school</code> (enrollments), <code>store</code> (order_items between orders and
              products) and <code>chinook</code> (PlaylistTrack between Playlist and Track). Practise it in{' '}
              <LessonLink id="joins.many-tables">Joining three or more tables</LessonLink>.
            </p>
          </div>
        </article>

        <article className="pattern">
          <h3>Chains</h3>
          <Figure caption="A track belongs to an album, and an album belongs to an artist.">
            <TableCard name="Track" cols={[pk('TrackId'), col('Name'), fk('AlbumId', 'Album.AlbumId')]} />
            <Connector left="many" right="one" />
            <TableCard name="Album" cols={[pk('AlbumId'), col('Title'), fk('ArtistId', 'Artist.ArtistId')]} />
            <Connector left="many" right="one" />
            <TableCard name="Artist" cols={[pk('ArtistId'), col('Name')]} />
          </Figure>
          <div className="prose">
            <p>
              One-to-many links often line up in a row. There's no shortcut from <code>Track</code> to{' '}
              <code>Artist</code>: you pass through <code>Album</code>, one join per arrow. Build the query one join at
              a time and run it after each one.
            </p>
          </div>
        </article>

        <article className="pattern">
          <h3>A table that points to itself</h3>
          <Figure caption="ReportsTo holds the EmployeeId of the employee's manager, who is a row in the same table.">
            <TableCard name="Employee (e)" cols={[pk('EmployeeId'), col('FirstName'), fk('ReportsTo', 'Employee.EmployeeId')]} />
            <Connector left="many" right="one" />
            <TableCard name="Employee (m)" cols={[pk('EmployeeId'), col('FirstName')]} />
          </Figure>
          <div className="prose">
            <p>
              Staff and managers, categories and subcategories, replies to comments: whenever a thing relates to
              another thing of the same kind, the foreign key points back into its own table. Query it by joining the
              table to itself under two aliases, drawn here as two copies. Practise it in{' '}
              <LessonLink id="joins.self">Joining a table to itself</LessonLink>.
            </p>
          </div>
        </article>

        <article className="pattern">
          <h3>Lookup tables</h3>
          <Figure caption="Each track stores a GenreId instead of repeating the genre's name.">
            <TableCard name="Track" cols={[pk('TrackId'), col('Name'), fk('GenreId', 'Genre.GenreId')]} />
            <Connector left="many" right="one" />
            <TableCard name="Genre" cols={[pk('GenreId'), col('Name')]} />
          </Figure>
          <div className="prose">
            <p>
              A lookup table is a short list of names, like <code>Genre</code> and <code>MediaType</code> in Chinook.
              Storing the id instead of the text means a name is spelled once, can be fixed in one place, and can't be
              typed two different ways. You'll join to a lookup table whenever you need the readable name.
            </p>
          </div>
        </article>

        <article className="pattern">
          <h3>Optional links</h3>
          <div className="prose">
            <p>
              A foreign key can be <code>NULL</code>, meaning "not linked to anything". In <code>school</code>, one
              course has no instructor yet, so its <code>instructor_id</code> is <code>NULL</code>. An inner join drops
              that course; a <code>LEFT JOIN</code> keeps it. When a question says "including those without…", look
              for a foreign key that can be <code>NULL</code>. Practise it in{' '}
              <LessonLink id="joins.left">LEFT JOIN</LessonLink>.
            </p>
          </div>
        </article>

        <article className="pattern">
          <h3>One wide table</h3>
          <Figure caption="Every fact about a penguin sits in its own row; values like the island name repeat.">
            <TableCard
              name="penguins"
              cols={[pk('id'), col('species'), col('island'), col('body_mass_g'), col('sex'), col('year')]}
            />
          </Figure>
          <div className="prose">
            <p>
              Not every dataset needs several tables. <code>penguins</code> has no foreign keys at all, so there's
              nothing to join, and every question is answered with filters and aggregates. The trade-off is
              repetition: "Biscoe" is typed out for every penguin on that island. If islands had more facts, such as
              size or location, a schema designer would move them into an <code>islands</code> table and store an{' '}
              <code>island_id</code> instead. Splitting data like this to avoid repetition is called{' '}
              <strong>normalization</strong>. Practise with this table in{' '}
              <LessonLink id="aggregates.missing-values">Missing values in aggregates</LessonLink>.
            </p>
          </div>
        </article>
      </section>

      <section aria-labelledby="naming">
        <h2 id="naming">Same ideas, different naming styles</h2>
        <div className="prose">
          <p>Databases are designed by different people, and their names show it:</p>
          <table className="grid naming">
            <thead>
              <tr>
                <th></th>
                <th>school, store</th>
                <th>chinook</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Table names</td><td>plural, lowercase: <code>customers</code></td><td>singular, capitalised: <code>Customer</code></td></tr>
              <tr><td>Primary key</td><td><code>id</code></td><td>table name + Id: <code>CustomerId</code></td></tr>
              <tr><td>Foreign key</td><td><code>customer_id</code></td><td><code>CustomerId</code> (same name as the key it points to)</td></tr>
              <tr><td>Column style</td><td>snake_case: <code>first_name</code></td><td>PascalCase: <code>FirstName</code></td></tr>
            </tbody>
          </table>
          <p>
            Neither is wrong. Match the style of the database you're working in, and remember that SQLite ignores case
            in names, so <code>customer</code> and <code>Customer</code> refer to the same table. Text <em>values</em>{' '}
            are different: <code>'AC/DC' = 'ac/dc'</code> is false.
          </p>
          <p>
            Column types vary too. Chinook was written for many databases, so it uses type names like{' '}
            <code>NVARCHAR(40)</code> and <code>DATETIME</code>. SQLite accepts them and stores the values as text or
            numbers.
          </p>
        </div>
      </section>

      <section aria-labelledby="datasets">
        <h2 id="datasets">Explore QueryLab's datasets</h2>
        <p className="lead">
          Open a dataset to see its real tables, keys and links, read straight from the database.
        </p>
        {DATASETS.map((d) => (
          <DatasetExplorer key={d.id} id={d.id} blurb={d.blurb} />
        ))}
      </section>
    </div>
  );
}
