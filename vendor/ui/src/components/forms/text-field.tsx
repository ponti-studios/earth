import * as React from "react";

import { cn } from "../../lib/utils";
import { Input } from "./input";
import type { TextFieldBaseProps, TextFieldType } from "./text-field.types";

interface TextFieldProps extends Omit<React.ComponentProps<"input">, "type">, TextFieldBaseProps {
  type?: TextFieldType | undefined;
}

/**
 * TextField — composed input with label, helper text, and error state.
 * Replaces raw `<input>` + `<label>` + error span patterns in feature code.
 *
 * @example
 * <TextField label="Email" type="email" error={errors.email?.message} />
 * <TextField label="Search" type="search" helpText="Press Enter to search" />
 */
function TextField({
  id,
  label,
  helpText,
  error,
  className,
  disabled,
  type = "text",
  ...inputProps
}: TextFieldProps) {
  const generatedId = React.useId();
  const inputId = id ?? generatedId;
  const descriptionId = `${inputId}-description`;
  const errorId = `${inputId}-error`;

  if (!label && !helpText && !error) {
    return (
      <Input id={inputId} className={className} disabled={disabled} type={type} {...inputProps} />
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className={cn(
            "text-foreground text-sm font-medium",
            inputProps.required && "after:text-destructive-text after:ml-0.5 after:content-['*']",
          )}
        >
          {label}
        </label>
      )}
      <Input
        id={inputId}
        className={className}
        disabled={disabled}
        type={type}
        aria-describedby={error ? errorId : helpText ? descriptionId : undefined}
        aria-invalid={error ? true : undefined}
        {...inputProps}
      />
      {error ? (
        <p id={errorId} role="alert" className="text-destructive-text text-sm">
          {error}
        </p>
      ) : helpText ? (
        <p id={descriptionId} className="text-muted-foreground text-sm">
          {helpText}
        </p>
      ) : null}
    </div>
  );
}

export { TextField, type TextFieldProps };
