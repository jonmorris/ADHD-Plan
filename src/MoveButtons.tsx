// Up arrow; the down button rotates it
const ARROW = (
  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
    <path
      d="M12 19V5M5 12l7-7 7 7"
      fill="none"
      stroke="currentColor"
      stroke-width="3"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
)

type Props = { label: string; first: boolean; last: boolean; move: (step: -1 | 1) => void }

export function MoveButtons({ label, first, last, move }: Props) {
  return (
    <span class="move">
      <button aria-label={`Move ${label} up`} disabled={first} onClick={() => move(-1)}>
        {ARROW}
      </button>
      <button aria-label={`Move ${label} down`} class="down" disabled={last} onClick={() => move(1)}>
        {ARROW}
      </button>
    </span>
  )
}
