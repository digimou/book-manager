import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { USER_ROLES } from "@/lib/constants";

export async function GET() {
  try {
    // Check authentication
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check if user is admin or bookkeeper
    const userRole = (session.user as unknown as { role: string }).role;
    if (userRole !== USER_ROLES.ADMIN && userRole !== USER_ROLES.BOOKKEEPER) {
      return NextResponse.json(
        { error: "Only administrators and bookkeepers can view users" },
        { status: 403 }
      );
    }

    let users;

    // Fetch users based on role permissions
    if (userRole === USER_ROLES.ADMIN) {
      // Admin can see all users
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
      // Bookkeeper can only see other bookkeepers
      users = await db.user.findMany({
        where: {
          role: USER_ROLES.BOOKKEEPER,
          id: {
            not: session.user.id,
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
