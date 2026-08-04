import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import {
  BookmarkIcon,
  ChevronDownIcon,
  InfoIcon,
  ShareIcon,
} from "@/components/icons";
import { BiasMeter } from "@/components/ui/bias-meter";
import { Button } from "@/components/ui/button";
import {
  getArticleBySlug,
  getRelatedArticles,
} from "@/lib/supabase/queries/articles";
import type { ArticleDetailRow, RelatedArticleRow } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type PageParams = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({
  params,
}: PageParams): Promise<Metadata> {
  const { slug } = await params;
  const { isAuthenticated } = await auth();

  if (!isAuthenticated) {
    return {
      title: "Sign in required",
      description: "Sign in to read DailyBit news analysis.",
      alternates: {
        canonical: `/news/${slug}`,
      },
    };
  }

  const article = await getArticleBySlug(slug);

  if (!article) {
    return {
      title: "Article not found",
      description: "The requested DailyBit article could not be found.",
      alternates: {
        canonical: `/news/${slug}`,
      },
    };
  }

  return {
    title: article.title,
    description: article.analysis.summary,
    alternates: {
      canonical: `/news/${article.slug}`,
    },
    openGraph: {
      title: article.title,
      description: article.analysis.summary,
      url: `/news/${article.slug}`,
      siteName: "DailyBit",
      type: "article",
      publishedTime: article.publishedAt,
      authors: [article.source.name],
      images: [
        {
          url: article.imageUrl,
          width: 1200,
          height: 800,
          alt: article.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.analysis.summary,
      images: [article.imageUrl],
    },
  };
}

export default async function NewsDetailsPage({ params }: PageParams) {
  const { slug } = await params;
  const { isAuthenticated, redirectToSignIn } = await auth();

  if (!isAuthenticated) {
    return redirectToSignIn();
  }

  const article = await getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const paragraphs = splitParagraphs(article.rawText);

  const relatedArticles = article.hasEmbedding
    ? await getRelatedArticles(article.id)
    : [];

  return (
    <div className="bg-surface">
      <section className="container-dailybit py-8 md:py-10 lg:py-12">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.6fr)_380px] lg:items-start">
          <article className="min-w-0">
            <p className="text-caption text-text-secondary">
              {article.source.name}
            </p>

            <h1 className="mt-2 max-w-3xl text-[2.1rem] font-extrabold leading-[1.05] tracking-[-0.04em] text-text-primary sm:text-[2.4rem] lg:text-[2.9rem]">
              {article.title}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-body-sm text-text-secondary">
              <span>{formatDate(article.publishedAt)}</span>

              <div className="ml-auto flex flex-wrap items-center gap-2 text-text-primary">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full border border-divider bg-bg-primary px-3 py-2 transition-colors hover:bg-surface"
                  aria-label="Save article"
                >
                  <BookmarkIcon className="h-4 w-4" />
                  <span className="text-caption font-medium">Save</span>
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full border border-divider bg-bg-primary px-3 py-2 transition-colors hover:bg-surface"
                  aria-label="Share article"
                >
                  <ShareIcon className="h-4 w-4" />
                  <span className="text-caption font-medium">Share</span>
                </button>
                <button
                  type="button"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-divider bg-bg-primary transition-colors hover:bg-surface"
                  aria-label="More actions"
                >
                  <ChevronDownIcon className="h-4 w-4 -rotate-90" />
                </button>
              </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-bg-primary shadow-sm">
              <div className="relative aspect-16/10 w-full bg-bg-secondary">
                <Image
                  src={article.imageUrl}
                  alt={article.title}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 1024px) 100vw, 880px"
                />
              </div>
            </div>

            <section className="mt-6 rounded-2xl border border-border bg-bg-primary p-4 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-body-md font-semibold text-text-primary">
                    Bias Distribution
                  </h2>
                  <p className="mt-1 text-caption text-text-secondary">
                    AI-estimated framing · 1 source
                  </p>
                </div>
                <InfoIcon className="h-4 w-4 shrink-0 text-text-secondary" />
              </div>

              <div className="mt-4">
                <BiasMeter
                  leftPercentage={article.analysis.leftPercentage}
                  centerPercentage={article.analysis.centerPercentage}
                  rightPercentage={article.analysis.rightPercentage}
                  labeled
                />
              </div>
            </section>

            <div className="mt-8 space-y-5 text-body-lg leading-7 text-text-primary">
              {paragraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 100)} className="max-w-3xl">
                  {paragraph}
                </p>
              ))}
            </div>
          </article>

          <aside className="space-y-4 lg:sticky lg:top-4">
            <SidebarCard title="Bias Analysis">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-body-sm text-text-secondary">
                    Overall Bias
                  </p>
                  <p className="mt-2 text-[1.8rem] font-extrabold tracking-[-0.04em] text-[#1f4ea8]">
                    {formatOverallBias(article)}
                  </p>
                  <p className="mt-1 text-body-sm text-[#54709b]">
                    Based on 1 source: {article.source.name}
                  </p>
                </div>
                <InfoIcon className="h-4 w-4 shrink-0 text-text-secondary" />
              </div>

              <div className="mt-6 space-y-4 border-t border-divider pt-5">
                <AnalysisRow
                  label="Left"
                  percentage={article.analysis.leftPercentage}
                  barClassName="bg-bias-left"
                  valueClassName="text-bias-left"
                />
                <AnalysisRow
                  label="Center"
                  percentage={article.analysis.centerPercentage}
                  barClassName="bg-bias-center"
                  valueClassName="text-text-secondary"
                />
                <AnalysisRow
                  label="Right"
                  percentage={article.analysis.rightPercentage}
                  barClassName="bg-bias-right"
                  valueClassName="text-bias-right"
                />
              </div>

              <p className="mt-5 text-body-sm leading-6 text-text-secondary">
                {article.analysis.framingNotes}
              </p>

              <Button
                variant="secondary"
                className="mt-4 w-full rounded-md py-2.5 font-semibold"
              >
                How We Analyze Bias
              </Button>
            </SidebarCard>

            <SidebarCard title="AI Summary">
              <div className="flex items-start justify-between gap-4">
                <p className="text-body-sm text-text-secondary">
                  Generated by {article.analysis.model}
                </p>
                <InfoIcon className="h-4 w-4 shrink-0 text-text-secondary" />
              </div>

              <p className="mt-4 text-body-sm leading-6 text-text-primary">
                {article.analysis.summary}
              </p>

              <div className="mt-5 rounded-xl border border-divider bg-surface p-4">
                <div className="grid gap-3 text-caption text-text-secondary sm:grid-cols-2">
                  <div>
                    <p className="uppercase tracking-[0.18em]">Sentiment</p>
                    <p className="mt-1 text-body-sm font-semibold text-text-primary">
                      {capitalize(article.analysis.sentimentLabel)} ·{" "}
                      {article.analysis.sentimentScore.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="uppercase tracking-[0.18em]">Confidence</p>
                    <p className="mt-1 text-body-sm font-semibold text-text-primary">
                      {(article.analysis.confidence * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-caption uppercase tracking-[0.18em] text-text-secondary">
                    Loaded terms
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {article.analysis.loadedTerms.map((term) => (
                      <span
                        key={term}
                        className="rounded-full border border-divider bg-bg-primary px-2.5 py-1 text-caption text-text-primary"
                      >
                        {term}
                      </span>
                    ))}
                  </div>
                </div>

                <p className="mt-4 text-caption leading-5 text-text-secondary">
                  {article.analysis.disclaimer}
                </p>
              </div>

              <Button
                variant="secondary"
                className="mt-4 w-full rounded-md py-2.5 font-semibold"
              >
                Provide Feedback
              </Button>
            </SidebarCard>
          </aside>
        </div>
      </section>

      {relatedArticles.length > 0 && (
        <section className="container-dailybit pb-10">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-h2 text-text-primary">Related Articles</h2>
              <p className="mt-1 text-body-sm text-text-secondary">
                Similar stories by semantic similarity
              </p>
            </div>
            <InfoIcon className="h-4 w-4 shrink-0 text-text-secondary" />
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {relatedArticles.map((related) => (
              <RelatedArticleCard key={related.id} article={related} />
            ))}
          </div>
        </section>
      )}

      <section className="container-dailybit pb-10">
        <div className="rounded-2xl border border-border bg-bg-primary px-5 py-6 shadow-sm sm:px-6 lg:px-8">
          <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr_auto] lg:items-center">
            <div>
              <h2 className="text-h2 text-text-primary">
                Stay Informed. Stay Balanced.
              </h2>
              <p className="mt-2 text-body-sm text-text-secondary">
                Get the top stories and bias analysis delivered to your inbox.
              </p>
            </div>

            <label className="block">
              <span className="sr-only">Email address</span>
              <input
                type="email"
                placeholder="Enter your email"
                className="h-12 w-full rounded-md border border-divider bg-bg-primary px-4 text-body-md text-text-primary outline-none transition-colors placeholder:text-text-secondary focus:border-text-primary"
              />
            </label>

            <Button className="h-12 min-w-33 rounded-md px-6 font-semibold">
              Subscribe
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function splitParagraphs(rawText: string): string[] {
  return rawText
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatOverallBias(article: ArticleDetailRow) {
  const { biasLabel, leftPercentage, centerPercentage, rightPercentage } =
    article.analysis;

  if (biasLabel === "left") {
    return `Left ${leftPercentage}%`;
  }

  if (biasLabel === "center") {
    return `Center ${centerPercentage}%`;
  }

  if (biasLabel === "mixed") {
    return "Mixed";
  }

  if (biasLabel === "unclear") {
    return "Unclear";
  }

  return `Right ${rightPercentage}%`;
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function RelatedArticleCard({
  article,
}: Readonly<{ article: RelatedArticleRow }>) {
  return (
    <Link
      href={`/news/${article.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-bg-primary shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-16/10 w-full bg-bg-secondary">
        <Image
          src={article.imageUrl}
          alt={article.title}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-caption text-text-secondary">{article.sourceName}</p>

        <h3 className="mt-1.5 line-clamp-2 text-body-md font-semibold leading-snug text-text-primary group-hover:text-text-primary/80">
          {article.title}
        </h3>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-text-secondary">
          <span>{formatDate(article.publishedAt)}</span>
          <span aria-hidden="true">·</span>
          <span className="font-medium text-text-primary">
            {capitalize(article.sentimentLabel)}
          </span>
          <span aria-hidden="true">·</span>
          <span className="font-medium text-text-primary">
            {capitalize(article.biasLabel)}
          </span>
        </div>
      </div>
    </Link>
  );
}

function SidebarCard({
  title,
  children,
}: Readonly<{
  title: string;
  children: ReactNode;
}>) {
  return (
    <section className="rounded-2xl border border-border bg-bg-primary p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-h3 text-text-primary">{title}</h2>
        <InfoIcon className="h-4 w-4 shrink-0 text-text-secondary" />
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function AnalysisRow({
  label,
  percentage,
  barClassName,
  valueClassName,
}: Readonly<{
  label: string;
  percentage: number;
  barClassName: string;
  valueClassName: string;
}>) {
  return (
    <div className="grid grid-cols-[56px_40px_1fr] items-center gap-3">
      <span className="text-body-sm text-text-primary">{label}</span>
      <span className={cn("text-body-sm font-medium", valueClassName)}>
        {percentage}%
      </span>
      <div
        className="h-2 overflow-hidden rounded-full bg-surface"
        aria-hidden="true"
      >
        <div
          className={cn("h-full rounded-full", barClassName)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
