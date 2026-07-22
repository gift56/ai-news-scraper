import { MenuIcon, SearchIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="border-b border-border bg-bg-primary">
      <div className="container-dailybit flex items-center justify-between gap-4 py-4 md:py-6">
        <div className="min-w-0">
          <p className="text-h2 font-semibold text-text-primary">DailyBit</p>
          <p className="text-body-sm text-text-secondary">
            Balanced news coverage, powered by AI.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="text"
            className="hidden px-2 sm:inline-flex"
            aria-label="Search"
          >
            <SearchIcon className="h-5 w-5" />
          </Button>
          <Button variant="text" className="px-2" aria-label="Open menu">
            <MenuIcon className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
