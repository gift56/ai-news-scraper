const requiredPublicEnv = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;

const requiredServerEnv = ["SUPABASE_SERVICE_ROLE_KEY"] as const;

export function getPublicSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      `Missing Supabase public env vars: ${requiredPublicEnv.join(", ")}`,
    );
  }

  return { url, anonKey };
}

export function getServiceSupabaseEnv() {
  const { url, anonKey } = getPublicSupabaseEnv();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error(
      `Missing Supabase server env var: ${requiredServerEnv.join(", ")}`,
    );
  }

  return { url, anonKey, serviceRoleKey };
}

export function getAdminSecret() {
  const secret = process.env.DailyBit_ADMIN_SECRET;

  if (!secret) {
    throw new Error("Missing server env var: DailyBit_ADMIN_SECRET");
  }

  return secret;
}
