import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { CreateAnnouncementSchema } from "@/lib/validations";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const announcements = await prisma.announcement.findMany({
      where: { isPublished: true },
      include: {
        faculty: { include: { user: { select: { name: true } } } },
        department: { select: { name: true, code: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({ announcements });
  } catch (error) {
    console.error("List announcements error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role === "STUDENT") {
      return NextResponse.json({ error: "Forbidden: Students cannot post announcements" }, { status: 403 });
    }

    const body = await req.json();
    const result = CreateAnnouncementSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "Validation failed", details: result.error.errors }, { status: 400 });
    }

    const { title, content, departmentId, isPublished } = result.data;

    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        departmentId: departmentId || user.departmentId,
        facultyId: user.facultyProfileId,
        institutionId: user.institutionId,
        isPublished,
        publishedAt: isPublished ? new Date() : null,
      },
    });

    return NextResponse.json({ message: "Announcement published", announcement }, { status: 201 });
  } catch (error: any) {
    console.error("Create announcement error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
