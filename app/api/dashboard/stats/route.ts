import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (user.role === "MENTOR") {
      const [totalStudents, totalTasks, pendingSubmissions, totalSessions] = await Promise.all([
        prisma.user.count({ where: { role: "STUDENT" } }),
        prisma.task.count(),
        prisma.submission.count({ where: { status: "SUBMITTED" } }),
        prisma.attendanceSession.count(),
      ]);
      return NextResponse.json({ totalStudents, totalTasks, pendingSubmissions, totalSessions });
    }

    // Student
    const [mySubmissions, totalTasks, attendanceRecords, totalSessions] = await Promise.all([
      prisma.submission.findMany({
        where: { studentId: user.id },
        include: { task: true },
      }),
      prisma.task.count(),
      prisma.attendanceRecord.findMany({ where: { studentId: user.id } }),
      prisma.attendanceSession.count(),
    ]);

    const attended = attendanceRecords.filter(r => r.status === "PRESENT" || r.status === "LATE").length;
    const attendanceRate = totalSessions > 0 ? Math.round((attended / totalSessions) * 100) : 0;
    const gradedSubmissions = mySubmissions.filter(s => s.score !== null);
    const avgScore =
      gradedSubmissions.length > 0
        ? Math.round(
            gradedSubmissions.reduce(
              (acc, s) => acc + (s.score! / s.task.maxScore) * 100,
              0
            ) / gradedSubmissions.length
          )
        : 0;

    return NextResponse.json({
      submissionsCount: mySubmissions.length,
      totalTasks,
      attendanceRate,
      avgScore,
    });
  } catch (error) {
    console.error("[dashboard/stats]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
