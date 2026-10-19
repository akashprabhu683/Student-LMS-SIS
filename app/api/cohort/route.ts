import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const students = await prisma.user.findMany({
      where: { role: "STUDENT" },
      select: {
        id: true,
        name: true,
        email: true,
        mentor: { select: { id: true, name: true } },
      },
      orderBy: { name: "asc" },
    });

    const mentors = await prisma.user.findMany({
      where: { role: "MENTOR" },
      select: { id: true, name: true, email: true },
    });

    return NextResponse.json({ students, mentors });
  } catch (error) {
    return NextResponse.json({ error: "Failed to load cohort" }, { status: 500 });
  }
}
