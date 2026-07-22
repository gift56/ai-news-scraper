import type { Metadata } from "next";
import { SignUp } from "@clerk/nextjs";

export const metadata: Metadata = {
  title: "Sign up",
  description: "Create a DailyBit account to read article details.",
};

export default function SignUpPage() {
  return (
    <div className="bg-surface">
      <section className="container-dailybit flex min-h-[calc(100vh-240px)] items-center justify-center py-12">
        <div className="w-full max-w-[520px] rounded-3xl border border-border bg-bg-primary p-4 shadow-sm sm:p-6">
          <div className="mb-6 text-center">
            <p className="text-caption uppercase tracking-[0.24em] text-text-secondary">
              DailyBit access
            </p>
            <h1 className="mt-2 text-h2 text-text-primary">
              Create an account to continue
            </h1>
            <p className="mt-2 text-body-sm text-text-secondary">
              Sign up once, then keep reading the protected news analysis.
            </p>
          </div>

          <div className="flex justify-center">
            <SignUp signInUrl="/sign-in" fallbackRedirectUrl="/" />
          </div>
        </div>
      </section>
    </div>
  );
}
