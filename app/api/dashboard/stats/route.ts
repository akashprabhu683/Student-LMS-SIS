import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (user.role === "SUPER_ADMIN") {
      const [
        totalStudents,
        totalFaculty,
        totalDepartments,
        totalClasses,
        totalAssignments,
        totalSubmissions,
        attendanceCount,
        recentAudits,
      ] = await Promise.all([
        prisma.studentProfile.count(),
        prisma.facultyProfile.count(),
        prisma.department.count(),
        prisma.class.count(),
        prisma.assignment.count(),
        prisma.submission.count(),
        prisma.attendanceRecord.count(),
        prisma.auditLog.findMany({
          take: 8,
          orderBy: { createdAt: "desc" },
          include: { performedBy: { select: { name: true, email: true } } },
        }),
      ]);

      return NextResponse.json({
        stats: {
          totalStudents,
          totalFaculty,
          totalDepartments,
          totalClasses,
          totalAssignments,
          totalSubmissions,
          attendanceCount,
        },
        recentAudits,
      });
    }

    if (user.role === "DEPARTMENT_ADMIN") {
      const deptId = user.departmentId;
      const [
        deptStudents,
        deptFaculty,
        deptClasses,
        deptSubjects,
        deptAssignments,
      ] = await Promise.all([
        prisma.studentProfile.count({ where: { departmentId: deptId || undefined } }),
        prisma.facultyProfile.count({ where: { departmentId: deptId || undefined } }),
        prisma.class.count({ where: { departmentId: deptId || undefined } }),
        prisma.subject.count({ where: { departmentId: deptId || undefined } }),
        prisma.assignment.count({
          where: { subject: { departmentId: deptId || undefined } },
        }),
      ]);

      return NextResponse.json({
        stats: {
          deptStudents,
          deptFaculty,
          deptClasses,
          deptSubjects,
          deptAssignments,
        },
      });
    }

    if (user.role === "FACULTY" || user.role === "MENTOR") {
      const facId = user.facultyProfileId;
      const [
        assignedAssignments,
        pendingSubmissions,
        menteesCount,
        recentSessions,
      ] = await Promise.all([
        prisma.assignment.count({ where: { facultyId: facId || undefined } }),
        prisma.submission.count({
          where: {
            assignment: { facultyId: facId || undefined },
            status: "SUBMITTED",
          },
        }),
        prisma.mentorAllocation.count({
          where: { mentorId: facId || undefined, isActive: true },
        }),
        prisma.attendanceSession.findMany({
          where: { facultyId: facId || undefined },
          take: 5,
          orderBy: { sessionDate: "desc" },
          include: { class: true, subject: true },
        }),
      ]);

      return NextResponse.json({
        stats: {
          assignedAssignments,
          pendingSubmissions,
          menteesCount,
        },
        recentSessions,
      });
    }

    if (user.role === "STUDENT") {
      const studentId = user.studentProfileId;
      const [
        attendanceRecords,
        submissions,
        mentorAllocation,
      ] = await Promise.all([
        prisma.attendanceRecord.findMany({
          where: { studentId: studentId || undefined },
        }),
        prisma.submission.findMany({
          where: { studentId: studentId || undefined },
          include: { grade: true, assignment: true },
        }),
        prisma.mentorAllocation.findFirst({
          where: { studentId: studentId || undefined, isActive: true },
          include: {
            mentor: {
              include: { user: { select: { name: true, email: true } }, department: true },
            },
          },
        }),
      ]);

      const totalAtt = attendanceRecords.length;
      const presentAtt = attendanceRecords.filter((r) => r.status === "PRESENT" || r.status === "ON_DUTY").length;
      const lateAtt = attendanceRecords.filter((r) => r.status === "LATE").length;
      const attendancePercentage = totalAtt > 0 ? Math.round(((presentAtt + lateAtt * 0.5) / totalAtt) * 100) : 0;

      return NextResponse.json({
        stats: {
          attendancePercentage,
          totalSessions: totalAtt,
          totalSubmissions: submissions.length,
          gradedSubmissions: submissions.filter((s) => s.status === "GRADED").length,
        },
        mentor: mentorAllocation?.mentor || null,
        recentSubmissions: submissions.slice(0, 5),
      });
    }

    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
