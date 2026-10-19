import { Role } from "./auth";

export const PERMISSIONS = {
  CREATE_TASK: ["MENTOR"],
  EVALUATE_SUBMISSION: ["MENTOR"],
  RECORD_ATTENDANCE: ["MENTOR"],
  VIEW_ALL_STUDENTS: ["MENTOR"],
  SUBMIT_TASK: ["STUDENT"],
  VIEW_LEADERBOARD: ["MENTOR", "STUDENT"],
} as const;

export function can(role: Role, permission: keyof typeof PERMISSIONS): boolean {
  return (PERMISSIONS[permission] as readonly string[]).includes(role);
}

export function getRoleHome(role: Role): string {
  return role === "MENTOR" ? "/dashboard/mentor" : "/dashboard/student";
}
