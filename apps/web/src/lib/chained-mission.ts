import type { ChainAction, ChainState } from "@/types/result";

export const initialChainState: ChainState = { status: "idle" };

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
