import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "text";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-text-primary text-bg-primary hover:bg-text-primary/90 disabled:bg-text-primary/40",
  secondary:
    "border border-border bg-bg-primary text-text-primary hover:bg-surface disabled:bg-bg-secondary disabled:text-text-secondary",
  text: "bg-transparent text-text-primary hover:bg-surface disabled:text-text-secondary",
};

export function Button({
  variant = "primary",
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center rounded-md px-4 py-2 text-body-md font-medium transition-colors disabled:cursor-not-allowed",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
