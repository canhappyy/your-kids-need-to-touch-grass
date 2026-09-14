import { type RefObject } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

/**
 * Props for the {@link ClearHistoryDialog} component.
 */
type ClearHistoryDialogProps = {
  /** Whether the confirmation alert dialog is currently open. */
  open: boolean;
  /** Callback fired when the open/closed state of the dialog changes. */
  onOpenChange: (open: boolean) => void;
  /** Callback invoked when the user confirms their intent to wipe all stored mission history. */
  onConfirmClear: () => void;
  /** Whether to render the destructive "Clear history" trigger button on the page. */
  showTrigger: boolean;
  /** Optional error message displayed if clearing history fails. */
  error?: string;
  /** Ref to the element that should receive focus after the dialog closes. */
  finalFocusRef?: RefObject<HTMLHeadingElement | null>;
};

/**
 * Destructive action confirmation dialog that prompts the user before permanently
 * erasing all completed mission history from local browser storage.
 */
export function ClearHistoryDialog({
  open,
  onOpenChange,
  onConfirmClear,
  showTrigger,
  error,
  finalFocusRef,
}: ClearHistoryDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {showTrigger && (
        <AlertDialogTrigger
          render={<Button size="lg" type="button" variant="destructive" />}
          className="h-12 w-full rounded-full border border-destructive px-6 text-base font-bold"
        >
          Clear history
        </AlertDialogTrigger>
      )}
      <AlertDialogContent finalFocus={finalFocusRef}>
        <AlertDialogHeader>
          <AlertDialogTitle>Clear completed mission history?</AlertDialogTitle>
          <AlertDialogDescription>
            All completed mission records in this browser will be deleted. This
            cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="rounded-full border border-destructive"
            variant="destructive"
            onClick={onConfirmClear}
          >
            Clear history
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export type { ClearHistoryDialogProps };
