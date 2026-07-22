import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { auth } from "@clerk/nextjs/server";
import {
  BookmarkIcon,
  ChevronDownIcon,
  ExternalLinkIcon,
  InfoIcon,
  ShareIcon,
} from "@/components/icons";
import { BiasMeter } from "@/components/ui/bias-meter";
import { Button } from "@/components/ui/button";
import { mockHomeArticles } from "@/lib/home/mock-articles";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type PageParams = {
  params: Promise<{
    slug: string;
  }>;
};

type ArticleAnalysis = {
  summary: string;
  sentimentLabel: "positive" | "neutral" | "negative";
  sentimentScore: number;
  biasLabel: "left" | "center" | "right" | "mixed" | "unclear";
  leftPercentage: number;
  centerPercentage: number;
  rightPercentage: number;
  confidence: number;
  framingNotes: string;
  loadedTerms: string[];
  disclaimer: string;
  model: string;
  sourceCount: number;
  generatedAt: string;
  readTime: string;
  bullets: string[];
  sourceBreakdown: Array<{
    name: string;
    bias: "Left" | "Center" | "Right";
    percentage: number;
  }>;
  heroCaption: string;
  author: string;
  body: string[];
};

const featuredAnalysis: Record<string, ArticleAnalysis> = {
  "trump-iran-revised-peace-proposal": {
    summary:
      "The revised proposal tightens pressure on Iran by pairing nuclear restrictions with stronger verification language and a warning that the U.S. is prepared to escalate if talks fail.",
    sentimentLabel: "neutral",
    sentimentScore: 0.06,
    biasLabel: "right",
    leftPercentage: 20,
    centerPercentage: 31,
    rightPercentage: 49,
    confidence: 0.89,
    framingNotes:
      "The article foregrounds U.S. pressure, negotiation leverage, and deterrence. The framing is assertive but still keeps the diplomatic backchannel in view.",
    loadedTerms: [
      "tougher terms",
      "verification measures",
      "take-it-or-leave-it",
      "pressure campaign",
    ],
    disclaimer:
      "AI-estimated political framing can be wrong and should be treated as a probabilistic reading, not a factual judgment.",
    model: "gpt-4.1-mini",
    sourceCount: 12,
    generatedAt: "May 31, 2026",
    readTime: "3 min read",
    bullets: [
      "The proposal would require Iran to halt uranium enrichment and accept more intrusive inspections.",
      "U.S. officials present the deal as a final offer and signal readiness to pursue other options if diplomacy fails.",
      "Allies are urging continued negotiations while the article frames the proposal as a decisive shift in tone.",
      "Iran's response is portrayed as unsettled, with the potential for sanctions relief still tied to compliance.",
      "The story emphasizes leverage, deterrence, and verification more than conciliatory diplomacy.",
    ],
    sourceBreakdown: [
      { name: "Fox News", bias: "Right", percentage: 49 },
      { name: "The Wall Street Journal", bias: "Center", percentage: 41 },
      { name: "Reuters", bias: "Center", percentage: 39 },
      { name: "BBC", bias: "Center", percentage: 37 },
      { name: "CNN", bias: "Left", percentage: 33 },
      { name: "The New York Times", bias: "Center", percentage: 34 },
      { name: "The Washington Post", bias: "Center", percentage: 36 },
      { name: "Newsmax", bias: "Right", percentage: 52 },
    ],
    heroCaption:
      "President Donald Trump in the Cabinet Room at the White House, Washington, D.C., May 30, 2026. Photo: Andrew Harnik/Getty Images",
    author: "David Morgan",
    body: [
      "The Trump administration has sent Iran a revised nuclear deal proposal that includes tougher terms on uranium enrichment and stronger verification measures, according to a report published Saturday.",
      "The new proposal, delivered through intermediaries in Oman, requires Iran to halt all uranium enrichment on its soil and ship its stockpile of enriched uranium out of the country. It also demands unrestricted access for international inspectors to Iranian nuclear facilities, including military sites.",
      '"This is a take-it-or-leave-it proposal," a senior administration official told the Wall Street Journal. The President wants a deal, but he will not accept a weak agreement that puts America or our allies at risk.',
      "Iran has not yet officially responded to the proposal. However, Iranian Foreign Minister Hossein Amir-Abdollahian said last week that any deal must respect Iran's right to peaceful nuclear energy and include the lifting of all U.S. sanctions.",
      "The revised proposal comes after several rounds of indirect talks between U.S. and Iranian officials failed to produce a breakthrough. If diplomacy fails, the administration says it is prepared to take other action to prevent Iran from obtaining a nuclear weapon.",
      "European allies have urged both sides to continue negotiations, arguing that a durable outcome is still more likely through diplomacy than confrontation.",
    ],
  },
};

