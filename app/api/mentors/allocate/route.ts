import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { AllocateMentorSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const mentorId = searchParams.get("mentorId");

    const where: any = { isActive: true };

    if (user.role === "MENTOR" && user.facultyProfileId) {
      where.mentorId = user.facultyProfileId;
    } else if (mentorId) {
      where.mentorId = mentorId;
    }

    const allocations = await prisma.mentorAllocation.findMany({
      where,
      include: {
        student: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            department: true,
            program: true,
            enrollments: { include: { class: true } },
          },
        },
        mentor: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            department: true,
          },
        },
        group: true,
      },
      orderBy: { allocatedAt: "desc" },
    });

    return NextResponse.json({ allocations });
  } catch (error) {
    console.error("List allocations error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user.role, ["SUPER_ADMIN", "DEPARTMENT_ADMIN"])) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const result = AllocateMentorSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "Validation failed", details: result.error.errors }, { status: 400 });
    }

    const { studentId, mentorId, groupId, notes } = result.data;

    // Verify mentor exists and has mentor flag
    const mentor = await prisma.facultyProfile.findUnique({
      where: { id: mentorId },
      include: { user: true },
    });

    if (!mentor) {
      return NextResponse.json({ error: "Mentor faculty record not found" }, { status: 404 });
    }

    // Verify student exists
    const student = await prisma.studentProfile.findUnique({
      where: { id: studentId },
      include: { user: true },
    });

    if (!student) {
      return NextResponse.json({ error: "Student record not found" }, { status: 404 });
    }

    // Deactivate prior active allocations for this student
    const allocation = await prisma.$transaction(async (tx) => {
      await tx.mentorAllocation.updateMany({
        where: { studentId, isActive: true },
        data: { isActive: false, deallocatedAt: new Date() },
      });

      const newAlloc = await tx.mentorAllocation.create({
        data: {
          studentId,
          mentorId,
          groupId,
          notes,
          allocatedById: user.id,
          isActive: true,
        },
      });

      // Send notification to student
      await tx.notification.create({
        data: {
          userId: student.userId,
          studentId: student.id,
          type: "MENTOR_ALLOCATED",
          title: "Mentor Assigned",
          message: `Prof. ${mentor.user.name} has been assigned as your mentor.`,
        },
      });

      return newAlloc;
    });

    return NextResponse.json({ message: "Mentor allocated successfully", allocation }, { status: 201 });
  } catch (error: any) {
    console.error("Mentor allocation error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
