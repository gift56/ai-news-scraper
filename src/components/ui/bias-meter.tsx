import { cn } from "@/lib/utils";

type BiasMeterProps = {
  leftPercentage: number;
  centerPercentage: number;
  rightPercentage: number;
  compact?: boolean;
  className?: string;
};

export function BiasMeter({
  leftPercentage,
  centerPercentage,
  rightPercentage,
  compact = false,
  className,
}: BiasMeterProps) {
  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "flex overflow-hidden rounded-sm bg-bg-secondary",
          compact ? "h-2" : "h-3",
        )}
        role="img"
        aria-label={`Political framing: Left ${leftPercentage}%, Center ${centerPercentage}%, Right ${rightPercentage}%`}
      >
        {leftPercentage > 0 ? (
          <div
            className="bg-bias-left"
            style={{ width: `${leftPercentage}%` }}
          />
        ) : null}
        {centerPercentage > 0 ? (
          <div
            className="bg-bias-center"
            style={{ width: `${centerPercentage}%` }}
          />
        ) : null}
        {rightPercentage > 0 ? (
          <div
            className="bg-bias-right"
            style={{ width: `${rightPercentage}%` }}
          />
        ) : null}
      </div>

      {!compact ? (
        <div className="mt-2 flex justify-between text-caption text-text-secondary">
          <span>Left {leftPercentage}%</span>
          <span>Center {centerPercentage}%</span>
          <span>Right {rightPercentage}%</span>
        </div>
      ) : null}
    </div>
  );
}
