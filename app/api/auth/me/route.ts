import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        avatarUrl: true,
        institutionId: true,
        studentProfile: {
          include: {
            department: true,
            program: true,
            enrollments: {
              include: { class: true },
            },
            mentorAllocations: {
              where: { isActive: true },
              include: { mentor: { include: { user: true } } },
            },
          },
        },
        facultyProfile: {
          include: {
            department: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Get current user error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
