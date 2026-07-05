// Ambient types for the Google Ads gtag.js global that is loaded in app/layout.tsx.
// Picked up automatically via the tsconfig "**/*.ts" include — no config change needed.
export {};

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}
