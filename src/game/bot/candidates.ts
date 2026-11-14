import { cardById, type Decision, type PendingDecision } from '../rules'

type DecisionOf<Kind extends Decision['kind']> = Extract<Decision, { kind: Kind }>

/** Kinds of decision whose answer is a set of rondel slots. */
export type SlotSetDecision = DecisionOf<'mediaFlip' | 'combOverturn' | 'sitePrepFlip'>

export function isSlotSetDecision(decision: Decision): decision is SlotSetDecision {
  return decision.kind === 'mediaFlip' || decision.kind === 'combOverturn' || decision.kind === 'sitePrepFlip'
}

export function withSlots(decision: SlotSetDecision, slots: number[]): SlotSetDecision {
  return { ...decision, slots }
}

/** The whole set, then the empty set, then each single slot: the subsets worth trying first. */
function slotSets(options: readonly number[], maxSize: number): number[][] {
  const largest = options.slice(0, maxSize)
  return [largest, [], ...options.map((slot) => [slot])]
}

function leverageCandidates(pending: Extract<PendingDecision, { kind: 'leveragePick' }>): Decision[] {
  return pending.cardIds.flatMap((cardId): Decision[] => {
    const issues = cardById(cardId).issues
    const ups: Array<DecisionOf<'leveragePick'>['up']> = pending.canSwap ? [...issues, 'swap'] : [...issues]
    const effectOnly: Decision = { kind: 'leveragePick', cardId, playEffect: true, up: null }
    const upOnly = ups.map((up): Decision => ({ kind: 'leveragePick', cardId, playEffect: false, up }))
    const both = pending.canDoBoth ? ups.map((up): Decision => ({ kind: 'leveragePick', cardId, playEffect: true, up })) : []
    return [effectOnly, ...upOnly, ...both]
  })
}

function investCandidates(pending: Extract<PendingDecision, { kind: 'invest' }>): Decision[] {
  const transfers = pending.sources.flatMap((source) =>
    source.to.flatMap((to) =>
      Array.from({ length: pending.maxAmount }, (_, index) => ({ from: source.from, to, amount: index + 1 })),
    ),
  )
  return [{ kind: 'invest', transfer: null }, ...transfers.map((transfer): Decision => ({ kind: 'invest', transfer }))]
}

/**
 * Every answer worth simulating for a decision. Where the space is large (subsets of rondel
 * tiles) it is cut down to a handful of sensible subsets. The kinds the bot answers by a fixed
 * rule (`speakersFavor`, `gavelPass`) are not listed here.
 */
export function candidateDecisions(pending: PendingDecision): Decision[] {
  switch (pending.kind) {
    case 'rondelMove':
      return pending.options.map((option) => ({ kind: 'rondelMove', steps: option.steps }))
    case 'crossPartyFlip':
      return [true, false].map((flip) => ({ kind: 'crossPartyFlip', flip }))
    case 'developExtraRally':
      return [null, ...pending.options].map((slot) => ({ kind: 'developExtraRally', slot }))
    case 'sitePrepFlip':
      return slotSets(pending.options, pending.options.length).map((slots) => ({ kind: 'sitePrepFlip', slots }))
    case 'mediaFlip':
      return slotSets(pending.options, pending.maxFlips).map((slots) => ({ kind: 'mediaFlip', slots }))
    case 'combOverturn':
      return slotSets(pending.options, pending.options.length).map((slots) => ({ kind: 'combOverturn', slots }))
    case 'pressCycleRally':
      return [null, ...pending.options].map((slot) => ({ kind: 'pressCycleRally', slot }))
    case 'leveragePick':
      return leverageCandidates(pending)
    case 'dance':
      return pending.pawns.flatMap((pawn) =>
        pawn.destinations.map((destination): Decision => ({ kind: 'dance', pawnId: pawn.pawnId, to: destination.cell })),
      )
    case 'waggleSweep':
      return [null, ...pending.options].map((cell) => ({ kind: 'waggleSweep', cell }))
    case 'invest':
      return investCandidates(pending)
    case 'longFlight':
      return pending.pawns.flatMap((pawn) =>
        pawn.destinations.map((to): Decision => ({ kind: 'longFlight', pawnId: pawn.pawnId, to })),
      )
    case 'longFlightRally':
      return [null, ...pending.options].map((cell) => ({ kind: 'longFlightRally', cell }))
    case 'dissidentRally':
      return pending.options.map((site) => ({ kind: 'dissidentRally', site }))
    case 'wardSweep':
      return pending.options.map((district) => ({ kind: 'wardSweep', district }))
    case 'blueprintRevision':
      return pending.options.map((action) => ({ kind: 'blueprintRevision', action }))
    case 'reserveDeployment':
      return pending.options.map((action) => ({ kind: 'reserveDeployment', action }))
    case 'forcedDown':
      return pending.targets.flatMap((target) =>
        pending.issues.map((issue): Decision => ({ kind: 'forcedDown', target, issue })),
      )
    case 'forcedUp':
      return pending.options.map((issue) => ({ kind: 'forcedUp', issue }))
    case 'speakersFavor':
    case 'gavelPass':
      return []
  }
}
