import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

export type Role = "SUPER_ADMIN" | "DEPARTMENT_ADMIN" | "FACULTY" | "MENTOR" | "STUDENT";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  institutionId?: string | null;
  departmentId?: string | null;
  studentProfileId?: string | null;
  facultyProfileId?: string | null;
}

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-min-32-characters-needed";
const COOKIE_NAME = "lms_token";

export function signToken(user: SessionUser): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: "7d" });
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
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return verifyToken(token);
  } catch {
    return null;
  }
}

export function getSessionFromRequest(req: NextRequest): SessionUser | null {
  const token = req.cookies.get(COOKIE_NAME)?.value || req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  return verifyToken(token);
}

export const AUTH_COOKIE_NAME = COOKIE_NAME;