export function generateStaticParams() {
  return mockHomeArticles.map((article) => ({
    slug: article.slug,
  }));
}

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

  const article = getArticleBySlug(slug);

  if (!article) {
    return {
      title: "Article not found",
      description: "The requested DailyBit article could not be found.",
      alternates: {
        canonical: `/news/${slug}`,
      },
    };
  }

  const analysis = getAnalysis(article.slug);

  return {
    title: article.title,
    description: analysis.summary,
    alternates: {
      canonical: `/news/${article.slug}`,
    },
    openGraph: {
      title: article.title,
      description: analysis.summary,
      url: `/news/${article.slug}`,
      siteName: "DailyBit",
      type: "article",
      publishedTime: article.publishedAt,
      authors: [analysis.author],
      images: [
        {
          url: article.imageUrl,
          width: 1200,
          height: 800,
          alt: article.imageAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: analysis.summary,
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

  const article = getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const analysis = getAnalysis(article.slug);
  const relatedArticles = mockHomeArticles
    .filter((item) => item.slug !== article.slug)
    .slice(0, 6);

  return (
    <div className="bg-surface">
      <section className="container-dailybit py-8 md:py-10 lg:py-12">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.6fr)_380px] lg:items-start">
          <article className="min-w-0">
            <p className="text-caption text-text-secondary">
              {article.category} · {article.region}
            </p>

            <h1 className="mt-2 max-w-3xl text-[2.1rem] font-extrabold leading-[1.05] tracking-[-0.04em] text-text-primary sm:text-[2.4rem] lg:text-[2.9rem]">
              {article.title}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-body-sm text-text-secondary">
              <span>By {analysis.author}</span>
              <span aria-hidden="true">|</span>
              <span>{formatDate(article.publishedAt)}</span>
              <span aria-hidden="true">|</span>
              <span>{analysis.readTime}</span>

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
                  alt={article.imageAlt}
                  fill
                  className="object-cover"
                  priority={
                    article.slug === "trump-iran-revised-peace-proposal"
                  }
                  sizes="(max-width: 1024px) 100vw, 880px"
                />
              </div>
              <p className="border-t border-border px-4 py-3 text-caption text-text-secondary">
                {analysis.heroCaption}
              </p>
            </div>

            <section className="mt-6 rounded-2xl border border-border bg-bg-primary p-4 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-body-md font-semibold text-text-primary">
                    Bias Distribution
                  </h2>
                  <p className="mt-1 text-caption text-text-secondary">
                    AI-estimated across {analysis.sourceCount} balanced sources
                  </p>
                </div>
                <InfoIcon className="h-4 w-4 shrink-0 text-text-secondary" />
              </div>

              <div className="mt-4">
                <BiasMeter
                  leftPercentage={analysis.leftPercentage}
                  centerPercentage={analysis.centerPercentage}
                  rightPercentage={analysis.rightPercentage}
                  labeled
                />
              </div>

              <div className="mt-3 flex items-center justify-between text-caption text-text-secondary">
                <span>Sources</span>
                <span>{analysis.sourceCount}</span>
              </div>
            </section>

            <div className="mt-8 space-y-5 text-body-lg leading-7 text-text-primary">
              {analysis.body.map((paragraph) => (
                <p key={paragraph} className="max-w-3xl">
                  {paragraph}
                </p>
              ))}
            </div>

            <section className="mt-10 border-t border-divider pt-8">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-h2 text-text-primary">Related Stories</h2>
                  <p className="mt-1 text-caption text-text-secondary">
                    More stories from the same DailyBit feed
                  </p>
                </div>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 text-caption font-medium text-text-secondary transition-colors hover:text-text-primary"
                >
                  View all
                  <ExternalLinkIcon className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {relatedArticles.map((item) => (
                  <RelatedStoryCard key={item.id} article={item} />
                ))}
              </div>
            </section>
          </article>

          <aside className="space-y-4 lg:sticky lg:top-4">
            <SidebarCard title="Bias Analysis">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-body-sm text-text-secondary">
                    Overall Bias
                  </p>
                  <p className="mt-2 text-[1.8rem] font-extrabold tracking-[-0.04em] text-[#1f4ea8]">
                    {formatOverallBias(analysis)}
                  </p>
                  <p className="mt-1 text-body-sm text-[#54709b]">
                    Based on {analysis.sourceCount} balanced sources
                  </p>
                </div>
                <InfoIcon className="h-4 w-4 shrink-0 text-text-secondary" />
              </div>

              <div className="mt-6 space-y-4 border-t border-divider pt-5">
                <AnalysisRow
                  label="Left"
                  percentage={analysis.leftPercentage}
                  barClassName="bg-bias-left"
                  valueClassName="text-bias-left"
                />
                <AnalysisRow
                  label="Center"
                  percentage={analysis.centerPercentage}
                  barClassName="bg-bias-center"
                  valueClassName="text-text-secondary"
                />
                <AnalysisRow
                  label="Right"
                  percentage={analysis.rightPercentage}
                  barClassName="bg-bias-right"
                  valueClassName="text-bias-right"
                />
              </div>

              <p className="mt-5 text-body-sm leading-6 text-text-secondary">
                {analysis.framingNotes}
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
                  Generated {analysis.generatedAt} · {analysis.readTime}
                </p>
                <InfoIcon className="h-4 w-4 shrink-0 text-text-secondary" />
              </div>

              <ul className="mt-4 space-y-4 text-body-sm leading-6 text-text-primary">
                {analysis.bullets.map((bullet) => (
                  <li key={bullet} className="flex gap-3">
                    <span
                      className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-text-primary"
                      aria-hidden="true"
                    />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-5 rounded-xl border border-divider bg-surface p-4">
                <div className="grid gap-3 text-caption text-text-secondary sm:grid-cols-2">
                  <div>
                    <p className="uppercase tracking-[0.18em]">Sentiment</p>
                    <p className="mt-1 text-body-sm font-semibold text-text-primary">
                      {capitalize(analysis.sentimentLabel)} ·{" "}
                      {analysis.sentimentScore.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="uppercase tracking-[0.18em]">Confidence</p>
                    <p className="mt-1 text-body-sm font-semibold text-text-primary">
                      {(analysis.confidence * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-caption uppercase tracking-[0.18em] text-text-secondary">
                    Loaded terms
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {analysis.loadedTerms.map((term) => (
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
                  {analysis.disclaimer}
                </p>
              </div>

              <Button
                variant="secondary"
                className="mt-4 w-full rounded-md py-2.5 font-semibold"
              >
                Provide Feedback
              </Button>
            </SidebarCard>

            <SidebarCard title="Source Breakdown">
              <p className="text-body-sm text-text-secondary">
                {analysis.sourceCount} Total Sources
              </p>

              <div className="mt-5 space-y-4 border-t border-divider pt-5">
                <AnalysisRow
                  label="Left"
                  percentage={analysis.leftPercentage}
                  barClassName="bg-bias-left"
                  valueClassName="text-bias-left"
                  compact
                />
                <AnalysisRow
                  label="Center"
                  percentage={analysis.centerPercentage}
                  barClassName="bg-bias-center"
                  valueClassName="text-text-secondary"
                  compact
                />
                <AnalysisRow
                  label="Right"
                  percentage={analysis.rightPercentage}
                  barClassName="bg-bias-right"
                  valueClassName="text-bias-right"
                  compact
                />
              </div>

              <div className="mt-5">
                <div className="flex items-center justify-between text-caption uppercase tracking-[0.18em] text-text-secondary">
                  <span>Top Sources</span>
                  <span>Bias</span>
                </div>
                <div className="mt-3 space-y-2">
                  {analysis.sourceBreakdown.map((source) => (
                    <div
                      key={source.name}
                      className="flex items-center justify-between gap-4 rounded-lg px-1 py-1.5 text-body-sm"
                    >
                      <span className="font-medium text-text-primary">
                        {source.name}
                      </span>
                      <span
                        className={cn(
                          "font-medium",
                          source.bias === "Left" && "text-bias-left",
                          source.bias === "Center" && "text-text-secondary",
                          source.bias === "Right" && "text-bias-right",
                        )}
                      >
                        {source.bias}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                variant="secondary"
                className="mt-4 w-full rounded-md py-2.5 font-semibold"
              >
                View All Sources
              </Button>
            </SidebarCard>
          </aside>
        </div>
      </section>

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

function getArticleBySlug(slug: string) {
  return mockHomeArticles.find((article) => article.slug === slug) ?? null;
}

function getAnalysis(slug: string): ArticleAnalysis {
  if (slug in featuredAnalysis) {
    return featuredAnalysis[slug];
  }

  const article = getArticleBySlug(slug);
  const leftPercentage = article?.leftPercentage ?? 28;
  const centerPercentage = article?.centerPercentage ?? 40;
  const rightPercentage = article?.rightPercentage ?? 32;
  const topBias = getTopBias(leftPercentage, centerPercentage, rightPercentage);
  const biasLabel =
    topBias === "left" || topBias === "right"
      ? topBias
      : topBias === "center"
        ? "center"
        : "mixed";
  const title = article?.title ?? "DailyBit article";

  return {
    summary: `An editorial breakdown of ${title} with emphasis on the article's framing, headline choices, and source balance.`,
    sentimentLabel: "neutral",
    sentimentScore: 0.12,
    biasLabel,
    leftPercentage,
    centerPercentage,
    rightPercentage,
    confidence: 0.74,
    framingNotes:
      "The article uses balanced coverage, but the strongest phrasing still tracks toward one dominant angle depending on the source mix.",
    loadedTerms: ["analysis", "framing", "balance"],
    disclaimer:
      "AI-estimated political framing is probabilistic and should not be treated as objective truth.",
    model: "gpt-4.1-mini",
    sourceCount: 8,
    generatedAt: formatDate(article?.publishedAt ?? new Date().toISOString()),
    readTime: "4 min read",
    bullets: [
      `This story centers on ${title}.`,
      "The summary reflects the article's visible framing and main claims.",
      "The analysis balances headline language with the supporting article body.",
      "Source selection and phrasing can influence the final bias estimate.",
    ],
    sourceBreakdown: [
      { name: "Reuters", bias: "Center", percentage: 42 },
      { name: "BBC", bias: "Center", percentage: 39 },
      { name: "AP News", bias: "Center", percentage: 41 },
      { name: "The Guardian", bias: "Left", percentage: 36 },
      { name: "Fox News", bias: "Right", percentage: 46 },
    ],
    heroCaption: article?.imageAlt ?? "Article image",
    author: "DailyBit Editorial",
    body: [
      `This is the DailyBit detail view for "${title}". It mirrors the editorial layout in the reference while keeping the content sourced from the local mock dataset.`,
      "The main column is designed for long-form reading, with a wide hero image, clear byline metadata, a compact bias distribution block, and readable paragraph spacing.",
      "The sidebar condenses the analysis into cards that highlight the AI-estimated bias, summary bullets, source breakdown, and disclaimer language.",
      "Related stories and the newsletter call to action provide the same newsroom rhythm seen in the reference layout, but the implementation remains fully server-rendered and static.",
    ],
  };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatOverallBias(analysis: ArticleAnalysis) {
  if (analysis.biasLabel === "left") {
    return `Left ${analysis.leftPercentage}%`;
  }

  if (analysis.biasLabel === "center") {
    return `Center ${analysis.centerPercentage}%`;
  }

  if (analysis.biasLabel === "mixed") {
    return "Mixed";
  }

  return `Right ${analysis.rightPercentage}%`;
}

function getTopBias(left: number, center: number, right: number) {
  const ordered = [
    { key: "left" as const, value: left },
    { key: "center" as const, value: center },
    { key: "right" as const, value: right },
  ].sort((a, b) => b.value - a.value);

  return ordered[0]?.key ?? "mixed";
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
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
  compact = false,
}: Readonly<{
  label: string;
  percentage: number;
  barClassName: string;
  valueClassName: string;
  compact?: boolean;
}>) {
  return (
    <div className="grid grid-cols-[56px_40px_1fr] items-center gap-3">
      <span className="text-body-sm text-text-primary">{label}</span>
      <span className={cn("text-body-sm font-medium", valueClassName)}>
        {percentage}%
      </span>
      <div
        className={cn(
          "h-2 overflow-hidden rounded-full bg-surface",
          compact && "h-2.5",
        )}
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

function RelatedStoryCard({
  article,
}: Readonly<{
  article: {
    id: string;
    slug: string;
    title: string;
    imageUrl: string;
    imageAlt: string;
    category: string;
    region: string;
    publishedAt: string;
    leftPercentage: number;
    centerPercentage: number;
    rightPercentage: number;
  };
}>) {
  return (
    <article className="rounded-xl border border-border bg-bg-primary shadow-sm transition-shadow hover:shadow-md">
      <Link
        href={`/news/${article.slug}`}
        prefetch={false}
        className="flex gap-3 p-3"
      >
        <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-md bg-bg-secondary sm:h-24 sm:w-28">
          <Image
            src={article.imageUrl}
            alt={article.imageAlt}
            fill
            className="object-cover"
            sizes="112px"
          />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-caption text-text-secondary">
            {article.category} · {article.region}
          </p>
          <h3 className="mt-1 line-clamp-2 text-body-sm font-semibold leading-5 text-text-primary">
            {article.title}
          </h3>
          <div className="mt-2 flex items-center gap-2 text-caption text-text-secondary">
            <span>{formatDate(article.publishedAt)}</span>
            <span aria-hidden="true">·</span>
            <span>6 min read</span>
          </div>
          <div className="mt-3">
            <BiasMeter
              compact
              leftPercentage={article.leftPercentage}
              centerPercentage={article.centerPercentage}
              rightPercentage={article.rightPercentage}
            />
          </div>
        </div>
      </Link>
    </article>
  );
}
