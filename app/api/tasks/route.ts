import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const tasks = await prisma.task.findMany({
      include: {
        createdBy: { select: { name: true } },
        submissions: user.role === "STUDENT"
          ? {
              where: { studentId: user.id },
              select: { id: true, status: true, score: true, feedback: true, content: true },
            }
          : {
              include: { student: { select: { id: true, name: true, email: true } } },
            },
      },
      orderBy: { dueDate: "asc" },
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    return NextResponse.json({ error: "Failed to load tasks" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "MENTOR") {
      return NextResponse.json({ error: "Forbidden: Mentors only" }, { status: 403 });
    }

    const { title, description, maxScore, dueDate } = await req.json();

    if (!title || !description || !dueDate) {
      return NextResponse.json({ error: "Title, description, and dueDate are required" }, { status: 400 });
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        maxScore: Number(maxScore) || 100,
        dueDate: new Date(dueDate),
        createdById: user.id,
      },
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create task" }, { status: 500 });
  }
}
