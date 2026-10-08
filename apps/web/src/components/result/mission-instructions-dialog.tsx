import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getEquipmentList, getMissionSteps } from "@/lib/mission-instructions";
import type { Recommendation } from "@/types/recommendation";

/**
 * Props for the `MissionInstructionsDialog` modal dialog component.
 */
export type MissionInstructionsDialogProps = Pick<
  Recommendation,
  "title" | "instructionText"
> & {
  /** Local SVG filename for the activity icon, when available. */
  iconFile?: string | null;
  /** Required equipment description or pipe-separated items, or null. */
  equipmentNeeded?: string | null;
};

/**
 * Modal dialog presenting formatted step-by-step game rules, required equipment,
 * and play instructions for a mission.
 *
 * @param props - Component properties containing the activity title, instruction text, and equipment needed.
 */
export function MissionInstructionsDialog({
  title,
  instructionText,
  iconFile,
  equipmentNeeded,
}: MissionInstructionsDialogProps) {
  const steps = getMissionSteps(instructionText);
  const equipmentItems = getEquipmentList(equipmentNeeded);

  return (
    <DialogContent className="max-h-[85svh] grid-rows-[auto_minmax(0,1fr)_auto] gap-5 rounded-2xl bg-[#FDF6EA] p-6 sm:max-w-lg">
      <DialogHeader className="px-6 text-center sm:text-center">
        <DialogTitle className="text-2xl font-bold tracking-tight text-zinc-900">
          How to Play
        </DialogTitle>
        <DialogDescription className="text-sm font-medium text-zinc-600">
          {title}
        </DialogDescription>
        {iconFile ? (
          <Image
            src={`/activity-icons/${iconFile}`}
            alt=""
            className="mx-auto size-24 object-contain"
            height={96}
            width={96}
          />
        ) : null}
      </DialogHeader>

      <div className="overflow-y-auto overscroll-contain space-y-5 break-words">
        <section aria-labelledby="equipment-heading" className="space-y-2">
          <h3
            id="equipment-heading"
            className="text-xs font-semibold uppercase tracking-wider text-zinc-500"
          >
            Equipment Needed
          </h3>
          <div className="flex flex-wrap gap-2">
            {equipmentItems.length > 0 ? (
              equipmentItems.map((item, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="border-[#93AB63]/40 bg-white/80 px-3 py-1 text-sm font-medium text-zinc-800 shadow-2xs"
                >
                  {item}
                </Badge>
              ))
            ) : (
              <Badge
                variant="outline"
                className="border-dashed border-zinc-300 bg-white/60 px-3 py-1 text-sm font-medium text-zinc-500"
              >
                No equipment needed
              </Badge>
            )}
          </div>
        </section>

        <section aria-labelledby="instructions-heading" className="space-y-2">
          <h3
            id="instructions-heading"
            className="text-xs font-semibold uppercase tracking-wider text-zinc-500"
          >
            Instructions
          </h3>
          {steps.length ? (
            <ol className="list-decimal space-y-3 pl-5 text-base leading-relaxed text-zinc-800 marker:font-semibold marker:text-[#93AB63]">
              {steps.map((step, index) => (
                <li key={index} className="pl-1">
                  {step}
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-zinc-600">
              Instructions unavailable for this activity.
            </p>
          )}
        </section>
      </div>

      <DialogClose
        render={<Button size="lg" type="button" variant="outline" />}
        className="h-12 w-full rounded-full border-[#93AB63] bg-white px-6 text-base font-bold text-[#93AB63] hover:bg-zinc-50 hover:text-[#93AB63] focus-visible:border-[#93AB63] focus-visible:ring-[#93AB63]/20"
      >
        Close
      </DialogClose>
    </DialogContent>
  );
}
