import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { CreateAttendanceSessionSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId");
    const subjectId = searchParams.get("subjectId");

    const where: any = {};
    if (classId) where.classId = classId;
    if (subjectId) where.subjectId = subjectId;

    if (user.role === "FACULTY" && user.facultyProfileId) {
      where.facultyId = user.facultyProfileId;
    }

    const sessions = await prisma.attendanceSession.findMany({
      where,
      include: {
        class: true,
        subject: true,
        faculty: { include: { user: { select: { name: true } } } },
        _count: { select: { attendanceRecords: true } },
      },
      orderBy: { sessionDate: "desc" },
    });

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("List attendance sessions error:", error);
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
    const result = CreateAttendanceSessionSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "Validation failed", details: result.error.errors }, { status: 400 });
    }

    const data = result.data;
    const facultyProfileId = user.facultyProfileId;

    if (!facultyProfileId && user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "No faculty profile associated with user" }, { status: 400 });
    }

    // Determine target faculty ID
    let targetFacultyId = facultyProfileId;
    if (!targetFacultyId) {
      const fac = await prisma.facultyProfile.findFirst();
      if (!fac) return NextResponse.json({ error: "No faculty found in system" }, { status: 400 });
      targetFacultyId = fac.id;
    }

    const sessionDate = new Date(data.sessionDate);

    // Create session and records in an atomic transaction
    const session = await prisma.$transaction(async (tx) => {
      const newSession = await tx.attendanceSession.create({
        data: {
          classId: data.classId,
          subjectId: data.subjectId,
          facultyId: targetFacultyId!,
          sessionDate,
          startTime: data.startTime,
          endTime: data.endTime,
          notes: data.notes,
          isFinalized: true,
        },
      });

      // Insert attendance records for all enrolled students
      const recordData = data.records.map((r) => ({
        sessionId: newSession.id,
        studentId: r.studentId,
        status: r.status as any,
        remarks: r.remarks,
        markedById: user.id,
      }));

      await tx.attendanceRecord.createMany({
        data: recordData,
      });

      // Audit log entry
      await tx.auditLog.create({
        data: {
          userId: user.id,
          performedById: user.id,
          action: "CREATE",
          entity: "AttendanceSession",
          entityId: newSession.id,
          notes: `Recorded attendance for class ${data.classId}, ${data.records.length} students marked`,
        },
      });

      return newSession;
    });

    return NextResponse.json({ message: "Attendance recorded successfully", session }, { status: 201 });
  } catch (error: any) {
    console.error("Record attendance error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
