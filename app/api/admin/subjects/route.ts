import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { CreateSubjectSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const departmentId = searchParams.get("departmentId");

    const where: any = {};
    if (user.role === "DEPARTMENT_ADMIN" && user.departmentId) {
      where.departmentId = user.departmentId;
    } else if (departmentId) {
      where.departmentId = departmentId;
    }

    const subjects = await prisma.subject.findMany({
      where,
      include: {
        department: true,
        subjectAssignments: {
          include: {
            faculty: { include: { user: true } },
            class: true,
          },
        },
      },
      orderBy: { code: "asc" },
    });

    return NextResponse.json({ subjects });
  } catch (error) {
    console.error("List subjects error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user.role, ["SUPER_ADMIN", "DEPARTMENT_ADMIN"])) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const result = CreateSubjectSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "Validation failed", details: result.error.errors }, { status: 400 });
    }

    const data = result.data;
    if (user.role === "DEPARTMENT_ADMIN" && data.departmentId !== user.departmentId) {
      return NextResponse.json({ error: "Forbidden: Cannot create subject outside your department" }, { status: 403 });
    }

    const subject = await prisma.subject.create({
      data: {
        name: data.name,
        code: data.code.toUpperCase(),
        credits: data.credits,
        departmentId: data.departmentId,
        description: data.description,
      },
    });

    return NextResponse.json({ subject }, { status: 201 });
  } catch (error: any) {
    console.error("Create subject error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
