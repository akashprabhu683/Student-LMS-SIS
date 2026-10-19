import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { CreateAssignmentSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const subjectId = searchParams.get("subjectId");
    const classId = searchParams.get("classId");

    const where: any = {};

    if (user.role === "STUDENT") {
      // Find classes student is enrolled in
      const enrollments = await prisma.enrollment.findMany({
        where: { studentId: user.studentProfileId!, isActive: true },
        select: { classId: true },
      });
      const classIds = enrollments.map((e) => e.classId);

      where.status = "PUBLISHED";
      where.targets = { some: { classId: { in: classIds } } };
    } else if (user.role === "FACULTY" && user.facultyProfileId) {
      where.facultyId = user.facultyProfileId;
    }

    if (subjectId) where.subjectId = subjectId;
    if (classId) where.targets = { some: { classId } };

    const assignments = await prisma.assignment.findMany({
      where,
      include: {
        subject: true,
        targets: { include: { class: true } },
        faculty: { include: { user: { select: { name: true } } } },
        submissions: user.role === "STUDENT"
          ? {
              where: { studentId: user.studentProfileId! },
              include: { files: true, grade: true },
            }
          : {
              select: { id: true, status: true, isLate: true },
            },
      },
      orderBy: { dueDate: "asc" },
    });

    return NextResponse.json({ assignments });
  } catch (error) {
    console.error("List assignments error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user.role, ["FACULTY", "MENTOR", "DEPARTMENT_ADMIN", "SUPER_ADMIN"])) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const result = CreateAssignmentSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "Validation failed", details: result.error.errors }, { status: 400 });
    }

    const data = result.data;
    let facultyId = user.facultyProfileId;

    if (!facultyId) {
      const fac = await prisma.facultyProfile.findFirst();
      if (!fac) return NextResponse.json({ error: "No faculty found in system" }, { status: 400 });
      facultyId = fac.id;
    }

    const assignment = await prisma.$transaction(async (tx) => {
      const created = await tx.assignment.create({
        data: {
          title: data.title,
          description: data.description,
          instructions: data.instructions,
          subjectId: data.subjectId,
          facultyId: facultyId!,
          maxMarks: data.maxMarks,
          dueDate: new Date(data.dueDate),
          issueDate: new Date(),
          type: data.type as any,
          status: "PUBLISHED",
          allowLateSubmit: data.allowLateSubmit,
          allowResubmit: data.allowResubmit,
          permittedFileTypes: data.permittedFileTypes,
          targets: {
            create: data.classIds.map((cid) => ({ classId: cid })),
          },
        },
        include: { targets: true },
      });

      // Find all students in target classes and notify them
      const targetEnrollments = await tx.enrollment.findMany({
        where: { classId: { in: data.classIds }, isActive: true },
        include: { student: true },
      });

      for (const enr of targetEnrollments) {
        await tx.notification.create({
          data: {
            userId: enr.student.userId,
            studentId: enr.student.id,
            type: "ASSIGNMENT_CREATED",
            title: "New Assignment Published",
            message: `New assignment: "${data.title}" due on ${new Date(data.dueDate).toLocaleDateString()}`,
            assignmentId: created.id,
          },
        });
      }

      return created;
    });

    return NextResponse.json({ message: "Assignment created successfully", assignment }, { status: 201 });
  } catch (error: any) {
    console.error("Create assignment error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
