import { Button } from "@/components/ui/button";

type HistoryErrorAlertProps = {
  message: string;
  onRetry: () => void;
};

export function HistoryErrorAlert({ message, onRetry }: HistoryErrorAlertProps) {
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
