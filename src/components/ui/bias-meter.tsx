import { cn } from "@/lib/utils";

type BiasMeterProps = {
  leftPercentage: number;
  centerPercentage: number;
  rightPercentage: number;
  compact?: boolean;
  labeled?: boolean;
  className?: string;
};

type Segment = {
  key: "left" | "center" | "right";
  percentage: number;
  label: string;
  bgClass: string;
  textClass: string;
};

export function BiasMeter({
  leftPercentage,
  centerPercentage,
  rightPercentage,
  compact = false,
  labeled = false,
  className,
}: BiasMeterProps) {
  const segments: Segment[] = [
    {
      key: "left" as const,
      percentage: leftPercentage,
      label: `L ${leftPercentage}%`,
      bgClass: "bg-bias-left",
      textClass: "text-white",
    },
    {
      key: "center" as const,
      percentage: centerPercentage,
      label: `Center ${centerPercentage}%`,
      bgClass: "bg-bias-center",
      textClass: "text-text-primary",
    },
    {
      key: "right" as const,
      percentage: rightPercentage,
      label: `Right ${rightPercentage}%`,
      bgClass: "bg-bias-right",
      textClass: "text-white",
    },
  ].filter((segment) => segment.percentage > 0);

  if (labeled) {
    return (
      <div className={cn("w-full", className)}>
        <div
          className="flex h-5 overflow-hidden rounded-sm bg-bg-secondary text-[10px] font-semibold leading-none"
          role="img"
          aria-label={`AI-estimated political framing: Left ${leftPercentage}%, Center ${centerPercentage}%, Right ${rightPercentage}%`}
        >
          {segments.map((segment) => (
            <div
              key={segment.key}
              className={cn(
                "flex min-w-0 items-center justify-center px-1",
                segment.bgClass,
                segment.textClass,
              )}
              style={{ width: `${segment.percentage}%` }}
            >
              <span className="truncate">{segment.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "flex overflow-hidden rounded-sm bg-bg-secondary",
          compact ? "h-2" : "h-3",
        )}
        role="img"
        aria-label={`AI-estimated political framing: Left ${leftPercentage}%, Center ${centerPercentage}%, Right ${rightPercentage}%`}
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
