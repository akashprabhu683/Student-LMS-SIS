import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");
    const subjectId = searchParams.get("subjectId");

    // Student role can ONLY view their own records
    let targetStudentId = studentId;
    if (user.role === "STUDENT") {
      if (!user.studentProfileId) {
        return NextResponse.json({ error: "No student profile found" }, { status: 400 });
      }
      targetStudentId = user.studentProfileId;
    }

    const where: any = {};
    if (targetStudentId) where.studentId = targetStudentId;
    if (subjectId) {
      where.session = { subjectId };
    }

    const records = await prisma.attendanceRecord.findMany({
      where,
      include: {
        session: {
          include: {
            subject: true,
            class: true,
            faculty: { include: { user: { select: { name: true } } } },
          },
        },
        student: {
          include: { user: { select: { name: true, email: true } } },
        },
      },
      orderBy: { session: { sessionDate: "desc" } },
      take: 200,
    });

    // Compute attendance statistics
    const total = records.length;
    const present = records.filter((r) => r.status === "PRESENT" || r.status === "ON_DUTY").length;
    const late = records.filter((r) => r.status === "LATE").length;
    const absent = records.filter((r) => r.status === "ABSENT").length;
    const percentage = total > 0 ? Math.round(((present + late * 0.5) / total) * 100) : 0;

    return NextResponse.json({
      records,
      stats: {
        total,
        present,
        late,
        absent,
        percentage,
      },
    });
  } catch (error) {
    console.error("Attendance records error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
