import type { Metadata } from "next";
import { SignIn } from "@clerk/nextjs";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to access DailyBit article details.",
};

export default function SignInPage() {
  return (
    <div className="bg-surface">
      <section className="container-dailybit flex min-h-[calc(100vh-240px)] items-center justify-center py-12">
        <div className="w-full max-w-[520px] rounded-3xl border border-border bg-bg-primary p-4 shadow-sm sm:p-6">
          <div className="mb-6 text-center">
            <p className="text-caption uppercase tracking-[0.24em] text-text-secondary">
              DailyBit access
            </p>
            <h1 className="mt-2 text-h2 text-text-primary">
              Sign in to read the full analysis
            </h1>
            <p className="mt-2 text-body-sm text-text-secondary">
              News detail pages are reserved for signed-in readers.
            </p>
          </div>

          <div className="flex justify-center">
            <SignIn signUpUrl="/sign-up" fallbackRedirectUrl="/" />
          </div>
        </div>
      </section>
    </div>
  );
}
