import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import "./globals.css";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://dailybit.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "DailyBit",
    template: "%s | DailyBit",
  },
  description: "Balanced news coverage, powered by AI.",
  keywords: [
    "DailyBit",
    "news",
    "AI news",
    "balanced news coverage",
    "political framing",
  ],
  applicationName: "DailyBit",
  authors: [{ name: "DailyBit" }],
  creator: "DailyBit",
  publisher: "DailyBit",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body
        className="flex min-h-full flex-col bg-surface font-sans text-text-primary"
        suppressHydrationWarning
      >
        <ClerkProvider afterSignOutUrl="/">
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </ClerkProvider>
      </body>
    </html>
  );
}
