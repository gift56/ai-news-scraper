import Image from "next/image";
import Link from "next/link";
import { BookmarkIcon, ClockIcon, InfoIcon } from "@/components/icons";
import { BiasMeter } from "@/components/ui/bias-meter";
import { cn } from "@/lib/utils";

type NewsCardBaseProps = {
  href: string;
  imageUrl: string;
  imageAlt: string;
  category: string;
  region: string;
  title: string;
  leftPercentage: number;
  centerPercentage: number;
  rightPercentage: number;
  className?: string;
};

type NewsCardListProps = NewsCardBaseProps & {
  layout?: "list";
  summary: string;
  timeAgo: string;
  readTime: string;
};

type NewsCardGridProps = NewsCardBaseProps & {
  layout: "grid";
  sourceName: string;
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
  imageAlt,
  category,
  region,
  title,
  leftPercentage,
  centerPercentage,
  rightPercentage,
  sourceName,
  className,
}: NewsCardGridProps) {
  return (
    <article
      className={cn(
        "overflow-hidden rounded-lg border border-border bg-bg-primary shadow-sm transition-transform transition-shadow hover:-translate-y-0.5 hover:shadow-md",
        className,
      )}
    >
      <Link href={href} prefetch={false} className="flex flex-col">
        <div className="relative aspect-16/10 w-full overflow-hidden bg-bg-secondary">
          <Image
            src={imageUrl}
            alt={imageAlt}
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
          <p className="text-caption font-medium text-text-secondary">
            {category} - {region}
          </p>

          <h2 className="line-clamp-2 text-[1.05rem] font-semibold leading-[1.25] text-text-primary">
            {title}
          </h2>

          <BiasMeter
            labeled
            leftPercentage={leftPercentage}
            centerPercentage={centerPercentage}
            rightPercentage={rightPercentage}
          />

          <p className="text-caption text-text-secondary">{sourceName}</p>
        </div>
      </Link>
    </article>
  );
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
