import "server-only";

import { getAdminSecret } from "@/lib/supabase/env";

const ADMIN_SECRET_HEADER = "x-DailyBit-admin-secret";

export function verifyAdminSecret(request: Request): boolean {
  const provided = request.headers.get(ADMIN_SECRET_HEADER);

  if (!provided) {
    return false;
  }

  try {
    return provided === getAdminSecret();
  } catch {
    return false;
  }
}

export function unauthorizedAdminResponse() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}
