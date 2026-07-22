import Link from "next/link";

export default function NotFound() {
  return (
    <div className="bg-surface">
      <section className="container-dailybit flex min-h-[50vh] items-center justify-center py-16">
        <div className="max-w-xl rounded-2xl border border-border bg-bg-primary p-8 text-center shadow-sm">
          <p className="text-caption uppercase tracking-[0.2em] text-text-secondary">
            Article not found
          </p>
          <h1 className="mt-3 text-h1 text-text-primary">
            We could not find that news story.
          </h1>
          <p className="mt-4 text-body-md text-text-secondary">
            The slug may be invalid or the article may have been removed.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-text-primary px-5 text-body-md font-semibold text-bg-primary transition-colors hover:bg-text-primary/90"
          >
            Return home
          </Link>
        </div>
      </section>
    </div>
  );
}
