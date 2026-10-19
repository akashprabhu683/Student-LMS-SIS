import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { CreateClassSchema } from "@/lib/validations";

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

    const classes = await prisma.class.findMany({
      where,
      include: {
        department: true,
        program: true,
        academicYear: true,
        _count: {
          select: { enrollments: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ classes });
  } catch (error) {
    console.error("List classes error:", error);
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
    const result = CreateClassSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "Validation failed", details: result.error.errors }, { status: 400 });
    }

    const data = result.data;
    if (user.role === "DEPARTMENT_ADMIN" && data.departmentId !== user.departmentId) {
      return NextResponse.json({ error: "Forbidden: Cannot create class outside your department" }, { status: 403 });
    }

    const newClass = await prisma.class.create({
      data: {
        name: data.name,
        departmentId: data.departmentId,
        programId: data.programId,
        academicYearId: data.academicYearId,
        semester: data.semester,
        batch: data.batch,
        section: data.section,
      },
    });

    return NextResponse.json({ class: newClass }, { status: 201 });
  } catch (error: any) {
    console.error("Create class error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
