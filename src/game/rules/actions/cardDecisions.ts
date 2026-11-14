import { IllegalMoveError } from 'game-kit/turns'
import { ACTION_IDS } from '../../art/actions'
import { ISSUES } from '../../board/palette'
import { RESERVE_STRENGTH } from '../constants'
import type { DecisionHandler } from '../handlers'
import { logEvent } from '../log'
import { adjustPosition } from '../positions'
import { rallySite } from '../rally'
import { allTileSites, describeSite, districtSites, flipTile, isSameSite, readSite, setSiteDisc } from '../sites'
import { pushTasks } from '../stack'
import { range, seatName, titleCase } from '../util'
import { assertDistinctSubset, assertOneOf } from './validation'

export const combOverturnHandler: DecisionHandler<'combOverturn'> = {
  describe(state, task) {
    const options = range(state.rondel.length).filter((slot) => state.rondel[slot] !== null)
    return options.length === 0 ? null : { kind: 'combOverturn', actor: task.seat, options }
  },

  apply(state, task, decision, pending) {
    assertDistinctSubset(decision.slots, pending.options, 'Comb Overturn flips tiles in the rondel')
    for (const slot of decision.slots) {
      const tile = state.rondel[slot]
      if (tile) flipTile(tile)
    }
    if (decision.slots.length > 0) logEvent(state, task.seat, `${seatName(task.seat)} flips ${decision.slots.length} rondel tile(s).`)
  },
}

export const dissidentRallyHandler: DecisionHandler<'dissidentRally'> = {
  describe(state, task) {
    const options = allTileSites(state).filter((site) => readSite(state, site)?.disc !== task.seat)
    return options.length === 0 ? null : { kind: 'dissidentRally', actor: task.seat, options }
  },

  apply(state, task, decision, pending) {
    if (!pending.options.some((site) => isSameSite(site, decision.site))) {
      throw new IllegalMoveError('Choose a tile you do not already control')
    }
    setSiteDisc(state, decision.site, task.seat)
    logEvent(state, task.seat, `${seatName(task.seat)} takes control of ${describeSite(state, decision.site)}.`)
  },
}

export const speakersFavorHandler: DecisionHandler<'speakersFavor'> = {
  describe: (state, task) => ({ kind: 'speakersFavor', actor: task.seat, options: range(state.playerCount) }),

  apply(state, task, decision, pending) {
    assertOneOf(decision.to, pending.options, 'Choose a player at the table')
    state.startPlayer = decision.to
    logEvent(state, task.seat, `${seatName(decision.to)} gets the start player marker from the next slot.`)
  },
}

export const wardSweepHandler: DecisionHandler<'wardSweep'> = {
  describe: (_state, task) => ({ kind: 'wardSweep', actor: task.seat, options: [...ISSUES] }),

  apply(state, task, decision) {
    assertOneOf(decision.district, ISSUES, 'Choose a district')
    for (const site of districtSites(state, decision.district)) {
      rallySite(state, task.seat, site, { canTie: false, countsAsFour: false })
    }
  },
}

export const blueprintRevisionHandler: DecisionHandler<'blueprintRevision'> = {
  describe(state, task) {
    const options = ACTION_IDS.filter((action) => state.players[task.seat].tiles[action] === 'basic')
    return options.length === 0 ? null : { kind: 'blueprintRevision', actor: task.seat, options }
  },

  apply(state, task, decision, pending) {
    assertOneOf(decision.action, pending.options, 'Choose one of your tiles that is not upgraded yet')
    state.players[task.seat].tiles[decision.action] = 'upgraded'
    logEvent(state, task.seat, `${seatName(task.seat)} upgrades the ${titleCase(decision.action)} tile.`)
  },
}

export const reserveDeploymentHandler: DecisionHandler<'reserveDeployment'> = {
  describe(state, task) {
    const plan = state.players[task.seat].plan ?? []
    const options = ACTION_IDS.filter((action) => !plan.includes(action))
    return options.length === 0 ? null : { kind: 'reserveDeployment', actor: task.seat, options }
  },

  apply(state, task, decision, pending) {
    assertOneOf(decision.action, pending.options, 'Choose one of your unprogrammed tiles')
    const side = state.players[task.seat].tiles[decision.action]
    logEvent(state, task.seat, `${seatName(task.seat)} deploys their ${titleCase(decision.action)} tile from reserve.`)
    pushTasks(state, { kind: 'startAction', seat: task.seat, action: decision.action, side, strength: RESERVE_STRENGTH })
  },
}

export const forcedDownHandler: DecisionHandler<'forcedDown'> = {
  describe: (state, task) => ({
    kind: 'forcedDown',
    actor: task.seat,
    targets: range(state.playerCount).filter((seat) => seat !== task.seat),
    issues: [...ISSUES],
  }),

  apply(state, task, decision, pending) {
    assertOneOf(decision.target, pending.targets, 'Choose another player')
    assertOneOf(decision.issue, pending.issues, 'Choose an issue')
    adjustPosition(state, decision.target, decision.issue, -1)
    logEvent(state, task.seat, `${seatName(decision.target)} is pushed down on ${decision.issue}.`)
    pushTasks(state, { kind: 'forcedUp', seat: decision.target, forbidden: decision.issue })
  },
}

export const forcedUpHandler: DecisionHandler<'forcedUp'> = {
  describe: (_state, task) => ({
    kind: 'forcedUp',
    actor: task.seat,
    options: ISSUES.filter((issue) => issue !== task.forbidden),
  }),

  apply(state, task, decision, pending) {
    assertOneOf(decision.issue, pending.options, `Choose an issue other than ${task.forbidden}`)
    adjustPosition(state, task.seat, decision.issue, 1)
    logEvent(state, task.seat, `${seatName(task.seat)} goes up on ${decision.issue}.`)
  },
}
