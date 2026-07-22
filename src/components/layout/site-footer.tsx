export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-divider bg-surface">
      <div className="container-dailybit flex flex-col gap-2 py-8 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-h4 text-text-primary">DailyBit</p>
          <p className="text-body-sm text-text-secondary">
            Stay consistent. Stay unbiased.
          </p>
        </div>
        <p className="text-caption text-text-secondary">
          Design System v1.0 · June 1, 2026
        </p>
      </div>
    </footer>
  );
}
