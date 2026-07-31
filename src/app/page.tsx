import type { Metadata } from "next";
import { NewsCard } from "@/components/ui/news-card";
import { buildHomeJsonLd, serializeJsonLd } from "@/lib/seo/json-ld";
import { getHomeArticles } from "@/lib/supabase/queries/articles";
import type { HomeArticleRow } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

const fallbackOgImage =
  "https://images.unsplash.com/photo-1495020689067-958854a1ddfc?auto=format&fit=crop&w=1200&q=80";

export const metadata: Metadata = {
  title: {
    absolute: "DailyBit",
  },
  description: "Balanced news coverage, powered by AI.",
  keywords: ["DailyBit", "news", "AI", "politics", "world news", "business"],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "DailyBit",
    description: "Balanced news coverage, powered by AI.",
    url: "/",
    siteName: "DailyBit",
    type: "website",
    images: [
      {
        url: fallbackOgImage,
        width: 1200,
        height: 800,
        alt: "DailyBit homepage preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DailyBit",
    description: "Balanced news coverage, powered by AI.",
    images: [fallbackOgImage],
  },
};

export default async function HomePage() {
  let articles: HomeArticleRow[] = [];
  let hasError = false;

  try {
    articles = await getHomeArticles();
  } catch {
    hasError = true;
  }

  if (hasError) {
    return (
      <div className="bg-surface">
        <section className="container-dailybit flex min-h-[50vh] items-center justify-center py-16">
          <div className="max-w-xl rounded-2xl border border-border bg-bg-primary p-8 text-center shadow-sm">
            <p className="text-caption uppercase tracking-[0.2em] text-text-secondary">
              Something went wrong
            </p>
            <h1 className="mt-3 text-h1 text-text-primary">
              We could not load the latest news.
            </h1>
            <p className="mt-4 text-body-md text-text-secondary">
              Please try again later. If the problem persists, check the
              Supabase connection and environment variables.
            </p>
          </div>
        </section>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="bg-surface">
        <section className="container-dailybit flex min-h-[50vh] items-center justify-center py-16">
          <div className="max-w-xl rounded-2xl border border-border bg-bg-primary p-8 text-center shadow-sm">
            <p className="text-caption uppercase tracking-[0.2em] text-text-secondary">
              No articles yet
            </p>
            <h1 className="mt-3 text-h1 text-text-primary">
              The newsroom is warming up.
            </h1>
            <p className="mt-4 text-body-md text-text-secondary">
              DailyBit has not scraped or analyzed any articles yet. Run the
              scraper to populate the homepage, or insert a dummy article via
              the Supabase SQL Editor.
            </p>
          </div>
        </section>
      </div>
    );
  }

  const jsonLd = buildHomeJsonLd(articles);

  return (
    <>
      <script type="application/ld+json">{serializeJsonLd(jsonLd)}</script>

      <div className="bg-surface">
        <section className="container-dailybit py-8 md:py-12">
          <h1 className="mb-6 text-h1 text-text-primary">Top News</h1>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <NewsCard
                key={article.id}
                layout="grid"
                href={`/news/${article.slug}`}
                imageUrl={article.imageUrl}
                title={article.title}
                leftPercentage={article.leftPercentage}
                centerPercentage={article.centerPercentage}
                rightPercentage={article.rightPercentage}
                sourceName={article.sourceName}
                sentimentLabel={article.sentimentLabel}
                biasLabel={article.biasLabel}
                confidence={article.confidence}
                publishedAt={article.publishedAt}
              />
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
