import { prisma } from "@/lib/prisma";
import { sanitizeErrorDetails } from "@/lib/env";
import { getSupabaseAuthEnv } from "@/lib/supabase-auth";

type DiagnosticStatus = "pass" | "fail" | "warn";

export type DiagnosticCheck = {
  name: string;
  status: DiagnosticStatus;
  message: string;
};

const requiredEnv = [
  "DATABASE_URL",
  "DIRECT_URL",
  "JWT_SECRET",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY"
];

function safeError(error: unknown) {
  return sanitizeErrorDetails(error instanceof Error ? error.message : String(error));
}

function hasUsableValue(value: string | undefined) {
  return Boolean(value && !/YOUR|replace|paste|change-me/i.test(value));
}

async function checkSupabaseAuth() {
  const { url, anonKey, missing } = getSupabaseAuthEnv();
  if (missing.length || !url || !anonKey) {
    return {
      name: "Supabase Auth",
      status: "fail" as const,
      message: `Missing ${missing.join(", ")}.`
    };
  }

  try {
    const response = await fetch(`${url.replace(/\/$/, "")}/auth/v1/settings`, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`
      },
      cache: "no-store"
    });

    if (!response.ok) {
      const text = await response.text();
      return {
        name: "Supabase Auth",
        status: "fail" as const,
        message: `Auth settings returned ${response.status}: ${sanitizeErrorDetails(text)}`
      };
    }

    return {
      name: "Supabase Auth",
      status: "pass" as const,
      message: "Auth API is reachable with the anon key."
    };
  } catch (error) {
    return {
      name: "Supabase Auth",
      status: "fail" as const,
      message: safeError(error)
    };
  }
}

async function checkSupabaseRest() {
  const { url, anonKey, missing } = getSupabaseAuthEnv();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (missing.length || !url || !anonKey || !serviceRoleKey) {
    return {
      name: "Supabase REST",
      status: "fail" as const,
      message: `Missing ${[...missing, !serviceRoleKey ? "SUPABASE_SERVICE_ROLE_KEY" : null].filter(Boolean).join(", ")}.`
    };
  }

  try {
    const response = await fetch(`${url.replace(/\/$/, "")}/rest/v1/User?select=id&limit=1`, {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`
      },
      cache: "no-store"
    });
    const text = await response.text();

    if (!response.ok) {
      return {
        name: "Supabase REST",
        status: "fail" as const,
        message: `User table returned ${response.status}: ${sanitizeErrorDetails(text)}`
      };
    }

    return {
      name: "Supabase REST",
      status: "pass" as const,
      message: "Service role can read the User table."
    };
  } catch (error) {
    return {
      name: "Supabase REST",
      status: "fail" as const,
      message: safeError(error)
    };
  }
}

async function checkPrisma() {
  try {
    await prisma.$queryRaw`select 1`;
    return {
      name: "Prisma Database",
      status: "pass" as const,
      message: "Prisma can connect to Supabase PostgreSQL."
    };
  } catch (error) {
    return {
      name: "Prisma Database",
      status: "fail" as const,
      message: safeError(error)
    };
  }
}

export async function runDiagnostics() {
  const envChecks: DiagnosticCheck[] = requiredEnv.map((key) => ({
    name: `Env: ${key}`,
    status: hasUsableValue(process.env[key]) ? "pass" : "fail",
    message: hasUsableValue(process.env[key]) ? "Present." : "Missing or placeholder value."
  }));

  const checks = await Promise.all([checkSupabaseAuth(), checkSupabaseRest(), checkPrisma()]);
  const allChecks = [...envChecks, ...checks];

  return {
    ok: allChecks.every((check) => check.status === "pass"),
    checkedAt: new Date().toISOString(),
    checks: allChecks
  };
}
