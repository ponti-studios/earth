import { mergeProps } from "@base-ui/react/merge-props";
import type { ReactElement } from "react";
import * as React from "react";

export interface SlotProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
}

/**
 * Generic `asChild` primitive: merges the props it receives onto its single
 * child instead of rendering its own DOM element. Lets compound components
 * (e.g. `Navigation.Item`) apply base styling/aria wiring to whatever the
 * app renders — a router `Link`, a plain `<a>`, anything — without the app
 * passing a component as a prop; it's composed as JSX children instead.
 *
 * Uses `mergeProps` (already a dependency via `@base-ui/react`) so
 * event handlers chain instead of one overwriting the other, and
 * `className`/`style` merge instead of replacing.
 */
export const Slot = React.forwardRef<HTMLElement, SlotProps>(({ children, ...props }, ref) => {
  if (!React.isValidElement(children)) return null;
  const child = children as ReactElement<Record<string, unknown>>;
  const merged = mergeProps<"div">(
    props as React.ComponentPropsWithRef<"div">,
    child.props as React.ComponentPropsWithRef<"div">,
  );
  return React.cloneElement(child, { ...merged, ref } as Record<string, unknown>);
});
Slot.displayName = "Slot";
