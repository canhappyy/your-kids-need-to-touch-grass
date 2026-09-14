import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getMissionSteps } from "@/lib/mission-instructions";
import type { Recommendation } from "@/types/recommendation";

/**
 * Props for the `MissionInstructionsDialog` modal dialog component.
 */
export type MissionInstructionsDialogProps = Pick<
  Recommendation,
  "title" | "instructionText"
>;

/**
 * Modal dialog presenting formatted step-by-step game rules and play instructions for a mission.
 *
 * @param props - Component properties containing the activity title and instruction text.
 */
export function MissionInstructionsDialog({
  title,
  instructionText,
}: MissionInstructionsDialogProps) {
  const steps = getMissionSteps(instructionText);

  return (
    <DialogContent className="max-h-[85svh] grid-rows-[auto_minmax(0,1fr)] gap-5 rounded-2xl bg-[#FDF6EA] p-6 sm:max-w-lg">
      <DialogHeader className="pr-7">
        <DialogTitle className="text-2xl leading-tight">{title}</DialogTitle>
        <DialogDescription>How to Play</DialogDescription>
      </DialogHeader>
      <div className="overflow-y-auto overscroll-contain break-words">
        {steps.length ? (
          <ul className="list-disc space-y-3 pl-5 text-base leading-relaxed text-zinc-800">
            {steps.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-zinc-600">
            Instructions unavailable for this activity.
          </p>
        )}
      </div>
    </DialogContent>
  );
}
