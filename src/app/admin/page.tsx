"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

type PipelineState = "idle" | "scraping" | "analyzing" | "done" | "error";

type PipelineSummary = {
  scrape?: Record<string, unknown>;
  analyze?: Record<string, unknown>;
};

const DEFAULT_ANALYSIS_LIMIT = 3;
const steps = [
  { label: "Ready", progress: 0 },
  { label: "Scraping", progress: 50 },
  { label: "Analyzing", progress: 90 },
  { label: "Complete", progress: 100 },
];

export default function AdminPipelinePage() {
  const router = useRouter();
  const [adminSecret, setAdminSecret] = useState("");
  const [analysisLimit, setAnalysisLimit] = useState(DEFAULT_ANALYSIS_LIMIT);
  const [isRunning, setIsRunning] = useState(false);
  const [state, setState] = useState<PipelineState>("idle");
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState(
    "Enter your DailyBit admin secret to run the full pipeline.",
  );
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<PipelineSummary>({});

  const stepState = steps.map((step) => {
    const active =
      (state === "done" && step.label === "Complete") ||
      (step.label === "Scraping" && state === "scraping") ||
      (step.label === "Analyzing" && state === "analyzing") ||
      (step.label === "Ready" && state === "idle");

    const finished =
      (state === "done" && step.progress <= progress) ||
      (state === "scraping" && step.label === "Scraping") ||
      (state === "analyzing" && step.label !== "Ready");

    return {
      ...step,
      active,
      finished,
    };
  });

  async function runPipeline() {
    if (!adminSecret.trim()) {
      setError("Please enter the DailyBit admin secret.");
      return;
    }

    setIsRunning(true);
    setError("");
    setState("scraping");
    setProgress(8);
    setSummary({});
    setStatusMessage("Starting the scrape pipeline...");

    try {
      const scrapeHeaders = {
        "Content-Type": "application/json",
        "x-DailyBit-admin-secret": adminSecret,
      };

      const scrapeResponse = await fetch("/api/scrape", {
        method: "POST",
        headers: scrapeHeaders,
        body: JSON.stringify({ perSourceLimit: 5 }),
      });

      const scrapeData = await scrapeResponse.json().catch(() => ({}));

      if (!scrapeResponse.ok) {
        throw new Error(
          scrapeData?.error ?? "The scrape route rejected the request.",
        );
      }

      setProgress(55);
      setSummary((current) => ({ ...current, scrape: scrapeData }));
      setStatusMessage(
        `Scrape finished: ${Number(scrapeData?.articlesInserted ?? 0)} new articles imported.`,
      );

      setState("analyzing");
      setProgress(62);
      setStatusMessage("Analyzing pending articles with Gemini...");

      const analysisResponse = await fetch("/api/analyze", {
        method: "POST",
        headers: scrapeHeaders,
        body: JSON.stringify({
          limit: Math.max(1, Math.min(analysisLimit, 10)),
        }),
      });

      const analysisData = await analysisResponse.json().catch(() => ({}));

      if (!analysisResponse.ok) {
        throw new Error(
          analysisData?.error ?? "The analysis route rejected the request.",
        );
      }

      setProgress(95);
      setSummary((current) => ({ ...current, analyze: analysisData }));
      setStatusMessage(
        `AI analysis complete: ${Number(analysisData?.articlesAnalyzed ?? 0)} analyzed.`,
      );

      setState("done");
      setProgress(100);
      setTimeout(() => {
        router.push("/");
      }, 1800);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "The pipeline failed.";
      setError(message);
      setState("error");
      setProgress(0);
      setStatusMessage("The run stopped before completion.");
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <main className="bg-surface">
      <section className="container-dailybit py-12 md:py-16">
        <div className="mx-auto max-w-3xl rounded-3xl border border-border bg-bg-primary p-6 shadow-sm md:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-caption uppercase tracking-[0.2em] text-text-secondary">
                DailyBit admin
              </p>
              <h1 className="mt-2 text-h1 text-text-primary">
                Run the newsroom pipeline
              </h1>
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push("/")}
              className="hidden md:inline-flex"
            >
              Back to home
            </Button>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-4">
              <label className="block text-body-sm font-medium text-text-primary">
                DailyBit admin secret
                <input
                  type="password"
                  value={adminSecret}
                  onChange={(event) => setAdminSecret(event.target.value)}
                  placeholder="Paste your admin secret"
                  className="mt-2 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-body-md text-text-primary outline-none transition-colors placeholder:text-text-secondary focus:border-text-primary"
                />
              </label>

              <label className="block text-body-sm font-medium text-text-primary">
                Max AI analyses to run
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={analysisLimit}
                  onChange={(event) =>
                    setAnalysisLimit(
                      Math.max(
                        1,
                        Math.min(10, Number(event.target.value) || 1),
                      ),
                    )
                  }
                  className="mt-2 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-body-md text-text-primary outline-none transition-colors focus:border-text-primary"
                />
              </label>

              <Button
                type="button"
                onClick={runPipeline}
                disabled={isRunning}
                className="w-full justify-center py-3"
              >
                {isRunning ? "Running pipeline..." : "Start scrape + analysis"}
              </Button>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-4">
              <p className="text-caption uppercase tracking-[0.18em] text-text-secondary">
                Progress
              </p>
              <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-bg-primary">
                <div
                  className="h-full rounded-full bg-text-primary transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <p className="mt-5 text-body-md font-medium text-text-primary">
                {statusMessage}
              </p>

              <div className="mt-5 space-y-3">
                {stepState.map((step) => (
                  <div key={step.label} className="flex items-center gap-3">
                    <div
                      className={`h-2.5 w-2.5 rounded-full ${
                        step.active || step.finished
                          ? "bg-text-primary"
                          : "bg-bg-primary"
                      }`}
                    />
                    <span
                      className={
                        step.active || step.finished
                          ? "text-body-sm font-medium text-text-primary"
                          : "text-body-sm text-text-secondary"
                      }
                    >
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {error ? (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-body-sm text-red-700">
              {error}
            </div>
          ) : null}

          {summary.scrape || summary.analyze ? (
            <div className="mt-6 rounded-2xl border border-border bg-surface p-4">
              <p className="text-caption uppercase tracking-[0.2em] text-text-secondary">
                Result summary
              </p>
              <div className="mt-4 space-y-3 text-body-sm text-text-primary">
                {summary.scrape ? (
                  <p>
                    Scrape: {Number(summary.scrape.articlesInserted ?? 0)}{" "}
                    inserted / {Number(summary.scrape.articlesRejected ?? 0)}{" "}
                    rejected.
                  </p>
                ) : null}
                {summary.analyze ? (
                  <p>
                    Analysis: {Number(summary.analyze.articlesAnalyzed ?? 0)}{" "}
                    analyzed / {Number(summary.analyze.articlesFailed ?? 0)}{" "}
                    failed.
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
