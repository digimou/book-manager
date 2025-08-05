import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole, getUserRole, getUserId } from "@/lib/utils/api";
import { USER_ROLES } from "@/lib/constants";

export async function GET() {
  try {
    // Check authentication and role (admin or bookkeeper)
    const authResult = await requireRole([
      USER_ROLES.ADMIN,
      USER_ROLES.BOOKKEEPER,
    ]);
    if (authResult.error) return authResult.error;
    const session = authResult.session!;
    const userRole = getUserRole(session);
    const userId = getUserId(session);

    let users;
    if (userRole === USER_ROLES.ADMIN) {
      users = await db.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    } else {
      users = await db.user.findMany({
        where: {
          role: USER_ROLES.BOOKKEEPER,
          id: {
            not: userId,
          },
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }
    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
