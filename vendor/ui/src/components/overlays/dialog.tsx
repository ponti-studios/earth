"use client";

import { AlertDialog as BaseAlertDialog } from "@base-ui/react/alert-dialog";
import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { XIcon } from "lucide-react";
import * as React from "react";

import { cn } from "../../lib/utils";

/**
 * Whether the nearest ancestor `<Dialog alert>` is in alert mode. Every part
 * below (`DialogContent`, etc.) reads this instead of taking its own `alert`
 * prop, so the mode only has to be set once, at the root.
 */
const DialogAlertContext = React.createContext(false);

/**
 * `alert: true` swaps the root primitive for Base UI's `AlertDialog.Root`:
 * `role="alertdialog"`, forced `modal`, and no dismiss via outside click or
 * Escape — for confirmations that need explicit acknowledgment. Every other
 * part (`Trigger`, `Popup`, `Close`, `Title`, `Description`, ...) is a plain
 * re-export shared by both Base UI primitives, so only the root needs to
 * branch; `DialogContent` reads `DialogAlertContext` to default its close
 * button off in alert mode.
 */
function Dialog({
  alert = false,
  modal,
  disablePointerDismissal,
  ...props
}: Omit<React.ComponentProps<typeof BaseDialog.Root>, "handle"> & { alert?: boolean }) {
  return (
    <DialogAlertContext value={alert}>
      {alert ? (
        <BaseAlertDialog.Root {...props} />
      ) : (
        <BaseDialog.Root
          modal={modal}
          disablePointerDismissal={disablePointerDismissal}
          {...props}
        />
      )}
    </DialogAlertContext>
  );
}

function DialogTrigger({
  asChild,
  children,
  ...props
}: React.ComponentProps<typeof BaseDialog.Trigger> & { asChild?: boolean }) {
  if (asChild && React.isValidElement(children)) {
    return (
      <BaseDialog.Trigger
        data-slot="dialog-trigger"
        render={(triggerProps) =>
          React.cloneElement(children as React.ReactElement<unknown>, triggerProps)
        }
        {...props}
      />
    );
  }
  return (
    <BaseDialog.Trigger data-slot="dialog-trigger" {...props}>
      {children}
    </BaseDialog.Trigger>
  );
}

function DialogPortal({ ...props }: React.ComponentProps<typeof BaseDialog.Portal>) {
  return <BaseDialog.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({
  asChild,
  children,
  ...props
}: React.ComponentProps<typeof BaseDialog.Close> & { asChild?: boolean }) {
  if (asChild && React.isValidElement(children)) {
    return (
      <BaseDialog.Close
        data-slot="dialog-close"
        render={(closeProps) =>
          React.cloneElement(children as React.ReactElement<unknown>, closeProps)
        }
        {...props}
      />
    );
  }
  return (
    <BaseDialog.Close data-slot="dialog-close" {...props}>
      {children}
    </BaseDialog.Close>
  );
}

function DialogOverlay({ className, ...props }: React.ComponentProps<typeof BaseDialog.Backdrop>) {
  return (
    <BaseDialog.Backdrop
      data-slot="dialog-overlay"
      className={cn("fixed inset-0 z-50 bg-black/80", className)}
      {...props}
    />
  );
}

/**
 * Flush to the bottom edge as a sheet on mobile, centered as a card from
 * `sm` up. Animation (slide-up on mobile, fade/zoom on desktop) is driven by
 * [data-slot="dialog-content"] rules in animations.css, not by this class.
 */
const dialogContentClassName =
  "bg-popover text-popover-foreground fixed inset-x-0 bottom-0 z-50 grid max-h-[90dvh] w-full gap-6 overflow-y-auto rounded-t-xl border p-4 outline-none sm:top-[50%] sm:bottom-auto sm:left-[50%] sm:w-[calc(100%-2rem)] sm:max-w-[30rem] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl sm:p-6";

function DialogContent({
  className,
  children,
  showCloseButton,
  ...props
}: React.ComponentProps<typeof BaseDialog.Popup> & {
  showCloseButton?: boolean;
}) {
  const isAlert = React.useContext(DialogAlertContext);
  const shouldShowClose = showCloseButton ?? !isAlert;

  return (
    <BaseDialog.Portal data-slot="dialog-portal">
      <DialogOverlay />
      <BaseDialog.Popup
        data-slot="dialog-content"
        className={cn(dialogContentClassName, className)}
        {...props}
      >
        {children}
        {shouldShowClose && (
          <BaseDialog.Close
            data-slot="dialog-close"
            className="text-muted-foreground hover:bg-muted hover:text-muted-foreground focus-visible:outline-ring absolute top-3 right-3 inline-flex size-9 items-center justify-center rounded-md border border-transparent opacity-100 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none sm:top-4 sm:right-4 [&_svg]:pointer-events-none [&_svg]:size-4.5 [&_svg]:shrink-0"
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </BaseDialog.Close>
        )}
      </BaseDialog.Popup>
    </BaseDialog.Portal>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2 text-left", className)}
      {...props}
    />
  );
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn("flex flex-col-reverse gap-3 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  );
}

function DialogTitle({ className, ...props }: React.ComponentProps<typeof BaseDialog.Title>) {
  return (
    <BaseDialog.Title
      data-slot="dialog-title"
      className={cn("text-lg leading-none font-semibold tracking-tight", className)}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof BaseDialog.Description>) {
  return (
    <BaseDialog.Description
      data-slot="dialog-description"
      className={cn("text-muted-foreground max-w-prose text-sm", className)}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
