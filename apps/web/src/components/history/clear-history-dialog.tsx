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

type ClearHistoryDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmClear: () => void;
  showTrigger: boolean;
  error?: string;
  finalFocusRef?: RefObject<HTMLHeadingElement | null>;
};

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
