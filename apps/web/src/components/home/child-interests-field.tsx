import { Sparkles } from "lucide-react";

import { Input } from "@/components/ui/input";

/**
 * Props for the `ChildInterestsField` component.
 */
export type ChildInterestsFieldProps = {
  /** Current text value for child's interests. */
  value?: string;
  /** Callback fired when the user types in the input. */
  onChange: (value: string) => void;
  /** Optional disabled state. */
  disabled?: boolean;
};

/**
 * Free-text form field allowing parents to describe their child's interests, hobbies,
 * or favorite activities to enable AI-powered personalization.
 *
 * @param props - Component properties configuring value, onChange handler, and disabled state.
 */
export function ChildInterestsField({
  value = "",
  onChange,
  disabled = false,
}: ChildInterestsFieldProps) {
  return (
    <div className="mt-7">
      <div className="flex items-center justify-between">
        <label
          htmlFor="interests"
          className="block text-xs font-medium tracking-wide text-zinc-600 uppercase"
        >
          Child&apos;s interests (optional)
        </label>
        <span className="inline-flex items-center gap-1 rounded-full bg-[#7B8FD6]/15 px-2.5 py-0.5 text-[11px] font-semibold text-[#5B6FB6]">
          <Sparkles aria-hidden="true" className="size-3 text-[#5B6FB6]" />
          AI Ready
        </span>
      </div>

      <div className="mt-2">
        <Input
          aria-describedby="interests-hint"
          autoComplete="off"
          className="h-[52px] w-full rounded-2xl border-zinc-200 bg-[#F0B6A31F] px-4 text-base placeholder:text-zinc-500 focus-visible:border-[#7B8FD6] focus-visible:ring-[#7B8FD6]/20 md:text-base"
          disabled={disabled}
          id="interests"
          maxLength={150}
          name="interests"
          onChange={(event) => onChange(event.target.value)}
          placeholder="e.g. loves dinosaurs, space, puddle jumping, arts & crafts..."
          type="text"
          value={value}
        />
      </div>

      <p id="interests-hint" className="mt-2 text-xs text-zinc-500">
        Add topics or activities your child loves to personalise AI recommendations.
      </p>
    </div>
  );
}
