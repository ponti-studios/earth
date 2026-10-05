import { LucideRefreshCcw, LucideX } from "lucide-react";

export interface UpdateGuardCopy {
  newContentAvailable?: string;
  refreshButton?: string;
  closeButton?: string;
}

export interface UpdateGuardProps {
  needRefresh: boolean;
  onRefresh: () => void;
  onDismiss?: () => void;
  copyText?: string;
  refreshText?: string;
}

export function UpdateGuard({
  needRefresh,
  onRefresh,
  onDismiss,
  copyText = "New content available",
  refreshText = "Refresh",
}: UpdateGuardProps) {
  if (!needRefresh) {
    return null;
  }

  return (
    <output
      aria-live="polite"
      aria-atomic="true"
      className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4"
    >
      <div className="border-border bg-card flex items-center gap-3 rounded-md border px-4 py-2">
        <span className="text-foreground text-sm">{copyText}</span>
        <button
          type="button"
          aria-label={refreshText}
          onClick={onRefresh}
          className="text-accent-text font-semibold border-muted-foreground rounded-md border px-2 py-1 hover:bg-accent hover:text-accent-foreground"
        >
          <LucideRefreshCcw className="size-4" />
        </button>
        {onDismiss ? (
          <button
            aria-label="Close"
            type="button"
            onClick={onDismiss}
            className="text-accent-text font-semibold border-muted-foreground rounded-md border px-2 py-1 hover:bg-accent hover:text-accent-foreground"
          >
            <LucideX className="size-4" />
          </button>
        ) : null}
      </div>
    </output>
  );
}
