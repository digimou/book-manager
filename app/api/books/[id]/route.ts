import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  USER_ROLES,
  ERROR_MESSAGES,
  ISSUE_STATUS,
  SUCCESS_MESSAGES,
} from "@/lib/constants";
import { updateBookSchema } from "@/lib/schemas";

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
    const book = await db.book.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        bookIssues: {
          include: { user: { select: { name: true, email: true } } },
        },
      },
    });

    if (!book) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.BOOK_NOT_FOUND },
        { status: 404 }
      );
    }

    return NextResponse.json({ book });
  } catch (error) {
    console.error("Error fetching book:", error);
    return NextResponse.json(
      { error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR },
      { status: 500 }
    );
  }
}

export async function PUT(
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
    const validatedData = updateBookSchema.parse(body);

    const existingBook = await db.book.findUnique({
      where: { id },
      include: { owner: true },
    });

    if (!existingBook) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.BOOK_NOT_FOUND },
        { status: 404 }
      );
    }

    // Check permissions: only owner or admin can edit
    const userRole = (session.user as unknown as { role: string }).role;
    const isOwner = existingBook.ownerId === session.user.id;
    const isAdmin = userRole === USER_ROLES.ADMIN;

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "Only the book owner or administrator can edit this book" },
        { status: 403 }
      );
    }

    // Check if ISBN is being updated and if it already exists
    if (validatedData.isbn && validatedData.isbn !== existingBook.isbn) {
      const isbnExists = await db.book.findUnique({
        where: { isbn: validatedData.isbn },
      });
      if (isbnExists) {
        return NextResponse.json(
          { error: ERROR_MESSAGES.BOOK_ALREADY_EXISTS },
          { status: 400 }
        );
      }
    }

    // Convert date format if provided
    let publicationDate = undefined;
    if (validatedData.publicationDate) {
      publicationDate = new Date(validatedData.publicationDate + "T00:00:00");
    }

    const updateData = {
      ...validatedData,
      publicationDate,
    };

    const book = await db.book.update({
      where: { id },
      data: updateData,
      include: {
        owner: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ book });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.VALIDATION_ERROR, details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error updating book:", error);
    return NextResponse.json(
      { error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (
      !session?.user ||
      (session.user as unknown as { role: string }).role !== USER_ROLES.ADMIN
    ) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.UNAUTHORIZED },
        { status: 401 }
      );
    }

    const { id } = await params;
    const book = await db.book.findUnique({
      where: { id },
      include: {
        bookIssues: {
          where: { status: ISSUE_STATUS.ISSUED },
        },
      },
    });

    if (!book) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.BOOK_NOT_FOUND },
        { status: 404 }
      );
    }

    // Check if book has active issues
    if (book.bookIssues.length > 0) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.BOOK_WITH_ACTIVE_ISSUES },
        { status: 400 }
      );
    }

    await db.book.delete({
      where: { id },
    });

    return NextResponse.json({ message: SUCCESS_MESSAGES.BOOK_DELETED });
  } catch (error) {
    console.error("Error deleting book:", error);
    return NextResponse.json(
      { error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR },
      { status: 500 }
    );
  }
}
