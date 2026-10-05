import type { ReactNode } from "react";

import { cn } from "../../lib/utils";

export interface EmptyStateProps {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
  layout?: "centered" | "inline";
  size?: "md" | "lg";
  variant?: "default" | "dashed" | "quiet" | "search";
}

/**
 * EmptyState communicates an absence of content and gives the host application
 * room for an optional next action. Domain copy and recovery behavior stay with
 * the calling feature.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  children,
  className,
  layout = "centered",
  size = "md",
  variant = "default",
}: EmptyStateProps) {
  const centered = layout === "centered";
  const large = size === "lg";

  return (
    <section
      className={cn(
        "rounded-lg px-5 py-8",
        variant === "default" && "bg-card border",
        variant === "dashed" && "bg-card border border-dashed",
        variant === "search" && "bg-muted border border-dashed",
        variant === "quiet" && "bg-card",
        centered
          ? cn(
              "flex flex-col items-center justify-center text-center",
              large ? "min-h-80 px-6 py-10" : "min-h-64",
            )
          : "flex flex-col gap-3",
        className,
      )}
    >
      {icon ? (
        <div
          className="text-muted-foreground mb-3 flex size-11 items-center justify-center"
          aria-hidden
        >
          {icon}
        </div>
      ) : null}
      <div className={cn("space-y-2", centered && "max-w-[34ch]")}>
        <h2
          className={cn(
            "text-foreground font-semibold tracking-tight",
            large ? "text-lg" : "text-base",
          )}
        >
          {title}
        </h2>
        {description ? <p className="text-muted-foreground text-sm">{description}</p> : null}
      </div>
      {children ? <div className="mt-3">{children}</div> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </section>
  );
}
