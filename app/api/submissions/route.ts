import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { SubmitAssignmentSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const assignmentId = searchParams.get("assignmentId");

    const where: any = {};
    if (assignmentId) where.assignmentId = assignmentId;

    if (user.role === "STUDENT") {
      where.studentId = user.studentProfileId!;
    } else if (user.role === "FACULTY" && user.facultyProfileId) {
      where.assignment = { facultyId: user.facultyProfileId };
    }

    const submissions = await prisma.submission.findMany({
      where,
      include: {
        assignment: { select: { id: true, title: true, maxMarks: true, dueDate: true } },
        student: {
          include: {
            user: { select: { name: true, email: true } },
            enrollments: { include: { class: true } },
          },
        },
        files: true,
        grade: true,
      },
      orderBy: { submittedAt: "desc" },
    });

    return NextResponse.json({ submissions });
  } catch (error) {
    console.error("List submissions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "STUDENT" || !user.studentProfileId) {
      return NextResponse.json({ error: "Forbidden: Students only" }, { status: 403 });
    }

    const body = await req.json();
    const result = SubmitAssignmentSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "Validation failed", details: result.error.errors }, { status: 400 });
    }

    const { assignmentId, textResponse, fileData } = result.data;

    // Check assignment existence and deadlines
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
    });

    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    if (assignment.status !== "PUBLISHED") {
      return NextResponse.json({ error: "Assignment is not open for submission" }, { status: 400 });
    }

    const now = new Date();
    const isLate = now > assignment.dueDate;

    if (isLate && !assignment.allowLateSubmit) {
      return NextResponse.json(
        { error: "Submission deadline has passed and late submissions are not allowed" },
        { status: 400 }
      );
    }

    // Check existing submission
    const existing = await prisma.submission.findUnique({
      where: {
        assignmentId_studentId: {
          assignmentId,
          studentId: user.studentProfileId,
        },
      },
    });

    if (existing && !assignment.allowResubmit) {
      return NextResponse.json({ error: "Resubmissions are not permitted for this assignment" }, { status: 400 });
    }

    const submission = await prisma.$transaction(async (tx) => {
      let sub;
      if (existing) {
        sub = await tx.submission.update({
          where: { id: existing.id },
          data: {
            textResponse,
            isLate,
            status: "SUBMITTED",
            submittedAt: now,
            lastModifiedAt: now,
          },
        });
      } else {
        sub = await tx.submission.create({
          data: {
            assignmentId,
            studentId: user.studentProfileId!,
            textResponse,
            isLate,
            status: "SUBMITTED",
            submittedAt: now,
            lastModifiedAt: now,
          },
        });
      }

      // Add attached file metadata if provided
      if (fileData) {
        await tx.submissionFile.create({
          data: {
            submissionId: sub.id,
            storageKey: fileData.storageKey,
            fileName: fileData.fileName,
            mimeType: fileData.mimeType,
            fileSize: fileData.fileSize,
          },
        });
      }

      return sub;
    });

    return NextResponse.json({ message: "Submission completed successfully", submission }, { status: 200 });
  } catch (error: any) {
    console.error("Submission error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
