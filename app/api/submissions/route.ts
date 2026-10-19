import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get("taskId");

    const where: any = {};
    if (taskId) where.taskId = taskId;
    if (user.role === "STUDENT") where.studentId = user.id;

    const submissions = await prisma.submission.findMany({
      where,
      include: {
        task: { select: { id: true, title: true, maxScore: true, dueDate: true } },
        student: { select: { id: true, name: true, email: true } },
      },
      orderBy: { submittedAt: "desc" },
    });

    return NextResponse.json({ submissions });
  } catch (error) {
    return NextResponse.json({ error: "Failed to load submissions" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "STUDENT") {
      return NextResponse.json({ error: "Forbidden: Students only" }, { status: 403 });
    }

    const { taskId, content } = await req.json();

    if (!taskId || !content) {
      return NextResponse.json({ error: "Task ID and submission content required" }, { status: 400 });
    }

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    const isLate = new Date() > task.dueDate;

    const submission = await prisma.submission.upsert({
      where: {
        taskId_studentId: { taskId, studentId: user.id },
      },
      update: {
        content,
        isLate,
        status: "SUBMITTED",
        submittedAt: new Date(),
      },
      create: {
        taskId,
        studentId: user.id,
        content,
        isLate,
        status: "SUBMITTED",
      },
    });

    return NextResponse.json({ message: "Submission received", submission });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Submission failed" }, { status: 500 });
  }
}
