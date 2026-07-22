"use client";

import { Show, UserButton } from "@clerk/nextjs";
import Link from "next/link";

const signInLinkClass =
  "inline-flex h-10 items-center justify-center rounded-md border border-divider bg-bg-primary px-4 text-body-md font-medium text-text-primary transition-colors hover:bg-surface";

export function AuthActions() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Show when="signed-out">
        <Link href="/sign-in" className={signInLinkClass}>
          Sign in
        </Link>
      </Show>

      <Show when="signed-in">
        <UserButton
          appearance={{
            elements: {
              avatarBox: "h-10 w-10",
              userButtonPopoverCard: "rounded-2xl border border-divider",
            },
          }}
        />
      </Show>
    </div>
  );
}
