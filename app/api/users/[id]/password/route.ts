import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { USER_ROLES, ERROR_MESSAGES, VALIDATION } from "@/lib/constants";
import { z } from "zod";
import { hashPassword } from "@/lib/utils/server";

const changePasswordSchema = z.object({
  password: z.string().min(VALIDATION.MIN_PASSWORD_LENGTH, {
    message: "Password must be at least 6 characters",
  }),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check if user is admin
    const userRole = (session.user as unknown as { role: string }).role;
    if (userRole !== USER_ROLES.ADMIN) {
      return NextResponse.json(
        { error: "Only administrators can change user passwords" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = changePasswordSchema.parse(body);

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Hash the new password
    const hashedPassword = await hashPassword(validatedData.password);

    // Update user password
    await db.user.update({
      where: { id },
      data: {
        password: hashedPassword,
      },
    });

    return NextResponse.json({ message: "Password updated successfully" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.VALIDATION_ERROR, details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error changing password:", error);
    return NextResponse.json(
      { error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR },
      { status: 500 }
    );
  }
}
