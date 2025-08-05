import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ERROR_MESSAGES, USER_ROLES } from "@/lib/constants";
import { z } from "zod";

const transferOwnershipSchema = z.object({
  newOwnerId: z.string().min(1, { message: "New owner ID is required" }),
  notes: z.string().min(1, { message: "Transfer notes are required" }),
});

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

export async function PATCH(
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
    const body = await request.json();

    // Validate request body
    const validationResult = transferOwnershipSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { newOwnerId, notes } = validationResult.data;

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

    // Check if new owner exists and is a bookkeeper
    const newOwner = await db.user.findUnique({
      where: { id: newOwnerId },
    });

    if (!newOwner) {
      return NextResponse.json(
        { error: "New owner not found" },
        { status: 404 }
      );
    }

    if (newOwner.role !== USER_ROLES.BOOKKEEPER) {
      return NextResponse.json(
        { error: "New owner must be a bookkeeper" },
        { status: 400 }
      );
    }

    // Check permissions
    const userRole = (session.user as unknown as { role: string }).role;
    const isOwner = book.ownerId === session.user.id;
    const isAdmin = userRole === USER_ROLES.ADMIN;

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        {
          error: "Only the book owner or administrator can transfer ownership",
        },
        { status: 403 }
      );
    }

    // Prevent transferring to the same owner
    if (book.ownerId === newOwnerId) {
      return NextResponse.json(
        { error: "Cannot transfer ownership to the current owner" },
        { status: 400 }
      );
    }

    // Ensure session.user.id is defined
    if (!session.user.id) {
      return NextResponse.json(
        { error: "User ID not found in session" },
        { status: 400 }
      );
    }

    const performedById = session.user.id;

    // Perform ownership transfer in a transaction
    const result = await db.$transaction(async (tx) => {
      // Update book ownership
      const updatedBook = await tx.book.update({
        where: { id },
        data: { ownerId: newOwnerId },
        include: { owner: true },
      });

      // Create ownership audit record
      await tx.bookOwnershipAudit.create({
        data: {
          bookId: id,
          fromOwnerId: book.ownerId,
          toOwnerId: newOwnerId,
          performedById,
          notes,
        },
      });

      return updatedBook;
    });

    return NextResponse.json({
      message: "Book ownership transferred successfully",
      book: result,
    });
  } catch (error) {
    console.error("Error transferring book ownership:", error);
    return NextResponse.json(
      { error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR },
      { status: 500 }
    );
  }
}
