import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { USER_ROLES, ERROR_MESSAGES, VALIDATION } from "@/lib/constants";
import { z } from "zod";

const updateUserSchema = z.object({
  name: z
    .string()
    .min(VALIDATION.MIN_NAME_LENGTH, { message: "Name is required" }),
  email: z.string().email({ message: "Invalid email address" }),
  role: z.enum([USER_ROLES.USER, USER_ROLES.BOOKKEEPER, USER_ROLES.ADMIN]),
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
        { error: "Only administrators can update users" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateUserSchema.parse(body);

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if email is already taken by another user
    const emailExists = await db.user.findFirst({
      where: {
        email: validatedData.email,
        id: { not: id },
      },
    });

    if (emailExists) {
      return NextResponse.json(
        { error: "Email is already taken by another user" },
        { status: 400 }
      );
    }

    // Update user
    const updatedUser = await db.user.update({
      where: { id },
      data: {
        name: validatedData.name,
        email: validatedData.email,
        role: validatedData.role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.VALIDATION_ERROR, details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR },
      { status: 500 }
    );
  }
}
