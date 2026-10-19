import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { FirstAdminSetupSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = FirstAdminSetupSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.errors },
        { status: 400 }
      );
    }

    const { token, name, email, password, institutionName, institutionCode } = result.data;

    // Verify setup token from environment
    const expectedToken = process.env.ADMIN_REGISTRATION_TOKEN;
    if (!expectedToken || token !== expectedToken) {
      return NextResponse.json({ error: "Invalid setup token" }, { status: 403 });
    }

    // Check if a Super Admin already exists
    const existingSuperAdmin = await prisma.user.findFirst({
      where: { role: "SUPER_ADMIN" },
    });

    if (existingSuperAdmin) {
      return NextResponse.json(
        { error: "Super Administrator already initialized. Use regular login." },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create Institution and Super Admin in transaction
    const [institution, superAdmin] = await prisma.$transaction(async (tx) => {
      let inst = await tx.institution.findUnique({
        where: { code: institutionCode },
      });

      if (!inst) {
        inst = await tx.institution.create({
          data: {
            name: institutionName,
            code: institutionCode,
            timezone: process.env.TIMEZONE || "Asia/Kolkata",
          },
        });
      }

      const user = await tx.user.create({
        data: {
          name,
          email: email.toLowerCase(),
          passwordHash,
          role: "SUPER_ADMIN",
          status: "ACTIVE",
          institutionId: inst.id,
        },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          userId: user.id,
          performedById: user.id,
          action: "CREATE",
          entity: "InitialSuperAdmin",
          entityId: user.id,
          notes: "Initial Super Administrator registered via setup token",
        },
      });

      return [inst, user];
    });

    return NextResponse.json({
      message: "Initial Super Administrator created successfully",
      institution: { id: institution.id, name: institution.name, code: institution.code },
      admin: { id: superAdmin.id, email: superAdmin.email, name: superAdmin.name },
    });
  } catch (error: any) {
    console.error("Super Admin setup error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
