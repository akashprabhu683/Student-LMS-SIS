import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { CreateUserSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !hasPermission(user.role, ["SUPER_ADMIN", "DEPARTMENT_ADMIN"])) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");
    const departmentId = searchParams.get("departmentId");
    const search = searchParams.get("search");

    const where: any = {};
    if (role) where.role = role;
    if (user.role === "DEPARTMENT_ADMIN" && user.departmentId) {
      where.OR = [
        { studentProfile: { departmentId: user.departmentId } },
        { facultyProfile: { departmentId: user.departmentId } },
      ];
    } else if (departmentId) {
      where.OR = [
        { studentProfile: { departmentId } },
        { facultyProfile: { departmentId } },
      ];
    }

    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        studentProfile: {
          include: {
            department: true,
            program: true,
            enrollments: { include: { class: true } },
            mentorAllocations: {
              where: { isActive: true },
              include: { mentor: { include: { user: true } } },
            },
          },
        },
        facultyProfile: {
          include: { department: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ users });
  } catch (error: any) {
    console.error("List users error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || !hasPermission(currentUser.role, ["SUPER_ADMIN", "DEPARTMENT_ADMIN"])) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const result = CreateUserSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.errors },
        { status: 400 }
      );
    }

    const data = result.data;

    // Prevent department admin from creating Super Admin
    if (currentUser.role === "DEPARTMENT_ADMIN" && data.role === "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden: Cannot provision Super Admin" }, { status: 403 });
    }

    // Check duplicate email
    const existing = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (existing) {
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const departmentId = currentUser.role === "DEPARTMENT_ADMIN" ? currentUser.departmentId! : data.departmentId;

    const newUser = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          name: data.name,
          email: data.email.toLowerCase(),
          passwordHash,
          role: data.role as any,
          status: "ACTIVE",
          institutionId: currentUser.institutionId,
        },
      });

      if (data.role === "STUDENT") {
        if (!data.registrationNumber) {
          throw new Error("Registration number is required for students");
        }

        // Check duplicate reg number
        const existingStudent = await tx.studentProfile.findUnique({
          where: { registrationNumber: data.registrationNumber },
        });
        if (existingStudent) {
          throw new Error("Student registration number already in use");
        }

        const studentProfile = await tx.studentProfile.create({
          data: {
            userId: createdUser.id,
            departmentId: departmentId!,
            programId: data.programId!,
            registrationNumber: data.registrationNumber,
            batch: data.batch || "2024-2028",
            currentSemester: 1,
            status: "ACTIVE",
          },
        });

        if (data.classId) {
          await tx.enrollment.create({
            data: {
              studentId: studentProfile.id,
              classId: data.classId,
              isActive: true,
            },
          });
        }
      } else if (data.role === "FACULTY" || data.role === "MENTOR") {
        const employeeId = data.employeeId || `FAC-${Date.now().toString().slice(-6)}`;
        await tx.facultyProfile.create({
          data: {
            userId: createdUser.id,
            departmentId: departmentId!,
            employeeId,
            designation: data.designation || "Assistant Professor",
            isMentor: data.role === "MENTOR" || !!data.isMentor,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          userId: createdUser.id,
          performedById: currentUser.id,
          action: "CREATE",
          entity: "User",
          entityId: createdUser.id,
          notes: `Created user ${createdUser.email} with role ${createdUser.role}`,
        },
      });

      return createdUser;
    });

    return NextResponse.json({ message: "User created successfully", user: newUser }, { status: 201 });
  } catch (error: any) {
    console.error("Create user error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
