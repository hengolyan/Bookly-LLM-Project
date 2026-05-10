import { AccountKind } from "@prisma/client";

type SupabaseAuthResponse = {
  id?: string;
  email?: string;
  user?: {
    id: string;
    email?: string;
  };
  session?: {
    access_token?: string;
  };
  access_token?: string;
  error?: string;
  error_description?: string;
  msg?: string;
};

export function getSupabaseAuthEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const missing = [
    !url ? "NEXT_PUBLIC_SUPABASE_URL" : null,
    !anonKey ? "NEXT_PUBLIC_SUPABASE_ANON_KEY" : null
  ].filter(Boolean) as string[];

  return { url, anonKey, missing };
}

function supabaseAuthError(data: SupabaseAuthResponse, fallback: string) {
  return data.error_description ?? data.msg ?? data.error ?? fallback;
}

function normalizeSupabaseError(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes("already") && lower.includes("registered")) return "Email already exists.";
  if (lower.includes("already") && lower.includes("email")) return "Email already exists.";
  if (lower.includes("password")) return message;
  return message;
}

async function callSupabaseAuth(path: string, body: Record<string, unknown>) {
  const { url, anonKey, missing } = getSupabaseAuthEnv();
  if (missing.length) {
    return {
      ok: false,
      status: 500,
      error: `Missing Supabase Auth environment variables: ${missing.join(", ")}.`
    };
  }

  const response = await fetch(`${url!.replace(/\/$/, "")}/auth/v1/${path}`, {
    method: "POST",
    headers: {
      apikey: anonKey!,
      Authorization: `Bearer ${anonKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body),
    cache: "no-store"
  });
  const data = (await response.json().catch(() => ({}))) as SupabaseAuthResponse;

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      error: normalizeSupabaseError(supabaseAuthError(data, "Supabase Auth request failed."))
    };
  }

  return { ok: true, status: response.status, data };
}

export async function signUpWithSupabaseAuth({
  email,
  password,
  username,
  displayName,
  accountKind
}: {
  email: string;
  password: string;
  username: string;
  displayName: string;
  accountKind: AccountKind;
}) {
  return callSupabaseAuth("signup", {
    email,
    password,
    data: {
      username,
      display_name: displayName,
      account_kind: accountKind
    }
  });
}

export async function signInWithSupabaseAuth({ email, password }: { email: string; password: string }) {
  return callSupabaseAuth("token?grant_type=password", { email, password });
}
