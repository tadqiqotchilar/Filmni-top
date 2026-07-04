import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";

export interface AdminJwtPayload {
  scope: "admin";
}

export function signAdminToken(): string {
  return jwt.sign({ scope: "admin" }, env.ADMIN_JWT_SECRET, { expiresIn: "12h" });
}

export function verifyAdminToken(token: string): AdminJwtPayload {
  const payload = jwt.verify(token, env.ADMIN_JWT_SECRET) as AdminJwtPayload;
  if (payload.scope !== "admin") throw new Error("invalid_scope");
  return payload;
}
