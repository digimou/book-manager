import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import {
  BOOK_GENRES,
  USER_ROLES,
  ISSUE_STATUS,
  ERROR_MESSAGES,
  VALIDATION,
  SUCCESS_MESSAGES,
} from "@/lib/constants";
import { BookUpdateData } from "@/lib/types";

const updateBookSchema = z.object({
  title: z
    .string()
    .min(VALIDATION.MIN_NAME_LENGTH, "Title is required")
    .optional(),
  author: z
    .string()
    .min(VALIDATION.MIN_NAME_LENGTH, "Author is required")
    .optional(),
  isbn: z
    .string()
    .min(VALIDATION.MIN_NAME_LENGTH, "ISBN is required")
    .optional(),
  genre: z
    .enum([
      BOOK_GENRES.FICTION,
      BOOK_GENRES.NON_FICTION,
      BOOK_GENRES.SCIENCE_FICTION,
      BOOK_GENRES.MYSTERY,
      BOOK_GENRES.ROMANCE,
      BOOK_GENRES.THRILLER,
      BOOK_GENRES.BIOGRAPHY,
      BOOK_GENRES.HISTORY,
      BOOK_GENRES.SCIENCE,
      BOOK_GENRES.TECHNOLOGY,
      BOOK_GENRES.PHILOSOPHY,
      BOOK_GENRES.RELIGION,
      BOOK_GENRES.ART,
      BOOK_GENRES.MUSIC,
      BOOK_GENRES.TRAVEL,
      BOOK_GENRES.COOKING,
      BOOK_GENRES.HEALTH,
      BOOK_GENRES.EDUCATION,
      BOOK_GENRES.CHILDREN,
      BOOK_GENRES.YOUNG_ADULT,
      BOOK_GENRES.OTHER,
    ])
    .optional(),
  publicationDate: z.string().datetime().optional(),
  description: z.string().optional(),
  coverImage: z.string().optional(),
  totalCopies: z
    .number()
    .min(VALIDATION.MIN_BOOK_COPIES, "At least 1 copy is required")
    .optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
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
          include: {
            user: { select: { name: true, email: true } },
          },
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
    if (!session?.user || (session.user as unknown as { role: string }).role !== USER_ROLES.ADMIN) {
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
    });

    if (!existingBook) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.BOOK_NOT_FOUND },
        { status: 404 }
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

    const updateData: BookUpdateData = { 
      ...validatedData,
      publicationDate: validatedData.publicationDate ? new Date(validatedData.publicationDate) : undefined
    };

    const book = await db.book.update({
      where: { id },
      data: updateData,
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
    if (!session?.user || (session.user as unknown as { role: string }).role !== USER_ROLES.ADMIN) {
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
