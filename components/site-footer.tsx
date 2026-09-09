import Link from "next/link";
import { SUPPORT_CONTACT_EMAIL } from "@/lib/constants";

export function SiteFooter() {
  return (
    <footer className="mt-auto flex flex-wrap items-center justify-center gap-x-4 gap-y-1 border-t px-4 py-4 text-xs text-muted-foreground">
      <span>© {new Date().getFullYear()} Dr. Wash</span>
      <Link href="/privacy" className="hover:underline">
        Privacy Policy
      </Link>
      <a href={`mailto:${SUPPORT_CONTACT_EMAIL}`} className="hover:underline">
        Contact
      </a>
    </footer>
  );
}
