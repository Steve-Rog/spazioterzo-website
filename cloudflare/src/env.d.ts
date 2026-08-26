interface Env {
  DB: D1Database;
  MEDIA: R2Bucket;
  ENVIRONMENT: "development" | "production";
  PUBLIC_MEDIA_BASE_URL: string;
  ADMIN_ORIGIN?: string;
  ACCESS_TEAM_DOMAIN?: string;
  ACCESS_AUDIENCE?: string;
}
