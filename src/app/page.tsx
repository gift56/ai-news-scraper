import { BiasMeter } from "@/components/ui/bias-meter";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { NewsCard } from "@/components/ui/news-card";

const sampleArticles = [
  {
    href: "#",
    imageUrl:
      "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&w=800&q=80",
    imageAlt: "United States Capitol building",
    category: "Politics",
    region: "United States",
    title:
      "Senate advances bipartisan infrastructure package after late-night talks",
    summary:
      "Lawmakers reached a procedural agreement that clears the way for a floor vote on a revised spending framework covering roads, broadband, and energy projects.",
    leftPercentage: 25,
    centerPercentage: 50,
    rightPercentage: 25,
    timeAgo: "2h ago",
    readTime: "12 min read",
  },
  {
    href: "#",
    imageUrl:
      "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Stock market chart on a screen",
    category: "Business & Markets",
    region: "Global",
    title:
      "Markets steady as investors weigh inflation data and central bank signals",
    summary:
      "Major indexes closed mixed after new consumer price figures suggested cooling core inflation, while officials hinted policy would remain data-dependent.",
    leftPercentage: 20,
    centerPercentage: 45,
    rightPercentage: 35,
    timeAgo: "4h ago",
    readTime: "8 min read",
  },
];

const colorSwatches = [
  { name: "Text Primary", className: "bg-text-primary" },
  { name: "Text Secondary", className: "bg-text-secondary" },
  { name: "Surface", className: "bg-surface" },
  { name: "Left Bias", className: "bg-bias-left" },
  { name: "Center", className: "bg-bias-center" },
  { name: "Right Bias", className: "bg-bias-right" },
  { name: "BG Secondary", className: "bg-bg-secondary" },
  { name: "Border", className: "bg-border" },
];

export default function HomePage() {
  return (
    <div className="container-dailybit py-8 md:py-12">
      <section className="mb-12">
        <h1 className="text-h1 text-text-primary">DailyBit Design System</h1>
        <p className="mt-2 max-w-2xl text-body-lg text-text-secondary">
          Balanced news coverage, powered by AI. Typography, color, and
          components aligned to the DailyBit UI reference.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="mb-4 text-h2 text-text-primary">Color Palette</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {colorSwatches.map((swatch) => (
            <div
              key={swatch.name}
              className="rounded-md border border-border p-3"
            >
              <div
                className={`mb-2 h-12 rounded-md border border-border ${swatch.className}`}
              />
              <p className="text-body-sm text-text-primary">{swatch.name}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="mb-4 text-h2 text-text-primary">Typography</h2>
        <div className="space-y-3 rounded-lg border border-border bg-surface p-6">
          <p className="text-h1">H1 — Page title</p>
          <p className="text-h2">H2 — Section title</p>
          <p className="text-h3">H3 — Card title</p>
          <p className="text-h4">H4 — Subheading</p>
          <p className="text-body-lg">Body Large — Important content</p>
          <p className="text-body-md">Body Medium — Body text</p>
          <p className="text-body-sm">Body Small — Supporting text</p>
          <p className="text-caption">Caption — Labels and meta text</p>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="mb-4 text-h2 text-text-primary">Buttons</h2>
        <div className="flex flex-wrap gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="text">Text</Button>
          <Button disabled>Disabled</Button>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="mb-4 text-h2 text-text-primary">Chips</h2>
        <div className="flex flex-wrap gap-2">
          <Chip label="World Cup" />
          <Chip label="Business & Markets" />
          <Chip label="Politics" />
        </div>
      </section>

      <section className="mb-12">
        <h2 className="mb-4 text-h2 text-text-primary">Bias Meter</h2>
        <div className="max-w-xl rounded-lg border border-border bg-bg-primary p-6 shadow-sm">
          <BiasMeter
            leftPercentage={25}
            centerPercentage={50}
            rightPercentage={25}
          />
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-h2 text-text-primary">News Cards</h2>
        <div className="grid gap-6">
          {sampleArticles.map((article) => (
            <NewsCard key={article.title} {...article} />
          ))}
        </div>
      </section>
    </div>
  );
}
