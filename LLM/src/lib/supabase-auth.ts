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
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const missing = [
    !rawUrl ? "NEXT_PUBLIC_SUPABASE_URL" : null,
    !anonKey ? "NEXT_PUBLIC_SUPABASE_ANON_KEY" : null
  ].filter(Boolean) as string[];

  const url = normalizeSupabaseProjectUrl(rawUrl);
  return { url, anonKey, missing };
}

export function normalizeSupabaseProjectUrl(rawUrl?: string) {
  if (!rawUrl) return rawUrl;
  const value = rawUrl.trim().replace(/^['"]|['"]$/g, "");
  const dashboardMatch = value.match(/supabase\.com\/dashboard\/project\/([a-z0-9]+)/i);
  if (dashboardMatch?.[1]) return `https://${dashboardMatch[1]}.supabase.co`;
  const refMatch = value.match(/\b([a-z0-9]{20})\b/i);
  if (!value.includes("supabase.co") && refMatch?.[1]) return `https://${refMatch[1]}.supabase.co`;

  try {
    const parsed = new URL(value);
    if (parsed.hostname.endsWith(".supabase.co")) return parsed.origin;
  } catch {
    if (/^[a-z0-9]{20}$/i.test(value)) return `https://${value}.supabase.co`;
  }

  return value.replace(/\/+$/, "");
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

export async function sendPasswordRecoveryEmail({ email, redirectTo }: { email: string; redirectTo: string }) {
  return callSupabaseAuth(`recover?redirect_to=${encodeURIComponent(redirectTo)}`, {
    email,
    gotrue_meta_security: {}
  });
}

export async function updateSupabasePassword({ accessToken, password }: { accessToken: string; password: string }) {
  const { url, anonKey, missing } = getSupabaseAuthEnv();
  if (missing.length) {
    return {
      ok: false,
      status: 500,
      error: `Missing Supabase Auth environment variables: ${missing.join(", ")}.`
    };
  }

  const response = await fetch(`${url!.replace(/\/$/, "")}/auth/v1/user`, {
    method: "PUT",
    headers: {
      apikey: anonKey!,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ password }),
    cache: "no-store"
  });
  const data = (await response.json().catch(() => ({}))) as SupabaseAuthResponse;

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      error: normalizeSupabaseError(supabaseAuthError(data, "Password reset failed."))
    };
  }

  return { ok: true, status: response.status, data };
}
