import type { ChainAction, ChainState } from "@/types/result";

export const initialChainState: ChainState = { status: "idle" };

export function getChainPairKey(
  primaryMissionId: string,
  secondaryMissionId: string,
): string {
  return `${primaryMissionId}:${secondaryMissionId}`;
}

type ReplayCheck = {
  selectedPrimaryMissionId?: string;
  selectedSecondaryMissionId?: string;
  recommendationMissionId?: string;
  currentPairKey: string | null;
};

/** Prevents URL replay from running against a stale primary recommendation. */
export function shouldReplayChain(input: ReplayCheck): boolean {
  if (
    !input.selectedPrimaryMissionId ||
    !input.selectedSecondaryMissionId ||
    input.recommendationMissionId !== input.selectedPrimaryMissionId
  ) {
    return false;
  }

  return (
    input.currentPairKey !==
    getChainPairKey(
      input.selectedPrimaryMissionId,
      input.selectedSecondaryMissionId,
    )
  );
}

/** Keeps chained recommendation request and display states explicit. */
export function chainReducer(
  state: ChainState,
  action: ChainAction,
): ChainState {
  if (action.type === "reset") return initialChainState;
  if (action.type === "start") {
    return state.status === "loading" ? state : { status: "loading" };
  }
  if (action.type === "success") {
    return { status: "loaded", recommendation: action.recommendation };
  }
  if (action.type === "unavailable") return { status: "unavailable" };
  return { status: "error" };
}
