import { Button as BaseButton } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "../../lib/utils";
import { Spinner } from "../feedback/spinner";

const buttonVariants = cva(
  [
    "inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md border border-transparent font-medium transition-colors outline-none",
    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border-input bg-background hover:bg-muted hover:text-muted-foreground",
        secondary: "border-input bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "border-transparent bg-transparent hover:bg-muted hover:text-muted-foreground",
        link: "border-transparent bg-transparent px-0 text-accent-text underline-offset-4 hover:underline",
      },
      size: {
        sm: "min-h-8 px-2.5 text-xs",
        md: "min-h-9 px-3 text-sm",
        lg: "min-h-10 px-4 text-base",
        icon: "size-9 rounded-md p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
  loadingLabel?: string;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      disabled,
      isLoading = false,
      loadingLabel = "Loading",
      variant,
      size,
      asChild = false,
      // Defaults to "button" — same safe default the native element loses
      // once it's rendered inside a <form> — but must stay overridable so
      // consumers can pass type="submit"/"reset".
      type = "button",
      "aria-label": ariaLabel,
      ...props
    },
    ref,
  ) => {
    if (asChild && React.isValidElement(children)) {
      const child = children as React.ReactElement<{ children?: React.ReactNode }>;
      const renderedChild = React.cloneElement(child, {
        children: isLoading ? (
          <>
            <span className="opacity-0" aria-hidden="true">
              {child.props.children}
            </span>
            <span className="absolute inset-0 inline-flex items-center justify-center">
              <Spinner size="sm" aria-hidden="true" />
            </span>
            <span className="sr-only">{loadingLabel}</span>
          </>
        ) : (
          child.props.children
        ),
      });

      return (
        <BaseButton
          {...props}
          type={type}
          render={renderedChild}
          nativeButton={false}
          className={cn(buttonVariants({ variant, size, className }), isLoading && "relative")}
          disabled={disabled || isLoading}
          aria-busy={isLoading}
          aria-label={isLoading ? loadingLabel : ariaLabel}
          ref={ref}
        />
      );
    }
    return (
      <button
        {...props}
        className={cn(buttonVariants({ variant, size, className }), isLoading && "relative")}
        style={{
          ...props.style,
          cursor: disabled || isLoading ? "default" : "pointer",
        }}
        type={type}
        ref={ref}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        aria-label={isLoading ? loadingLabel : ariaLabel}
      >
        {isLoading ? (
          <>
            <span className="opacity-0" aria-hidden="true">
              {children}
            </span>
            <span className="absolute inset-0 inline-flex items-center justify-center">
              <Spinner size="sm" aria-hidden="true" />
            </span>
            <span className="sr-only">{loadingLabel}</span>
          </>
        ) : (
          children
        )}
      </button>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
