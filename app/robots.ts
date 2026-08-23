import { isStaging } from "@/config";
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  /* Staging serves a byte-identical copy of the marketing site on a public
     domain, and the Hobby plan has no password protection to hide it behind —
     this file is the thing keeping it out of search results. `sitemap` and
     `host` are omitted rather than reused: both point at www.laundryfree.co.uk,
     and naming the production sitemap from the staging host is exactly the
     duplicate-content signal being avoided. */
  if (isStaging) {
    return {
      rules: [{ userAgent: "*", disallow: "/" }],
    };
  }

  return {
    rules: [
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/api/", "/_next/static/"],
      },
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/_next/static/"],
      },
    ],
    sitemap: "https://www.laundryfree.co.uk/sitemap.xml",
    host: "https://www.laundryfree.co.uk",
  };
}
