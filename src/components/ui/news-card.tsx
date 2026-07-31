import Image from "next/image";
import Link from "next/link";
import { BookmarkIcon, ClockIcon, InfoIcon } from "@/components/icons";
import { BiasMeter } from "@/components/ui/bias-meter";
import type { BiasLabel, SentimentLabel } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

type NewsCardBaseProps = {
  href: string;
  imageUrl: string;
  title: string;
  leftPercentage: number;
  centerPercentage: number;
  rightPercentage: number;
  className?: string;
};

type NewsCardListProps = NewsCardBaseProps & {
  layout?: "list";
  imageAlt: string;
  category: string;
  region: string;
  summary: string;
  timeAgo: string;
  readTime: string;
};

type NewsCardGridProps = NewsCardBaseProps & {
  layout: "grid";
  sourceName: string;
  sentimentLabel: SentimentLabel;
  biasLabel: BiasLabel;
  confidence: number;
  publishedAt: string;
};

export type NewsCardProps = NewsCardListProps | NewsCardGridProps;

export function NewsCard(props: NewsCardProps) {
  if (props.layout === "grid") {
    return <NewsCardGrid {...props} />;
  }

  return <NewsCardList {...props} />;
}

function NewsCardGrid({
  href,
  imageUrl,
  title,
  leftPercentage,
  centerPercentage,
  rightPercentage,
  sourceName,
  sentimentLabel,
  biasLabel,
  confidence,
  publishedAt,
  className,
}: NewsCardGridProps) {
  return (
    <article
      className={cn(
        "overflow-hidden rounded-lg border border-border bg-bg-primary shadow-sm transition-shadow hover:-translate-y-0.5 hover:shadow-md",
        className,
      )}
    >
      <Link href={href} prefetch={false} className="flex flex-col">
        <div className="relative aspect-16/10 w-full overflow-hidden bg-bg-secondary">
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
          />
          <span
            className="absolute top-2 right-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-bg-primary/90 text-text-secondary shadow-sm"
            aria-hidden="true"
          >
            <InfoIcon className="h-4 w-4" />
          </span>
        </div>

        <div className="flex flex-col gap-3 p-4">
          <p className="text-caption font-medium capitalize text-text-secondary">
            {sourceName} · {sentimentLabel}
          </p>

          <h2 className="line-clamp-2 text-[1.05rem] font-semibold leading-tight text-text-primary">
            {title}
          </h2>

          <BiasMeter
            labeled
            leftPercentage={leftPercentage}
            centerPercentage={centerPercentage}
            rightPercentage={rightPercentage}
          />

          <div className="flex items-center justify-between text-caption text-text-secondary">
            <span>{formatCardDate(publishedAt)}</span>
            <span className="capitalize">{biasLabel}</span>
            <span>{Math.round(confidence * 100)}% confidence</span>
          </div>
        </div>
      </Link>
    </article>
  );
}

function formatCardDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function NewsCardList({
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
}: NewsCardListProps) {
  return (
    <article
      className={cn(
        "overflow-hidden rounded-lg border border-border bg-bg-primary shadow-sm transition-shadow hover:shadow-md",
        className,
      )}
    >
      <Link
        href={href}
        prefetch={false}
        className="flex flex-col gap-4 p-4 sm:flex-row sm:gap-6"
      >
        <div className="relative aspect-16/10 w-full shrink-0 overflow-hidden rounded-md bg-bg-secondary sm:w-56 md:w-64">
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
            {category} - {region}
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
