import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "MENTOR") {
      return NextResponse.json({ error: "Forbidden: Mentors only" }, { status: 403 });
    }

    const { submissionId, score, feedback } = await req.json();

    if (!submissionId || score === undefined) {
      return NextResponse.json({ error: "Submission ID and score required" }, { status: 400 });
    }

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: { task: true },
    });

    if (!submission) return NextResponse.json({ error: "Submission not found" }, { status: 404 });

    if (Number(score) > submission.task.maxScore) {
      return NextResponse.json({ error: `Score cannot exceed maximum ${submission.task.maxScore}` }, { status: 400 });
    }

    const updated = await prisma.submission.update({
      where: { id: submissionId },
      data: {
        score: Number(score),
        feedback,
        status: "GRADED",
        evaluatedAt: new Date(),
      },
    });

    return NextResponse.json({ message: "Graded successfully", submission: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Grading failed" }, { status: 500 });
  }
}
