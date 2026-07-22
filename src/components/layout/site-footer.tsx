import Link from "next/link";
import {
  InstagramIcon,
  LinkedInIcon,
  XIcon,
  YouTubeIcon,
} from "@/components/icons";

const companyLinks = ["About", "Careers", "Press", "Contact"];
const helpLinks = [
  "Help Center",
  "Guides",
  "Privacy Policy",
  "Terms of Service",
];

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-white/10 bg-[#0D0D0F] text-white">
      <div className="container-dailybit grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="max-w-sm">
          <p className="text-[1.9rem] font-extrabold tracking-[-0.06em]">
            DailyBit
          </p>
          <p className="mt-4 max-w-xs text-body-sm text-white/70">
            Balanced news coverage, powered by AI.
          </p>
        </div>

        <div>
          <h2 className="text-body-sm font-semibold text-white">Company</h2>
          <ul className="mt-4 space-y-3 text-body-sm text-white/70">
            {companyLinks.map((item) => (
              <li key={item}>
                <Link href="#" className="transition-colors hover:text-white">
                  {item}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-body-sm font-semibold text-white">Help</h2>
          <ul className="mt-4 space-y-3 text-body-sm text-white/70">
            {helpLinks.map((item) => (
              <li key={item}>
                <Link href="#" className="transition-colors hover:text-white">
                  {item}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-body-sm font-semibold text-white">Connect</h2>
          <div className="mt-4 flex items-center gap-4">
            <Link
              href="#"
              aria-label="X"
              className="text-white/80 hover:text-white"
            >
              <XIcon className="h-5 w-5" />
            </Link>
            <Link
              href="#"
              aria-label="LinkedIn"
              className="text-white/80 hover:text-white"
            >
              <LinkedInIcon className="h-5 w-5" />
            </Link>
            <Link
              href="#"
              aria-label="Instagram"
              className="text-white/80 hover:text-white"
            >
              <InstagramIcon className="h-5 w-5" />
            </Link>
            <Link
              href="#"
              aria-label="YouTube"
              className="text-white/80 hover:text-white"
            >
              <YouTubeIcon className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-dailybit flex flex-col gap-2 py-4 text-caption text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>(c) 2026 DailyBit News. All rights reserved.</p>
          <p>Balanced news coverage powered by AI.</p>
        </div>
      </div>
    </footer>
  );
}
