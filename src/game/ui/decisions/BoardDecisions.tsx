import { useMemo, useState } from 'react'
import { HUB_CELL_KEY, type CellKey } from '../../board/geometry'
import type { PendingOf } from '../../rules/tasks'
import { spatialSelection, useRegisterSpatialSelection } from '../spatial'
import { districtCells, splitSites } from './helpers'
import { DECISION_LABELS } from './labels'
import { ButtonRow, ChoiceButton, ConfirmButton, DecisionFrame, DeclineButton, IssueLabel, useSendDecision } from './parts'

interface PawnOption {
  pawnId: number
  from: CellKey
}

function describePawn(option: PawnOption, index: number): string {
  return `Pawn ${index + 1}${option.from === HUB_CELL_KEY ? ' (in the hub)' : ''}`
}

/**
 * Which of the player's pawns is being moved. With one pawn it is chosen already; with several
 * the player picks by button, or by clicking the pawn's hex (the first pawn there).
 */
function usePawnChoice<Option extends PawnOption>(pawns: readonly Option[]) {
  const [chosenId, setChosenId] = useState<number | null>(null)
  const chosen = pawns.length === 1 ? pawns[0] : (pawns.find((option) => option.pawnId === chosenId) ?? null)
  return { chosen, choose: setChosenId, clear: () => setChosenId(null), hasChoice: pawns.length > 1 }
}

function PawnButtons({ pawns, chosenId, onChoose }: { pawns: readonly PawnOption[]; chosenId: number | null; onChoose: (id: number) => void }) {
  if (pawns.length < 2) return null
  return (
    <ButtonRow>
      {pawns.map((option, index) => (
        <ChoiceButton key={option.pawnId} isSelected={option.pawnId === chosenId} onClick={() => onChoose(option.pawnId)}>
          {describePawn(option, index)}
        </ChoiceButton>
      ))}
    </ButtonRow>
  )
}

export function DanceView({ pending }: { pending: PendingOf<'dance'> }) {
  const send = useSendDecision()
  const { chosen: pawn, choose, clear, hasChoice } = usePawnChoice(pending.pawns)
  const [destinationCell, setDestinationCell] = useState<CellKey | null>(null)
  const destination = pawn?.destinations.find((option) => option.cell === destinationCell) ?? null

  const selection = useMemo(() => {
    if (!pawn) {
      return spatialSelection({
        clickableCells: new Set(pending.pawns.map((option) => option.from)),
        onCellClick: (cell) => {
          const clicked = pending.pawns.find((option) => option.from === cell)
          if (clicked) choose(clicked.pawnId)
        },
      })
    }
    return spatialSelection({
      clickableCells: new Set(pawn.destinations.map((option) => option.cell)),
      selectedCells: new Set([pawn.from, ...(destination ? [destination.cell] : [])]),
      previewCells: new Set(destination?.rallies ?? []),
      onCellClick: setDestinationCell,
    })
  }, [pawn, destination, pending.pawns, choose])
  useRegisterSpatialSelection(selection)

  const hint = pawn
    ? 'Click a highlighted hex to see which hexes you would rally there (dashed), then confirm.'
    : 'Choose which pawn dances: click it on the board or use the buttons.'
  const tieNote = pending.canTie ? ' Upgraded: being tied is enough to take control.' : ''
  return (
    <DecisionFrame title={DECISION_LABELS.dance.forActor} hint={`${hint}${tieNote}`}>
      <PawnButtons
        pawns={pending.pawns}
        chosenId={pawn?.pawnId ?? null}
        onChoose={(id) => {
          choose(id)
          setDestinationCell(null)
        }}
      />
      {pawn && (
        <ButtonRow>
          <ConfirmButton
            label={destination ? `Dance ${destination.steps} ${destination.steps === 1 ? 'step' : 'steps'}, rally ${destination.rallies.length} ${destination.rallies.length === 1 ? 'hex' : 'hexes'}` : 'Choose a destination'}
            disabled={destination === null}
            onClick={() => destination && send({ kind: 'dance', pawnId: pawn.pawnId, to: destination.cell })}
          />
          {hasChoice && <DeclineButton label="Choose another pawn" onClick={() => {
              clear()
              setDestinationCell(null)
            }} />}
        </ButtonRow>
      )}
    </DecisionFrame>
  )
}

