"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { recordAnalyticsEvent } from "@/app/actions/analytics";

// Fires once per full page load/navigation — the in-app tabs (browse, shop,
// account, etc. in DashboardShell) don't change the pathname, so this counts
// actual site visits the same way a page-load analytics beacon would, not
// every tab click.
export function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    recordAnalyticsEvent("PAGE_VIEW");
  }, [pathname]);

  return null;
}
