import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { USER_ROLES } from "@/lib/constants";

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
  if (authResult.error) return authResult;

  const userRole = (authResult.session!.user as unknown as { role: string })
    .role;
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

// Reusable role check
export async function requireRole(allowedRoles: string[]) {
  const authResult = await requireAuth();
  if (authResult.error) return authResult;

  const userRole = (authResult.session!.user as unknown as { role: string })
    .role;
  if (!allowedRoles.includes(userRole)) {
    return {
      error: NextResponse.json(
        { error: `Only ${allowedRoles.join(", ")} can perform this action` },
        { status: 403 }
      ),
      session: null,
    };
  }

  return authResult;
}

// Extract user role from session
export function getUserRole(session: {
  user?: { id?: string; role?: string };
}): string {
  return (session.user as unknown as { role: string }).role;
}

// Extract user ID from session
export function getUserId(session: {
  user?: { id?: string; role?: string };
}): string {
  return session.user?.id ?? "";
}

// Check if user is admin
export function isAdmin(session: {
  user?: { id?: string; role?: string };
}): boolean {
  return getUserRole(session) === USER_ROLES.ADMIN;
}

// Check if user is bookkeeper
export function isBookkeeper(session: {
  user?: { id?: string; role?: string };
}): boolean {
  return getUserRole(session) === USER_ROLES.BOOKKEEPER;
}

// Check if user is owner of a resource
export function isOwner(
  session: { user?: { id?: string; role?: string } },
  ownerId: string
): boolean {
  return getUserId(session) === ownerId;
}

// Check if user can edit (owner or admin)
export function canEdit(
  session: { user?: { id?: string; role?: string } },
  ownerId: string
): boolean {
  return isOwner(session, ownerId) || isAdmin(session);
}

// Check if user can transfer (owner or admin)
export function canTransfer(
  session: { user?: { id?: string; role?: string } },
  ownerId: string
): boolean {
  return isOwner(session, ownerId) || isAdmin(session);
}

// Reusable request validation
export async function validateRequest<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): Promise<{ data: T | null; error: NextResponse | null }> {
  try {
    const body = await request.json();
    const validatedData = schema.parse(body);
    return { data: validatedData, error: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        data: null,
        error: NextResponse.json(
          { error: "Invalid request data", details: error.issues },
          { status: 400 }
        ),
      };
    }
    return {
      data: null,
      error: NextResponse.json(
        { error: "Invalid request format" },
        { status: 400 }
      ),
    };
  }
}

// Reusable error responses
export function createErrorResponse(
  message: string,
  status: number = 500
): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export function createSuccessResponse<T>(
  data: T,
  status: number = 200
): NextResponse {
  return NextResponse.json(data, { status });
}

// Reusable pagination helpers
export function getPaginationParams(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  return { page, limit, skip: (page - 1) * limit };
}

export function getSearchParams(request: NextRequest) {
  return request.nextUrl.searchParams;
}
