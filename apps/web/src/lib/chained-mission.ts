import type { ChainAction, ChainState } from "@/types/result";

/**
 * Initial idle state for chained mission discovery.
 */
export const initialChainState: ChainState = { status: "idle" };

/**
 * Generates a unique composite key representing a pair of primary and secondary missions.
 *
 * Used for deduplicating in-flight chained mission requests and validating URL replay state.
 *
 * @param primaryMissionId - Unique identifier of the primary activity (Activity 1).
 * @param secondaryMissionId - Unique identifier of the chained secondary activity (Activity 2).
 * @returns A colon-separated composite key (e.g. `"MIS-001:MIS-002"`).
 */
export function getChainPairKey(
  primaryMissionId: string,
  secondaryMissionId: string,
): string {
  return `${primaryMissionId}:${secondaryMissionId}`;
}

/**
 * Criteria required to determine whether a chained mission from URL search parameters
 * should be replayed.
 */
export type ReplayCheck = {
  /** Primary mission ID specified in the URL query string. */
  selectedPrimaryMissionId?: string;
  /** Secondary mission ID specified in the URL query string. */
  selectedSecondaryMissionId?: string;
  /** Mission ID of the currently loaded primary recommendation. */
  recommendationMissionId?: string;
  /** Composite key of the currently loaded or in-flight mission pair, or null if unchained. */
  currentPairKey: string | null;
};

/**
 * Checks whether we should fetch a second activity from the URL parameters
 * (for example, when someone opens a bookmarked or shared link with two activities).
 *
 * To avoid sending unnecessary or broken network requests, it makes sure:
 * 1. Both a first and second activity ID actually exist in the web link.
 * 2. The first activity currently on screen actually matches the primary ID in the link
 *    (preventing us from pairing a second activity with the wrong mission).
 * 3. We haven't already fetched or loaded this exact mission pair.
 *
 * @param input - The link parameters and currently displayed mission information.
 * @returns `true` if we should proceed with fetching the second activity; otherwise `false`.
 */
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

/**
 * State updater that tracks the second activity's search and display status.
 *
 * Think of this as a traffic controller with five clear statuses:
 * - `"idle"`: Ready and waiting for the parent to slide or tap `+ Add Activity`.
 * - `"loading"`: Currently asking the server for a second activity at this park.
 * - `"loaded"`: Successfully found an activity! Ready to show on the second card.
 * - `"unavailable"`: Checked the park, but there are no other activities matching the time/age criteria.
 * - `"error"`: Something went wrong (such as losing internet connection).
 *
 * Whenever a new event happens (like starting a search or receiving results),
 * this function produces the updated status and mission payload.
 *
 * @param state - The current status of the second activity.
 * @param action - What just happened (e.g. started searching, succeeded, failed, or reset).
 * @returns The new status object.
 */
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
