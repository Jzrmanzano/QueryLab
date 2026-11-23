/** A mark for the pad's margin: the item's number, or the teacher's red check once it's solved.
 *  The mark itself is visual; pass `label` for what a screen reader should hear instead.
 *  `fresh` draws the check stroke by stroke; use it only right after something was solved. */
export function Mark({ n, solved, fresh = false, label }: { n: number | string; solved: boolean; fresh?: boolean; label?: string }) {
  return (
    <span className={`mark${solved && fresh ? ' fresh' : ''}`}>
      {solved ? (
        <svg viewBox="0 0 26 26" aria-hidden="true">
          <path d="M4 14 L10 20 L22 5" />
        </svg>
      ) : (
        <span className="num" aria-hidden="true">
          {n}
        </span>
      )}
      {label && <span className="sr-only">{label}</span>}
    </span>
  );
}
