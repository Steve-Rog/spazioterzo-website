interface Env {
  DB: D1Database;
  MEDIA: R2Bucket;
  ASSETS: Fetcher;
  ENVIRONMENT: "local" | "development" | "production";
  PUBLIC_MEDIA_BASE_URL: string;
  ADMIN_ORIGIN?: string;
  ACCESS_TEAM_DOMAIN?: string;
  ACCESS_AUDIENCE?: string;
  CF_ZONE_ID?: string;
  CF_CACHE_PURGE_TOKEN?: string;
  PUBLIC_API_BASE_URL?: string;
}
