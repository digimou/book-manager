import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  BOOK_STATUS,
  ISSUE_STATUS,
  USER_ROLES,
  ERROR_MESSAGES,
} from "@/lib/constants";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.UNAUTHORIZED },
        { status: 401 }
      );
    }

    const [totalBooks, availableBooks, issuedBooks, userIssuedBooks] =
      await Promise.all([
        db.book.count(),
        db.book.count({ where: { status: BOOK_STATUS.AVAILABLE } }),
        db.book.count({ where: { status: BOOK_STATUS.ISSUED } }),
        (session.user as unknown as { role: string }).role === USER_ROLES.USER
          ? db.bookIssue.count({
              where: { userId: session.user.id, status: ISSUE_STATUS.ISSUED },
            })
          : Promise.resolve(0),
      ]);

    return NextResponse.json({
      totalBooks,
      availableBooks,
      issuedBooks,
      userIssuedBooks,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR },
      { status: 500 }
    );
  }
}
