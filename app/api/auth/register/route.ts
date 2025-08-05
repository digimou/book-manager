import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { hashPassword } from "@/lib/utils/server";
import { USER_ROLES, ERROR_MESSAGES, VALIDATION } from "@/lib/constants";

const registerSchema = z.object({
  name: z.string().min(VALIDATION.MIN_NAME_LENGTH, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(
      VALIDATION.MIN_PASSWORD_LENGTH,
      "Password must be at least 6 characters"
    ),
  role: z
    .enum([USER_ROLES.USER, USER_ROLES.LIBRARIAN, USER_ROLES.ADMIN])
    .default(USER_ROLES.USER),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = registerSchema.parse(body);

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.USER_ALREADY_EXISTS },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(validatedData.password);

    // Create user
    const user = await db.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        password: hashedPassword,
        role: validatedData.role,
      },
    });

    // Remove password from response
    const { password: _password, ...userWithoutPassword } = user;

    return NextResponse.json({ user: userWithoutPassword }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.VALIDATION_ERROR, details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error registering user:", error);
    return NextResponse.json(
      { error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR },
      { status: 500 }
    );
  }
}
