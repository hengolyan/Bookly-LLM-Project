const requiredServerEnv = [
  "DATABASE_URL",
  "DIRECT_URL",
  "JWT_SECRET",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY"
] as const;

export function getMissingServerEnv() {
  return requiredServerEnv.filter((key) => !process.env[key]);
}

export function logServerError(scope: string, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[BOOKLY:${scope}] ${message}`);
}

export function databaseUnavailableMessage() {
  const missing = getMissingServerEnv();
  if (missing.length) {
    return `BOOKLY is missing server environment variables: ${missing.join(", ")}.`;
  }

  return "BOOKLY could not connect to the database. Check DATABASE_URL, DIRECT_URL, Supabase access, and Prisma generation.";
}

export function sanitizeErrorDetails(details: string) {
  return details
    .replace(/postgresql:\/\/([^:\s]+):([^@\s]+)@/gi, "postgresql://$1:[redacted]@")
    .replace(/(apikey|authorization|password|token|secret|service_role)[=:]\s*[^,\s)]+/gi, "$1=[redacted]");
}

export function apiErrorMessage(error: unknown, fallback = databaseUnavailableMessage()) {
  const details = error instanceof Error ? error.message : String(error);
  return details ? `${fallback} (${sanitizeErrorDetails(details)})` : fallback;
}
