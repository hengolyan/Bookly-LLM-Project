const requiredServerEnv = ["DATABASE_URL", "DIRECT_URL", "JWT_SECRET", "NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"] as const;

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
