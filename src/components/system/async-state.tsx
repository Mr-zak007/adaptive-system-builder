import { RefreshCw, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AsyncStateBannerProps {
  state: "idle" | "loading" | "error" | "success";
  loadingLabel?: string;
  errorMessage?: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export function AsyncStateBanner({
  state,
  loadingLabel = "Processing request...",
  errorMessage,
  onRetry,
  retryLabel = "Retry",
}: AsyncStateBannerProps) {
  if (state === "idle" || state === "success") {
    return null;
  }

  if (state === "loading") {
    return (
      <div
        className="flex items-center gap-2 rounded-md border border-input bg-muted px-3 py-2 text-sm text-foreground"
        role="status"
        aria-live="polite"
      >
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        <span>{loadingLabel}</span>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col gap-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-3 text-sm text-foreground md:flex-row md:items-center md:justify-between"
      role="alert"
    >
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 size-4 text-destructive" aria-hidden="true" />
        <p>{errorMessage ?? "Operation failed. Please retry."}</p>
      </div>
      {onRetry ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="h-11 min-w-11"
        >
          <RefreshCw className="size-4" aria-hidden="true" />
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
}
