import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion";
import { ChevronDown } from "lucide-react";
import * as React from "react";

import { cn } from "../../lib/utils";

function Accordion({
  type,
  collapsible = true,
  className,
  onValueChange,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Root> & {
  type?: "single" | "multiple";
  collapsible?: boolean;
}) {
  return (
    <AccordionPrimitive.Root
      data-slot="accordion"
      multiple={type === "multiple"}
      onValueChange={(value, details) => {
        if (type !== "multiple" && !collapsible && value.length === 0) {
          details.cancel();
          return;
        }

        onValueChange?.(value, details);
      }}
      {...props}
      className={cn("w-full", className)}
    />
  );
}

function AccordionItem({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn("mb-2 overflow-hidden rounded-md border last:mb-0", className)}
      {...props}
    />
  );
}

function AccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          "text-muted-foreground flex w-full flex-1 items-center justify-between gap-4 px-4 py-3 text-left text-sm font-semibold disabled:pointer-events-none disabled:opacity-50 [&[data-state=open]>svg]:rotate-180",
          className,
        )}
        {...props}
      >
        {children}
        <ChevronDown className="pointer-events-none size-4 shrink-0 transition-transform duration-200" />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Panel>) {
  return (
    <AccordionPrimitive.Panel
      data-slot="accordion-content"
      className="animate-accordion-down overflow-hidden text-sm"
      {...props}
    >
      <div className={cn("px-4 pt-2 pb-3", className)}>{children}</div>
    </AccordionPrimitive.Panel>
  );
}

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger };
