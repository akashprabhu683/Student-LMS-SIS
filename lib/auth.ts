import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

export type Role = "MENTOR" | "STUDENT";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

const JWT_SECRET = process.env.JWT_SECRET || "cohort-secret-key-at-least-32-characters";
export const AUTH_COOKIE_NAME = "cohort_session";

export function signToken(user: SessionUser): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: "14d" });
}

export function verifyToken(token: string): SessionUser | null {
  try {
    return jwt.verify(token, JWT_SECRET) as SessionUser;
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}
