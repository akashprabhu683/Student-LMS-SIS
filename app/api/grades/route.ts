import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { GradeSubmissionSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user.role, ["FACULTY", "MENTOR", "DEPARTMENT_ADMIN", "SUPER_ADMIN"])) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const result = GradeSubmissionSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "Validation failed", details: result.error.errors }, { status: 400 });
    }

    const { submissionId, marksAwarded, feedback, status } = result.data;

    // Fetch submission with assignment to validate maximum marks
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: true,
        student: { include: { user: true } },
      },
    });

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    if (marksAwarded > submission.assignment.maxMarks) {
      return NextResponse.json(
        { error: `Marks awarded (${marksAwarded}) cannot exceed maximum score (${submission.assignment.maxMarks})` },
        { status: 400 }
      );
    }

    const now = new Date();
    const grade = await prisma.$transaction(async (tx) => {
      const g = await tx.grade.upsert({
        where: { submissionId },
        update: {
          marksAwarded,
          feedback,
          status: status as any,
          gradedAt: now,
          gradedById: user.facultyProfileId || user.id,
          publishedAt: status === "PUBLISHED" ? now : null,
        },
        create: {
          submissionId,
          studentId: submission.studentId,
          marksAwarded,
          feedback,
          status: status as any,
          gradedAt: now,
          gradedById: user.facultyProfileId || user.id,
          publishedAt: status === "PUBLISHED" ? now : null,
        },
      });

      // Update submission status
      await tx.submission.update({
        where: { id: submissionId },
        data: {
          status: status === "PUBLISHED" ? "GRADED" : "UNDER_REVIEW",
          reviewedAt: now,
          reviewedById: user.facultyProfileId || user.id,
        },
      });

      // Notify student if grade is published
      if (status === "PUBLISHED") {
        await tx.notification.create({
          data: {
            userId: submission.student.userId,
            studentId: submission.student.id,
            type: "SUBMISSION_GRADED",
            title: "Assignment Graded",
            message: `Your submission for "${submission.assignment.title}" received ${marksAwarded}/${submission.assignment.maxMarks} marks.`,
            assignmentId: submission.assignmentId,
          },
        });
      }

      // Audit log
      await tx.auditLog.create({
        data: {
          userId: submission.student.userId,
          performedById: user.id,
          action: "GRADE_CHANGE",
          entity: "Grade",
          entityId: g.id,
          notes: `Graded submission: ${marksAwarded}/${submission.assignment.maxMarks}`,
        },
      });

      return g;
    });

    return NextResponse.json({ message: "Grade recorded successfully", grade }, { status: 200 });
  } catch (error: any) {
    console.error("Grading error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
