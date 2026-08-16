import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

/**
 * Long-lived caching is only safe where the filename changes with the content.
 *
 * A production build content-hashes everything under /_next/static, so
 * `immutable` there is exactly right. Under `next dev` Turbopack reuses chunk
 * names — the stylesheet keeps one filename for the life of the server — so
 * the same header pins whichever version a browser saw first and no ordinary
 * reload will dislodge it. That is how a complete, correct stylesheet ended up
 * rendering as an unstyled page: the markup was current and the CSS was hours
 * old. Anything already cached needs one hard reload to clear.
 *
 * Images are in the same condition for the same reason: names in public/ are
 * not hashed either, so in development a swapped asset would also stick. Their
 * production behaviour is unchanged.
 */
const staticCaching = isProd
  ? [
      {
        source: "/:path*(png|jpg|jpeg|gif|webp|avif|ico|svg)",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/_next/static/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ]
  : [
      {
        source: "/_next/static/:path*",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
    ];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/.well-known/apple-app-site-association",
        headers: [
          { key: "Content-Type", value: "application/json" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
      {
        source: "/.well-known/assetlinks.json",
        headers: [
          { key: "Content-Type", value: "application/json" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
      ...staticCaching,
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
