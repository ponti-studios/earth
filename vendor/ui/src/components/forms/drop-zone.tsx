import { FileIcon, UploadIcon, XIcon } from "lucide-react";
import {
  useCallback,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";

import { cn } from "../../lib/utils";
import { Progress } from "../feedback/progress";
import { Button } from "../primitives/button";

export type DropZoneStatus = "empty" | "armed" | "busy" | "failed";

export type DropZoneFileInfo = {
  name: string;
  size: number;
};

export type DropZoneProps = {
  status: DropZoneStatus;
  /** Selected file metadata for armed / busy / failed (with file retained). */
  file?: DropZoneFileInfo | null;
  error?: string | null;
  notice?: string | null;
  /** File input accept attribute, e.g. `.pdf,application/pdf`. */
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
  /** Empty idle copy */
  emptyLabel?: ReactNode;
  emptyHint?: ReactNode;
  draggingLabel?: ReactNode;
  /** Busy copy */
  busyLabel?: ReactNode;
  busyDescription?: ReactNode;
  /** Action labels — parent owns domain language */
  submitLabel?: string;
  retryLabel?: string;
  clearLabel?: string;
  cancelLabel?: string;
  /** Extra content under error (e.g. sign-in link). */
  failedActions?: ReactNode;
  onFiles: (files: File[]) => void;
  onSubmit?: () => void;
  onClear?: () => void;
  onCancel?: () => void;
  onRetry?: () => void;
};

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Generic file drop surface. Parent owns validation, network, and domain copy.
 * Modes: empty | armed | busy | failed, plus an internal drag overlay.
 */
export function DropZone({
  status,
  file = null,
  error = null,
  notice = null,
  accept,
  multiple = false,
  disabled = false,
  className,
  emptyLabel = (
    <>
      Drop a file here, or <span className="text-accent-text font-medium">browse</span>
    </>
  ),
  emptyHint,
  draggingLabel = "Release to attach",
  busyLabel = "Processing…",
  busyDescription,
  submitLabel = "Upload",
  retryLabel = "Try again",
  clearLabel = "Use a different file",
  cancelLabel = "Cancel",
  failedActions,
  onFiles,
  onSubmit,
  onClear,
  onCancel,
  onRetry,
}: DropZoneProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const zoneRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  const isBusy = status === "busy";
  const isInteractive = !disabled && !isBusy;

  const openPicker = useCallback(() => {
    if (!isInteractive) return;
    inputRef.current?.click();
  }, [isInteractive]);

  const handleFiles = useCallback(
    (list: FileList | File[] | null) => {
      if (!list || !isInteractive) return;
      const files = Array.from(list);
      if (files.length === 0) return;
      onFiles(files);
    },
    [isInteractive, onFiles],
  );

  const onDragEnter = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isInteractive) return;
    setDragging(true);
  };

  const onDragOver = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
  };

  const onDragLeave = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const next = event.relatedTarget;
    if (next instanceof Node && zoneRef.current?.contains(next)) return;
    setDragging(false);
  };

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setDragging(false);
    if (!isInteractive) return;
    handleFiles(event.dataTransfer.files);
  };

  const onInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleFiles(event.target.files);
    event.target.value = "";
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openPicker();
    }
  };

  const showDragging = dragging && isInteractive;
  const frameTone = cn(
    showDragging && "border-ring bg-primary/5",
    status === "failed" && !showDragging && "border-destructive bg-destructive/5",
    status === "busy" && "border-border bg-muted/30",
    status !== "failed" && status !== "busy" && !showDragging && "border-border bg-card",
  );

  return (
    <div className={cn("w-full space-y-3", className)}>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={!isInteractive}
        className="pointer-events-none sr-only"
        onChange={onInputChange}
        tabIndex={-1}
        aria-hidden
      />

      <div
        ref={zoneRef}
        role="button"
        tabIndex={isInteractive ? 0 : -1}
        aria-disabled={!isInteractive}
        aria-busy={isBusy}
        aria-label="File upload drop zone"
        className={cn(
          "relative flex min-h-44 w-full flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed p-6 text-center outline-none",
          "focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2",
          "motion-safe:transition-[transform,opacity] motion-safe:duration-200 motion-safe:ease-in-out motion-reduce:transition-none",
          isInteractive ? "cursor-pointer" : "cursor-default",
          showDragging ? "scale-[1.01] motion-reduce:scale-100" : "scale-100",
          frameTone,
        )}
        onClick={isInteractive ? openPicker : undefined}
        onKeyDown={isInteractive ? onKeyDown : undefined}
        onDragEnter={onDragEnter}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <div className="flex w-full max-w-sm flex-col items-center gap-3">
          {showDragging ? (
            <>
              <UploadIcon
                className="text-accent-text size-8 motion-safe:transition-[transform,opacity] motion-safe:duration-200 motion-safe:ease-in-out motion-reduce:transition-none motion-safe:-translate-y-0.5 motion-reduce:translate-y-0"
                aria-hidden
              />
              <p className="body-3 text-foreground">{draggingLabel}</p>
            </>
          ) : null}

          {!showDragging && status === "empty" ? (
            <>
              <UploadIcon className="size-8 text-muted-foreground" aria-hidden />
              <div className="space-y-1">
                <p className="body-3 text-foreground">{emptyLabel}</p>
                {emptyHint ? <p className="body-4 text-muted-foreground">{emptyHint}</p> : null}
              </div>
            </>
          ) : null}

          {!showDragging && status === "armed" && file ? (
            <>
              <FileIcon className="size-8 text-muted-foreground" aria-hidden />
              <div className="min-w-0 max-w-full space-y-1">
                <p className="subheading-4 truncate text-foreground">{file.name}</p>
                <p className="body-4 text-muted-foreground">{formatFileSize(file.size)}</p>
              </div>
            </>
          ) : null}

          {!showDragging && status === "busy" ? (
            <div className="w-full space-y-3">
              <div className="space-y-1">
                <p className="subheading-4 text-foreground">{busyLabel}</p>
                {busyDescription ? (
                  <p className="body-4 text-muted-foreground">{busyDescription}</p>
                ) : null}
                {file ? <p className="body-4 truncate text-muted-foreground">{file.name}</p> : null}
              </div>
              <Progress
                className="h-1.5 opacity-80 motion-safe:animate-pulse"
                aria-label={typeof busyLabel === "string" ? busyLabel : "Processing"}
                value={50}
              />
            </div>
          ) : null}

          {!showDragging && status === "failed" ? (
            <div className="w-full space-y-2">
              {file ? <p className="subheading-4 truncate text-foreground">{file.name}</p> : null}
              {error ? <p className="body-3 text-destructive-text">{error}</p> : null}
              {failedActions}
            </div>
          ) : null}
        </div>
      </div>

      {notice ? <p className="body-4 text-muted-foreground">{notice}</p> : null}

      <div className="grid gap-2">
        {status === "armed" && onSubmit ? (
          <Button type="button" className="w-full" onClick={onSubmit}>
            <UploadIcon className="size-4" />
            {submitLabel}
          </Button>
        ) : null}
        {status === "failed" && onRetry ? (
          <Button type="button" className="w-full" onClick={onRetry}>
            {retryLabel}
          </Button>
        ) : null}
        {status === "busy" && onCancel ? (
          <Button type="button" variant="outline" className="w-full" onClick={onCancel}>
            <XIcon className="size-4" />
            {cancelLabel}
          </Button>
        ) : null}
        {(status === "armed" || status === "failed") && onClear ? (
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={(event) => {
              event.stopPropagation();
              onClear();
            }}
          >
            {clearLabel}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
