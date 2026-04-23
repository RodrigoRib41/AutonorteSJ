export const PUBLIC_CATALOG_CACHE_HEADERS = {
  "Cache-Control": "public, max-age=0, must-revalidate",
  "CDN-Cache-Control": "public, max-age=60, stale-while-revalidate=300",
  "Netlify-CDN-Cache-Control":
    "public, max-age=60, stale-while-revalidate=300, durable",
} as const;

export const NO_STORE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0, must-revalidate",
} as const;
