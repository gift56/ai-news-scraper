import Image from "next/image";
import Link from "next/link";
import { BookmarkIcon, ClockIcon } from "@/components/icons";
import { BiasMeter } from "@/components/ui/bias-meter";
import { cn } from "@/lib/utils";

export type NewsCardProps = {
  href: string;
  imageUrl: string;
  imageAlt: string;
  category: string;
  region: string;
  title: string;
  summary: string;
  leftPercentage: number;
  centerPercentage: number;
  rightPercentage: number;
  timeAgo: string;
  readTime: string;
  className?: string;
};

export function NewsCard({
  href,
  imageUrl,
  imageAlt,
  category,
  region,
  title,
  summary,
  leftPercentage,
  centerPercentage,
  rightPercentage,
  timeAgo,
  readTime,
  className,
}: NewsCardProps) {
  return (
    <article
      className={cn(
        "overflow-hidden rounded-lg border border-border bg-bg-primary shadow-sm transition-shadow hover:shadow-md",
        className,
      )}
    >
      <Link
        href={href}
        className="flex flex-col gap-4 p-4 sm:flex-row sm:gap-6"
      >
        <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden rounded-md bg-bg-secondary sm:w-56 md:w-64">
          <Image
            src={imageUrl}
            alt={imageAlt}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 256px"
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <p className="text-caption text-text-secondary">
            {category} • {region}
          </p>

          <h3 className="text-h3 text-text-primary">{title}</h3>

          <p className="line-clamp-2 text-body-sm text-text-secondary">
            {summary}
          </p>

          <BiasMeter
            compact
            leftPercentage={leftPercentage}
            centerPercentage={centerPercentage}
            rightPercentage={rightPercentage}
          />

          <div className="mt-auto flex items-center gap-4 text-caption text-text-secondary">
            <span className="inline-flex items-center gap-1">
              <ClockIcon className="h-4 w-4" />
              {timeAgo}
            </span>
            <span className="inline-flex items-center gap-1">
              <BookmarkIcon className="h-4 w-4" />
            </span>
            <span>{readTime}</span>
          </div>
        </div>
      </Link>
    </article>
  );
}
