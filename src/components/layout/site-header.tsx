import Link from "next/link";
import {
  ChevronDownIcon,
  GlobeIcon,
  LocationIcon,
  MenuIcon,
} from "@/components/icons";
import { AuthActions } from "@/components/layout/auth-actions";
import { Chip } from "@/components/ui/chip";
import { cn } from "@/lib/utils";

const themeOptions = ["Light", "Dark", "Auto"] as const;
const primaryNav = [
  { label: "Home", href: "/" },
  { label: "For You", href: "#" },
  { label: "Local", href: "#" },
  { label: "Blindspot", href: "#" },
] as const;

const topicChips = [
  "World Cup",
  "IPL",
  "Social Media",
  "Business & Markets",
  "Health & Medicine",
  "Soccer",
  "Artificial Intelligence",
  "Arsenal FC",
  "Extreme Weather and Disasters",
] as const;

function formatCurrentDate() {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());
}

export function SiteHeader() {
  const currentDate = formatCurrentDate();

  return (
    <header className="border-b border-divider bg-surface text-text-primary">
      <div className="border-b border-divider/80">
        <div className="container-dailybit flex flex-col gap-2 py-2 text-caption text-text-secondary sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
            <Link
              href="#"
              className="whitespace-nowrap transition-colors hover:text-text-primary"
            >
              Browser Extension
            </Link>

            <div className="flex items-center gap-2">
              <span>Theme:</span>
              <div className="inline-flex overflow-hidden rounded-full border border-divider bg-bg-primary">
                {themeOptions.map((option, index) => {
                  const active = option === "Light";
                  return (
                    <button
                      key={option}
                      type="button"
                      className={cn(
                        "px-3 py-1 transition-colors",
                        active
                          ? "bg-text-primary text-bg-primary"
                          : "text-text-secondary hover:bg-surface hover:text-text-primary",
                        index !== themeOptions.length - 1 &&
                          "border-r border-divider",
                      )}
                      aria-pressed={active}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2 sm:justify-end">
            <span className="whitespace-nowrap">{currentDate}</span>
            <Link
              href="#"
              className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap transition-colors hover:text-text-primary"
            >
              <LocationIcon className="h-3.5 w-3.5" />
              Set Location
            </Link>
            <Link
              href="#"
              className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap transition-colors hover:text-text-primary"
            >
              <GlobeIcon className="h-3.5 w-3.5" />
              International Edition
              <ChevronDownIcon className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      <div className="border-b border-divider bg-bg-primary">
        <div className="container-dailybit flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-divider bg-bg-primary text-text-primary transition-colors hover:bg-surface"
              aria-label="Open menu"
            >
              <MenuIcon className="h-5 w-5" />
            </button>

            <Link href="/" className="flex items-end gap-2">
              <span className="flex flex-col leading-none">
                <span className="text-[1.9rem] font-extrabold tracking-[-0.06em] text-text-primary">
                  DailyBit
                </span>
                <span className="text-[0.68rem] font-medium uppercase tracking-[0.26em] text-text-secondary">
                  News
                </span>
              </span>
            </Link>
          </div>

          <nav
            aria-label="Primary"
            className="hidden items-center gap-8 lg:flex"
          >
            {primaryNav.map((item) => {
              const active = item.href === "/";
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "relative pb-1 text-body-md font-medium transition-colors",
                    active
                      ? "text-text-primary after:absolute after:inset-x-0 after:-bottom-3 after:h-0.5 after:bg-text-primary"
                      : "text-text-secondary hover:text-text-primary",
                  )}
                >
                  {item.label}
                  {item.label === "For You" ? (
                    <span
                      className="absolute -top-1.5 -right-2 h-2 w-2 rounded-full bg-rose-500"
                      aria-hidden="true"
                    />
                  ) : null}
                </Link>
              );
            })}
          </nav>

          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <Link
              href="/sign-up"
              className="inline-flex h-10 min-w-[110px] items-center justify-center rounded-md bg-text-primary px-5 text-body-md font-semibold text-bg-primary transition-colors hover:bg-text-primary/90"
            >
              Subscribe
            </Link>
            <AuthActions />
          </div>
        </div>
      </div>

      <div className="border-b border-divider bg-surface">
        <div className="container-dailybit relative flex items-center gap-3 py-3">
          <div className="pointer-events-none absolute left-0 top-0 h-full w-10 bg-gradient-to-r from-surface to-transparent" />
          <div className="pointer-events-none absolute right-0 top-0 h-full w-10 bg-gradient-to-l from-surface to-transparent" />
          <div className="hidden h-5 w-5 flex-none items-center justify-center rounded-full border border-divider bg-bg-primary text-text-secondary lg:inline-flex">
            <span className="text-[10px] font-semibold">+</span>
          </div>

          <div className="flex flex-1 items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {topicChips.map((topic, index) => (
              <Chip
                key={topic}
                label={topic}
                className={cn("whitespace-nowrap", index === 0 && "ml-1")}
              />
            ))}
          </div>

          <div className="hidden items-center gap-2 lg:flex">
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-divider bg-bg-primary text-text-secondary transition-colors hover:bg-bg-primary/80"
              aria-label="Scroll topics left"
            >
              <ChevronDownIcon className="h-4 w-4 rotate-90" />
            </button>
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-divider bg-bg-primary text-text-secondary transition-colors hover:bg-bg-primary/80"
              aria-label="Scroll topics right"
            >
              <ChevronDownIcon className="h-4 w-4 -rotate-90" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
