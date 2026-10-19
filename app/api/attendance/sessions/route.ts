import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const sessions = await prisma.attendanceSession.findMany({
      include: {
        records: {
          include: { student: { select: { id: true, name: true, email: true } } },
        },
      },
      orderBy: { sessionDate: "desc" },
    });

    return NextResponse.json({ sessions });
  } catch (error) {
    return NextResponse.json({ error: "Failed to load sessions" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "MENTOR") {
      return NextResponse.json({ error: "Forbidden: Mentors only" }, { status: 403 });
    }

    const { title, records } = await req.json();

    if (!title || !records || !Array.isArray(records)) {
      return NextResponse.json({ error: "Title and records array required" }, { status: 400 });
    }

    const session = await prisma.$transaction(async (tx) => {
      const s = await tx.attendanceSession.create({
        data: {
          title,
          createdById: user.id,
          sessionDate: new Date(),
        },
      });

      await tx.attendanceRecord.createMany({
        data: records.map((r: any) => ({
          sessionId: s.id,
          studentId: r.studentId,
          status: r.status,
          remarks: r.remarks,
        })),
      });

      return s;
    });

    return NextResponse.json({ message: "Attendance saved", session }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to record attendance" }, { status: 500 });
  }
}
