import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ERROR_MESSAGES } from "@/lib/constants";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.UNAUTHORIZED },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Check if book exists
    const book = await db.book.findUnique({
      where: { id },
      include: { owner: true },
    });

    if (!book) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.BOOK_NOT_FOUND },
        { status: 404 }
      );
    }

    // Get ownership audit history
    const ownershipAudits = await db.bookOwnershipAudit.findMany({
      where: { bookId: id },
      include: {
        fromOwner: { select: { id: true, name: true, email: true } },
        toOwner: { select: { id: true, name: true, email: true } },
        performedBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      book,
      ownershipHistory: ownershipAudits,
    });
  } catch (error) {
    console.error("Error fetching book ownership history:", error);
    return NextResponse.json(
      { error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR },
      { status: 500 }
    );
  }
}
