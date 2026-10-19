import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const targetStudentId = user.role === "STUDENT" ? user.id : req.nextUrl.searchParams.get("studentId") || undefined;

    const records = await prisma.attendanceRecord.findMany({
      where: targetStudentId ? { studentId: targetStudentId } : {},
      include: {
        session: true,
        student: { select: { id: true, name: true, email: true } },
      },
      orderBy: { markedAt: "desc" },
    });

    const total = records.length;
    const present = records.filter((r) => r.status === "PRESENT" || r.status === "ON_DUTY").length;
    const late = records.filter((r) => r.status === "LATE").length;
    const absent = records.filter((r) => r.status === "ABSENT").length;
    const percentage = total > 0 ? Math.round(((present + late * 0.5) / total) * 100) : 0;

    return NextResponse.json({
      records,
      stats: { total, present, late, absent, percentage },
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to load attendance records" }, { status: 500 });
  }
}
