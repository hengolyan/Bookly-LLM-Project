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
};

type UserInsert = {
  id: string;
  email: string;
  username: string;
  displayName: string;
  passwordHash: string;
  accountKind: AccountKind;
};

function restEnv() {
  const { url, anonKey, missing } = getSupabaseAuthEnv();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return {
    baseUrl: url?.replace(/\/$/, ""),
    key: serviceRoleKey || anonKey,
    missing: serviceRoleKey ? missing.filter((item) => item !== "NEXT_PUBLIC_SUPABASE_ANON_KEY") : missing
  };
}

async function supabaseRest(path: string, init: RequestInit = {}) {
  const { baseUrl, key, missing } = restEnv();
  if (missing.length || !baseUrl || !key) {
    return {
      ok: false,
      status: 500,
      data: null,
      error: `Missing Supabase REST environment variables: ${missing.join(", ")}.`
    };
  }

  const response = await fetch(`${baseUrl}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {})
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
      error: data?.message ?? data?.hint ?? "Supabase REST request failed."
    };
  }

  return { ok: true, status: response.status, data, error: "" };
}

function userSelect() {
  return "id,email,username,displayName,accountKind,avatarUrl,bio";
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
    bio: row.bio ?? ""
  };
}

export async function findUserProfileById(id: string) {
  const result = await supabaseRest(`User?id=eq.${encodeURIComponent(id)}&select=${userSelect()}&limit=1`);
  if (!result.ok) throw new Error(result.error);
  return normalizeUser(result.data?.[0]);
}

export async function findUserProfileByEmail(email: string) {
  const result = await supabaseRest(`User?email=eq.${encodeURIComponent(email)}&select=${userSelect()}&limit=1`);
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

