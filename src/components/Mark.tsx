/**
 * The mark: a hex with one edge drawn heavy.
 *
 * Which is the whole product in one shape — a piece of ground is only
 * interesting on the side where somebody else is standing.
 */
export function Mark({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M17 5.42 22 12l-5 6.58H7L2 12l5-6.58Z"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.3"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M17 5.42 22 12l-5 6.58"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
