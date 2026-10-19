import { z } from "zod";

export const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const FirstAdminSetupSchema = z.object({
  token: z.string().min(1, "Registration setup token is required"),
  name: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  institutionName: z.string().min(2, "Institution name is required"),
  institutionCode: z.string().min(2, "Institution code is required"),
});

export const CreateUserSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["SUPER_ADMIN", "DEPARTMENT_ADMIN", "FACULTY", "MENTOR", "STUDENT"]),
  departmentId: z.string().optional(),
  // For students
  registrationNumber: z.string().optional(),
  batch: z.string().optional(),
  programId: z.string().optional(),
  classId: z.string().optional(),
  // For faculty
  employeeId: z.string().optional(),
  designation: z.string().optional(),
  isMentor: z.boolean().optional(),
});

export const CreateDepartmentSchema = z.object({
  name: z.string().min(2, "Department name is required"),
  code: z.string().min(2, "Department code is required"),
  hodId: z.string().optional(),
});

export const CreateClassSchema = z.object({
  name: z.string().min(2, "Class name is required"),
  departmentId: z.string().min(1, "Department is required"),
  programId: z.string().min(1, "Program is required"),
  academicYearId: z.string().min(1, "Academic Year is required"),
  semester: z.number().int().min(1).max(12),
  batch: z.string().min(4, "Batch is required (e.g. 2022-2026)"),
  section: z.string().optional(),
});

export const CreateSubjectSchema = z.object({
  name: z.string().min(2, "Subject name is required"),
  code: z.string().min(2, "Subject code is required"),
  departmentId: z.string().min(1, "Department is required"),
  credits: z.number().int().min(1).max(10).default(3),
  description: z.string().optional(),
});

export const AllocateMentorSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  mentorId: z.string().min(1, "Mentor is required"),
  groupId: z.string().optional(),
  notes: z.string().optional(),
});

export const CreateAttendanceSessionSchema = z.object({
  classId: z.string().min(1, "Class is required"),
  subjectId: z.string().min(1, "Subject is required"),
  sessionDate: z.string().min(1, "Date is required"),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  notes: z.string().optional(),
  records: z.array(
    z.object({
      studentId: z.string().min(1),
      status: z.enum(["PRESENT", "ABSENT", "LATE", "ON_DUTY"]),
      remarks: z.string().optional(),
    })
  ).min(1, "At least one attendance record is required"),
});

export const CreateAssignmentSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(5, "Description is required"),
  instructions: z.string().optional(),
  subjectId: z.string().min(1, "Subject is required"),
  classIds: z.array(z.string()).min(1, "Target at least one class"),
  maxMarks: z.number().min(1, "Max marks must be greater than 0"),
  dueDate: z.string().min(1, "Due date is required"),
  type: z.enum(["ASSIGNMENT", "PROJECT", "QUIZ"]).default("ASSIGNMENT"),
  allowLateSubmit: z.boolean().default(false),
  allowResubmit: z.boolean().default(true),
  permittedFileTypes: z.array(z.string()).default([".pdf", ".doc", ".docx"]),
});

export const SubmitAssignmentSchema = z.object({
  assignmentId: z.string().min(1, "Assignment ID is required"),
  textResponse: z.string().optional(),
  fileData: z.object({
    fileName: z.string(),
    storageKey: z.string(),
    mimeType: z.string(),
    fileSize: z.number(),
  }).optional(),
});

export const GradeSubmissionSchema = z.object({
  submissionId: z.string().min(1, "Submission ID is required"),
  marksAwarded: z.number().min(0, "Marks must be non-negative"),
  feedback: z.string().optional(),
  status: z.enum(["DRAFT", "GRADED", "PUBLISHED"]).default("PUBLISHED"),
});

export const CreateAnnouncementSchema = z.object({
  title: z.string().min(3, "Title is required"),
  content: z.string().min(5, "Content is required"),
  departmentId: z.string().optional(),
  isPublished: z.boolean().default(true),
});
