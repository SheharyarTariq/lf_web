import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
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
