"use client";

import type { ComponentProps } from "react";
import { reportAppDownloadConversion } from "@/lib/gtag";

// Anchor that fires the Google Ads app-download conversion on click, then lets the
// browser follow the href as normal. Exists because the store badges and the
// "Get the App" button live in Server Components, which can't attach onClick.
// Accepts all the usual <a> props (href, target, rel, className, aria-label, …).
export default function ConversionLink({
  onClick,
  children,
  ...props
}: ComponentProps<"a">) {
  return (
    <a
      {...props}
      onClick={(e) => {
        reportAppDownloadConversion();
        onClick?.(e);
      }}
    >
      {children}
    </a>
  );
}
