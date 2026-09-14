import { Button } from "@/components/ui/button";

/**
 * Props for the {@link HistoryErrorAlert} component.
 */
type HistoryErrorAlertProps = {
  /** The error description to display to the user. */
  message: string;
  /** Callback triggered when the user clicks the "Try again" retry button. */
  onRetry: () => void;
};

/**
 * Accessible alert component displayed when an error occurs while loading or clearing mission history.
 * Provides error details and a retry button.
 */
export function HistoryErrorAlert({
  message,
  onRetry,
}: HistoryErrorAlertProps) {
  return (
    <div role="alert" className="space-y-2 text-sm text-red-700">
      <p>{message}</p>
      <Button variant="outline" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}

export type { HistoryErrorAlertProps };
