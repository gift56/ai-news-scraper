import { PlusIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

type ChipProps = {
  label: string;
  showPlus?: boolean;
  className?: string;
};

export function Chip({ label, showPlus = true, className }: ChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-border bg-bg-primary px-3 py-1 text-body-sm text-text-primary",
        className,
      )}
    >
      {label}
      {showPlus ? (
        <PlusIcon className="h-3.5 w-3.5 text-text-secondary" />
      ) : null}
    </span>
  );
}
