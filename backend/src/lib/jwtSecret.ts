// Single source for the signing secret behind every session token (customer/cook and admin alike).
//
// `process.env.JWT_SECRET ?? ""` fails *open*: a missing or blanked env var silently downgrades
// the whole auth system to an empty/well-known secret, and nothing in the app looks broken —
// tokens are still issued and "verified" successfully. Fail closed instead, at module load, so the
// process refuses to start rather than serve forgeable tokens.
const MIN_LENGTH = 16;
const PLACEHOLDER = "changeme-generate-a-long-random-string"; // backend/.env.example's value

export function requireJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret === PLACEHOLDER || secret.length < MIN_LENGTH) {
    throw new Error(
      `JWT_SECRET is unset, too short (<${MIN_LENGTH} chars), or left at the .env.example placeholder. ` +
        "Refusing to start — every session and admin token would be forgeable.",
    );
  }
  return secret;
}
