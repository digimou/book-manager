import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { USER_ROLES, ERROR_MESSAGES } from "@/lib/constants";

// Reusable authentication check
export async function requireAuth() {
  const session = await auth();

  if (!session?.user) {
    return {
      error: NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      ),
      session: null,
    };
  }

  return { session, error: null };
}

// Reusable admin check
export async function requireAdmin() {
  const authResult = await requireAuth();

  if (authResult.error) {
    return authResult;
  }

  const userRole = (authResult.session!.user as { role: string }).role;
  if (userRole !== USER_ROLES.ADMIN) {
    return {
      error: NextResponse.json(
        { error: "Only administrators can perform this action" },
        { status: 403 }
      ),
      session: null,
    };
  }

  return authResult;
}

// Reusable validation with error handling
export async function validateRequest<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): Promise<{ data: T | null; error: NextResponse | null }> {
  try {
    const body = await request.json();
    const data = schema.parse(body);
    return { data, error: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        data: null,
        error: NextResponse.json(
          { error: ERROR_MESSAGES.VALIDATION_ERROR, details: error.issues },
          { status: 400 }
        ),
      };
    }
    return {
      data: null,
      error: NextResponse.json(
        { error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR },
        { status: 500 }
      ),
    };
  }
}

// Reusable error response
export function createErrorResponse(
  message: string,
  status: number = 500
): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

// Reusable success response
export function createSuccessResponse<T>(
  data: T,
  status: number = 200
): NextResponse {
  return NextResponse.json(data, { status });
}

// Reusable pagination helper
export function getPaginationParams(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

// Reusable search params helper
export function getSearchParams(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search");
  const genre = searchParams.get("genre");
  const status = searchParams.get("status");
  const userId = searchParams.get("userId");
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const sortOrder = searchParams.get("sortOrder") || "desc";

  return { search, genre, status, userId, sortBy, sortOrder };
}
