import "server-only";

const requiredEnv = ["OXY_WSA_USERNAME", "OXY_WSA_PASSWORD"] as const;

export function getOxylabsEnv() {
  const username = process.env.OXY_WSA_USERNAME;
  const password = process.env.OXY_WSA_PASSWORD;

  if (!username || !password) {
    throw new Error(`Missing Oxylabs env vars: ${requiredEnv.join(", ")}`);
  }

  return { username, password };
}
