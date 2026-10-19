import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { CreateDepartmentSchema } from "@/lib/validations";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const departments = await prisma.department.findMany({
      include: {
        programs: true,
        classes: true,
        subjects: true,
        _count: {
          select: {
            facultyProfiles: true,
            studentProfiles: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ departments });
  } catch (error) {
    console.error("List departments error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user.role, ["SUPER_ADMIN"])) {
      return NextResponse.json({ error: "Forbidden: Super Admin only" }, { status: 403 });
    }

    const body = await req.json();
    const result = CreateDepartmentSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "Validation failed", details: result.error.errors }, { status: 400 });
    }

    const institution = await prisma.institution.findFirst();
    if (!institution) {
      return NextResponse.json({ error: "No institution configured" }, { status: 400 });
    }

    const department = await prisma.department.create({
      data: {
        institutionId: institution.id,
        name: result.data.name,
        code: result.data.code.toUpperCase(),
        hodId: result.data.hodId,
      },
    });

    return NextResponse.json({ department }, { status: 201 });
  } catch (error: any) {
    console.error("Create department error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
