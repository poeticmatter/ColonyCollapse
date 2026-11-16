import { ACTION_POINTS_PER_TURN } from '../rules'

/** One pip per action point: filled while unspent. */
export function ActionPointPips({ points }: { points: number }) {
  return (
    <span className="inline-flex gap-1" role="img" aria-label={`${points} of ${ACTION_POINTS_PER_TURN} action points left`}>
      {Array.from({ length: ACTION_POINTS_PER_TURN }, (_, index) => (
        <span
          key={index}
          className={`h-3.5 w-3.5 rounded-full border-2 border-accent ${index < points ? 'bg-accent' : 'bg-transparent'}`}
        />
      ))}
    </span>
  )
}
