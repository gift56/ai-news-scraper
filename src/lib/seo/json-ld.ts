import type { HomeArticle } from "@/lib/home/mock-articles";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://dailybit.com";

export function buildHomeJsonLd(articles: HomeArticle[]) {
  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "DailyBit",
    url: siteUrl,
    description: "Balanced news coverage, powered by AI.",
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Top News",
    itemListElement: articles.map((article, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "NewsArticle",
        headline: article.title,
        image: [article.imageUrl],
        datePublished: article.publishedAt,
        url: `${siteUrl}/news/${article.slug}`,
        author: {
          "@type": "Organization",
          name: article.sourceName,
        },
        publisher: {
          "@type": "Organization",
          name: "DailyBit",
          url: siteUrl,
        },
      },
    })),
  };

  return [website, itemList];
}

export function serializeJsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
