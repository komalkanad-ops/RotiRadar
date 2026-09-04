import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { requireJwtSecret } from "../lib/jwtSecret.js";

const JWT_SECRET = requireJwtSecret();

// Token shapes:
//   customer/cook: { sub: <id>, role: "CUSTOMER" | "COOK" }
//   admin:         { sub: <adminId>, role: "ADMIN", adminRole: AdminRole }
export interface AuthClaims {
  sub: string;
  role: "CUSTOMER" | "COOK" | "ADMIN";
  adminRole?: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthClaims;
    }
  }
}

function readToken(req: Request): AuthClaims | null {
  const header = req.header("Authorization");
  if (!header?.startsWith("Bearer ")) return null;
  try {
    return jwt.verify(header.slice(7), JWT_SECRET) as AuthClaims;
  } catch {
    return null;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const claims = readToken(req);
  if (!claims || claims.role === "ADMIN") return res.status(401).json({ error: "Sign in to continue" });
  req.auth = claims;
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const claims = readToken(req);
  if (!claims || claims.role !== "ADMIN") return res.status(401).json({ error: "Admin access required" });
  req.auth = claims;
  next();
}
