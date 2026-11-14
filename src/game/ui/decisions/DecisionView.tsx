import type { PendingDecision } from '../../rules'
import { DanceView, DissidentRallyView, LongFlightRallyView, LongFlightView, WaggleSweepView, WardSweepView } from './BoardDecisions'
import { InvestView } from './InvestView'
import { LeveragePickView } from './LeverageView'
import {
  BlueprintRevisionView,
  ForcedDownView,
  ForcedUpView,
  GavelPassView,
  ReserveDeploymentView,
  SpeakersFavorView,
} from './PlayerChoiceDecisions'
import {
  CombOverturnView,
  CrossPartyFlipView,
  DevelopExtraRallyView,
  MediaFlipView,
  PressCycleRallyView,
  RondelMoveView,
  SitePrepFlipView,
} from './RondelDecisions'

/**
 * The controls for a pending decision, one component per kind. Only the player who must answer
 * is ever shown these: they hold choices others must not see (Leverage's cards, reserve tiles).
 * The switch is exhaustive, so adding a decision kind fails to compile until it has a view.
 */
export function DecisionView({ pending }: { pending: PendingDecision }) {
  switch (pending.kind) {
    case 'rondelMove':
      return <RondelMoveView pending={pending} />
    case 'crossPartyFlip':
      return <CrossPartyFlipView pending={pending} />
    case 'developExtraRally':
      return <DevelopExtraRallyView pending={pending} />
    case 'sitePrepFlip':
      return <SitePrepFlipView pending={pending} />
    case 'mediaFlip':
      return <MediaFlipView pending={pending} />
    case 'pressCycleRally':
      return <PressCycleRallyView pending={pending} />
    case 'leveragePick':
      return <LeveragePickView pending={pending} />
    case 'dance':
      return <DanceView pending={pending} />
    case 'waggleSweep':
      return <WaggleSweepView pending={pending} />
    case 'invest':
      return <InvestView pending={pending} />
    case 'combOverturn':
      return <CombOverturnView pending={pending} />
    case 'longFlight':
      return <LongFlightView pending={pending} />
    case 'longFlightRally':
      return <LongFlightRallyView pending={pending} />
    case 'dissidentRally':
      return <DissidentRallyView pending={pending} />
    case 'speakersFavor':
      return <SpeakersFavorView pending={pending} />
    case 'wardSweep':
      return <WardSweepView pending={pending} />
    case 'blueprintRevision':
      return <BlueprintRevisionView pending={pending} />
    case 'reserveDeployment':
      return <ReserveDeploymentView pending={pending} />
    case 'forcedDown':
      return <ForcedDownView pending={pending} />
    case 'forcedUp':
      return <ForcedUpView pending={pending} />
    case 'gavelPass':
      return <GavelPassView pending={pending} />
  }
}
