import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/utils/server";
import { ERROR_MESSAGES } from "@/lib/constants";
import {
  requireAdmin,
  validateRequest,
  createSuccessResponse,
  createErrorResponse,
} from "@/lib/utils/api";
import { createUserSchema } from "@/lib/schemas";

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const authResult = await requireAdmin();
    if (authResult.error) {
      return authResult.error;
    }

    // Validate request data
    const validationResult = await validateRequest(request, createUserSchema);
    if (validationResult.error) {
      return validationResult.error;
    }

    const validatedData = validationResult.data!;

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return createErrorResponse(ERROR_MESSAGES.USER_ALREADY_EXISTS, 400);
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

    // Create response without password
    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };

    return createSuccessResponse({ user: userResponse }, 201);
  } catch (error) {
    console.error("Error registering user:", error);
    return createErrorResponse(ERROR_MESSAGES.INTERNAL_SERVER_ERROR, 500);
  }
}
