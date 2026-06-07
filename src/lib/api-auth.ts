import "server-only";

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

export function verifyApiToken(authHeader: string | null): boolean {
  if (!authHeader) return false;
  const expected = process.env.API_TOKEN;
  if (!expected) return false;
  const prefix = "Bearer ";
  if (!authHeader.startsWith(prefix)) return false;
  const provided = authHeader.slice(prefix.length).trim();
  if (!provided) return false;
  return timingSafeEqual(provided, expected);
}
