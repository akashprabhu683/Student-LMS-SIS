import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Fetch all 10 students with their graded submissions and attendance
    const students = await prisma.user.findMany({
      where: { role: "STUDENT" },
      select: {
        id: true,
        name: true,
        email: true,
        mentor: { select: { name: true } },
        submissions: {
          where: { status: "GRADED" },
          select: { score: true, task: { select: { maxScore: true } } },
        },
        attendanceRecords: {
          select: { status: true },
        },
      },
    });

    const leaderboard = students.map((s) => {
      // Calculate total earned score
      const totalScore = s.submissions.reduce((acc, sub) => acc + (sub.score || 0), 0);
      const totalPossible = s.submissions.reduce((acc, sub) => acc + sub.task.maxScore, 0);
      const scorePct = totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0;

      // Calculate attendance rate
      const totalSessions = s.attendanceRecords.length;
      const present = s.attendanceRecords.filter((r) => r.status === "PRESENT" || r.status === "ON_DUTY").length;
      const late = s.attendanceRecords.filter((r) => r.status === "LATE").length;
      const attendancePct = totalSessions > 0 ? Math.round(((present + late * 0.5) / totalSessions) * 100) : 0;

      return {
        id: s.id,
        name: s.name,
        email: s.email,
        mentorName: s.mentor?.name || "Unassigned",
        totalScore,
        scorePct,
        tasksCompleted: s.submissions.length,
        attendancePct,
        // Combined metric score for leaderboard ranking
        overallScore: Math.round(totalScore * 0.7 + attendancePct * 0.3),
      };
    });

    // Sort descending by overallScore
    leaderboard.sort((a, b) => b.overallScore - a.overallScore);

    return NextResponse.json({ leaderboard });
  } catch (error) {
    console.error("Leaderboard error:", error);
    return NextResponse.json({ error: "Failed to load leaderboard" }, { status: 500 });
  }
}