export function WaggleSweepView({ pending }: { pending: PendingOf<'waggleSweep'> }) {
  const send = useSendDecision()
  const selection = useMemo(
    () =>
      spatialSelection({
        clickableCells: new Set(pending.options),
        onCellClick: (cell) => send({ kind: 'waggleSweep', cell }),
      }),
    [pending.options, send],
  )
  useRegisterSpatialSelection(selection)
  return (
    <DecisionFrame
      title={DECISION_LABELS.waggleSweep.forActor}
      hint="Count as being on 4 of the issue for one of the hexes this Dance rallies. Click the hex, or skip."
    >
      <DeclineButton label="No bonus" onClick={() => send({ kind: 'waggleSweep', cell: null })} />
    </DecisionFrame>
  )
}

export function LongFlightView({ pending }: { pending: PendingOf<'longFlight'> }) {
  const send = useSendDecision()
  const { chosen: pawn, choose } = usePawnChoice(pending.pawns)
  const selection = useMemo(() => {
    if (!pawn) {
      return spatialSelection({
        clickableCells: new Set(pending.pawns.map((option) => option.from)),
        onCellClick: (cell) => {
          const clicked = pending.pawns.find((option) => option.from === cell)
          if (clicked) choose(clicked.pawnId)
        },
      })
    }
    return spatialSelection({
      clickableCells: new Set(pawn.destinations),
      selectedCells: new Set([pawn.from]),
      onCellClick: (cell) => send({ kind: 'longFlight', pawnId: pawn.pawnId, to: cell }),
    })
  }, [pawn, pending.pawns, choose, send])
  useRegisterSpatialSelection(selection)
  return (
    <DecisionFrame
      title={DECISION_LABELS.longFlight.forActor}
      hint={pawn ? 'Click any highlighted hex without a pawn on it.' : 'Choose which pawn flies: click it on the board or use the buttons.'}
    >
      <PawnButtons pawns={pending.pawns} chosenId={pawn?.pawnId ?? null} onChoose={choose} />
    </DecisionFrame>
  )
}

export function LongFlightRallyView({ pending }: { pending: PendingOf<'longFlightRally'> }) {
  const send = useSendDecision()
  const selection = useMemo(
    () =>
      spatialSelection({
        clickableCells: new Set(pending.options),
        onCellClick: (cell) => send({ kind: 'longFlightRally', cell }),
      }),
    [pending.options, send],
  )
  useRegisterSpatialSelection(selection)
  return (
    <DecisionFrame title={DECISION_LABELS.longFlightRally.forActor} hint="Click a highlighted hex next to where the pawn landed, or skip.">
      <DeclineButton label="Skip the rally" onClick={() => send({ kind: 'longFlightRally', cell: null })} />
    </DecisionFrame>
  )
}

export function DissidentRallyView({ pending }: { pending: PendingOf<'dissidentRally'> }) {
  const send = useSendDecision()
  const selection = useMemo(() => {
    const { cells, slots } = splitSites(pending.options)
    return spatialSelection({
      clickableCells: cells,
      clickableSlots: slots,
      onCellClick: (cell) => send({ kind: 'dissidentRally', site: { type: 'cell', cell } }),
      onSlotClick: (slot) => send({ kind: 'dissidentRally', site: { type: 'rondel', slot } }),
    })
  }, [pending.options, send])
  useRegisterSpatialSelection(selection)
  return (
    <DecisionFrame
      title={DECISION_LABELS.dissidentRally.forActor}
      hint="Take control of any tile you do not control yet, ignoring the comparison. Click a highlighted tile on the board or the rondel."
    />
  )
}

export function WardSweepView({ pending }: { pending: PendingOf<'wardSweep'> }) {
  const send = useSendDecision()
  const [district, setDistrict] = useState<PendingOf<'wardSweep'>['options'][number] | null>(null)
  const selection = useMemo(
    () => spatialSelection({ previewCells: new Set(district ? districtCells(district) : []) }),
    [district],
  )
  useRegisterSpatialSelection(selection)
  return (
    <DecisionFrame title={DECISION_LABELS.wardSweep.forActor} hint="Rally every hex in one district, its printed hex included. The district you pick is outlined on the board.">
      <ButtonRow>
        {pending.options.map((issue) => (
          <ChoiceButton key={issue} isSelected={issue === district} onClick={() => setDistrict(issue)}>
            <IssueLabel issue={issue} />
          </ChoiceButton>
        ))}
      </ButtonRow>
      <ConfirmButton
        label={district ? `Rally the ${district} district` : 'Choose a district'}
        disabled={district === null}
        onClick={() => district && send({ kind: 'wardSweep', district })}
      />
    </DecisionFrame>
  )
}
