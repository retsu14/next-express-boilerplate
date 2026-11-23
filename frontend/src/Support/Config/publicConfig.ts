/**
 * Configuration that is safe to ship to the browser.
 *
 * NEXT_PUBLIC_* values are inlined into client bundles, so only public
 * information may live here. The literal `process.env.NEXT_PUBLIC_API_URL`
 * expression is required for Next.js to inline it.
 */
export const publicConfig = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api",
} as const;
