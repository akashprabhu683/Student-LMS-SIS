import { Role } from "./auth";

export const PERMISSIONS = {
  // Super Admin
  MANAGE_INSTITUTIONS: ["SUPER_ADMIN"],
  MANAGE_DEPARTMENTS: ["SUPER_ADMIN"],
  MANAGE_ACADEMIC_YEARS: ["SUPER_ADMIN"],
  MANAGE_ALL_USERS: ["SUPER_ADMIN"],
  VIEW_AUDIT_LOGS: ["SUPER_ADMIN"],

  // Department Admin / HOD
  MANAGE_DEPT_FACULTY: ["SUPER_ADMIN", "DEPARTMENT_ADMIN"],
  MANAGE_DEPT_STUDENTS: ["SUPER_ADMIN", "DEPARTMENT_ADMIN"],
  MANAGE_CLASSES: ["SUPER_ADMIN", "DEPARTMENT_ADMIN"],
  MANAGE_SUBJECTS: ["SUPER_ADMIN", "DEPARTMENT_ADMIN"],
  ASSIGN_FACULTY: ["SUPER_ADMIN", "DEPARTMENT_ADMIN"],
  ALLOCATE_MENTORS: ["SUPER_ADMIN", "DEPARTMENT_ADMIN"],
  IMPORT_STUDENTS_CSV: ["SUPER_ADMIN", "DEPARTMENT_ADMIN"],
  VIEW_DEPT_REPORTS: ["SUPER_ADMIN", "DEPARTMENT_ADMIN"],

  // Faculty / Mentor
  RECORD_ATTENDANCE: ["SUPER_ADMIN", "DEPARTMENT_ADMIN", "FACULTY", "MENTOR"],
  CREATE_ASSIGNMENT: ["SUPER_ADMIN", "DEPARTMENT_ADMIN", "FACULTY", "MENTOR"],
  GRADE_SUBMISSIONS: ["SUPER_ADMIN", "DEPARTMENT_ADMIN", "FACULTY", "MENTOR"],
  UPLOAD_LEARNING_MATERIAL: ["SUPER_ADMIN", "DEPARTMENT_ADMIN", "FACULTY", "MENTOR"],
  POST_ANNOUNCEMENT: ["SUPER_ADMIN", "DEPARTMENT_ADMIN", "FACULTY", "MENTOR"],
  VIEW_MENTEES: ["SUPER_ADMIN", "DEPARTMENT_ADMIN", "MENTOR"],

  // Student
  SUBMIT_ASSIGNMENT: ["STUDENT"],
  VIEW_OWN_ATTENDANCE: ["STUDENT", "FACULTY", "MENTOR", "DEPARTMENT_ADMIN", "SUPER_ADMIN"],
  VIEW_OWN_GRADES: ["STUDENT", "FACULTY", "MENTOR", "DEPARTMENT_ADMIN", "SUPER_ADMIN"],
  VIEW_LEARNING_MATERIALS: ["STUDENT", "FACULTY", "MENTOR", "DEPARTMENT_ADMIN", "SUPER_ADMIN"],
} as const;

export function hasPermission(userRole: Role, requiredRoles: readonly Role[]): boolean {
  return requiredRoles.includes(userRole);
}

export function getRoleDashboardPath(role: Role): string {
  switch (role) {
    case "SUPER_ADMIN":
      return "/dashboard/admin";
    case "DEPARTMENT_ADMIN":
      return "/dashboard/department";
    case "FACULTY":
      return "/dashboard/faculty";
    case "MENTOR":
      return "/dashboard/mentor";
    case "STUDENT":
      return "/dashboard/student";
    default:
      return "/login";
  }
}
