import { getToken } from "./api";

export interface AdminClaims {
  sub: string;
  role: "ADMIN";
  adminRole?: "SUPER_ADMIN" | "SUPPORT_AGENT" | "CITY_MANAGER";
}

// Reads the admin's role out of the JWT payload for UI gating only. The server re-checks every
// request — this is never a security boundary, just what to show.
export function claims(): AdminClaims | null {
  const token = getToken();
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
}

export const isSuperAdmin = () => claims()?.adminRole === "SUPER_ADMIN";
