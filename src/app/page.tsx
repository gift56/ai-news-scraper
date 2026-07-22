import type { Metadata } from "next";
import { NewsCard } from "@/components/ui/news-card";
import { mockHomeArticles } from "@/lib/home/mock-articles";
import { buildHomeJsonLd, serializeJsonLd } from "@/lib/seo/json-ld";

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
        url: mockHomeArticles[0].imageUrl,
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
    images: [mockHomeArticles[0].imageUrl],
  },
};

export default function HomePage() {
  const jsonLd = buildHomeJsonLd(mockHomeArticles);

  return (
    <>
      <script type="application/ld+json">{serializeJsonLd(jsonLd)}</script>

      <div className="bg-surface">
        <section className="container-dailybit py-8 md:py-12">
          <h1 className="mb-6 text-h1 text-text-primary">Top News</h1>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {mockHomeArticles.map((article) => (
              <NewsCard
                key={article.id}
                layout="grid"
                href={`/news/${article.slug}`}
                imageUrl={article.imageUrl}
                imageAlt={article.imageAlt}
                category={article.category}
                region={article.region}
                title={article.title}
                leftPercentage={article.leftPercentage}
                centerPercentage={article.centerPercentage}
                rightPercentage={article.rightPercentage}
                sourceName={article.sourceName}
              />
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
