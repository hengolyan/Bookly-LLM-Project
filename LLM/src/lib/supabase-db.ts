import { AccountKind } from "@prisma/client";
import { getSupabaseAuthEnv } from "@/lib/supabase-auth";

export type PublicUserProfile = {
  id: string;
  email: string;
  username: string;
  displayName: string;
  accountKind: AccountKind;
  avatarUrl: string | null;
  bio: string;
  passwordHash?: string;
};

type UserInsert = {
  id: string;
  email: string;
  username: string;
  displayName: string;
  passwordHash: string;
  accountKind: AccountKind;
  accessToken?: string;
};

function restEnv(accessToken?: string) {
  const { url, anonKey, missing } = getSupabaseAuthEnv();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return {
    baseUrl: url?.replace(/\/$/, ""),
    apiKey: serviceRoleKey || anonKey,
    authToken: serviceRoleKey || accessToken || anonKey,
    missing: serviceRoleKey ? missing.filter((item) => item !== "NEXT_PUBLIC_SUPABASE_ANON_KEY") : missing
  };
}

type SupabaseRestInit = RequestInit & { accessToken?: string };

async function supabaseRest(path: string, init: SupabaseRestInit = {}) {
  const accessToken = init.accessToken;
  const { baseUrl, apiKey, authToken, missing } = restEnv(accessToken);
  const { accessToken: _accessToken, ...fetchInit } = init;
  if (missing.length || !baseUrl || !apiKey || !authToken) {
    return {
      ok: false,
      status: 500,
      data: null,
      error: `Missing Supabase REST environment variables: ${missing.join(", ")}.`
    };
  }

  const response = await fetch(`${baseUrl}/rest/v1/${path}`, {
    ...fetchInit,
    headers: {
      apikey: apiKey,
      Authorization: `Bearer ${authToken}`,
      "Content-Type": "application/json",
      ...(fetchInit.headers ?? {})
    },
    cache: "no-store"
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      data: null,
      error:
        data?.code === "42501" || String(data?.message ?? "").toLowerCase().includes("row-level security")
          ? "Profile insert blocked by Supabase Row Level Security. Add SUPABASE_SERVICE_ROLE_KEY to the server env or run the BOOKLY RLS policies from supabase-schema.sql."
          : data?.message ?? data?.hint ?? "Supabase REST request failed."
    };
  }

  return { ok: true, status: response.status, data, error: "" };
}

export async function supabaseServiceRest(path: string, init: RequestInit = {}) {
  return supabaseRest(path, init);
}

function userSelect({ includePasswordHash = false }: { includePasswordHash?: boolean } = {}) {
  return `id,email,username,displayName,accountKind,avatarUrl,bio${includePasswordHash ? ",passwordHash" : ""}`;
}

function normalizeUser(row: any): PublicUserProfile | null {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    username: row.username,
    displayName: row.displayName,
    accountKind: row.accountKind,
    avatarUrl: row.avatarUrl ?? null,
    bio: row.bio ?? "",
    ...(typeof row.passwordHash === "string" ? { passwordHash: row.passwordHash } : {})
  };
}

export async function findUserProfileById(id: string) {
  const result = await supabaseRest(`User?id=eq.${encodeURIComponent(id)}&select=${userSelect()}&limit=1`);
  if (!result.ok) throw new Error(result.error);
  return normalizeUser(result.data?.[0]);
}

export async function findUserProfileByEmail(email: string) {
  const result = await supabaseRest(`User?email=eq.${encodeURIComponent(email)}&select=${userSelect({ includePasswordHash: true })}&limit=1`);
  if (!result.ok) throw new Error(result.error);
  return normalizeUser(result.data?.[0]);
}

export async function findUserProfileByUsername(username: string) {
  const result = await supabaseRest(`User?username=eq.${encodeURIComponent(username)}&select=${userSelect()}&limit=1`);
  if (!result.ok) throw new Error(result.error);
  return normalizeUser(result.data?.[0]);
}

export async function createUserProfile(input: UserInsert) {
  const result = await supabaseRest(`User?select=${userSelect()}`, {
    method: "POST",
    accessToken: input.accessToken,
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      id: input.id,
      email: input.email,
      username: input.username,
      displayName: input.displayName,
      passwordHash: input.passwordHash,
      accountKind: input.accountKind
    })
  });

  if (!result.ok) throw new Error(result.error);
  return normalizeUser(result.data?.[0]);
}

export async function ensureUserProfile(input: {
  id: string;
  email: string;
  username: string;
  displayName: string;
  accountKind: AccountKind;
}) {
  const existing = await findUserProfileById(input.id);
  if (existing) return existing;

  const result = await supabaseServiceRest(`User?select=${userSelect()}`, {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      id: input.id,
      email: input.email,
      username: input.username,
      displayName: input.displayName,
      passwordHash: "supabase-auth-managed",
      accountKind: input.accountKind
    })
  });

  if (!result.ok) throw new Error(result.error);
  return normalizeUser(result.data?.[0]);
}
