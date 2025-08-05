import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { generateRFIDTag } from "@/lib/utils/server";
import {
  BOOK_GENRES,
  ISSUE_STATUS,
  USER_ROLES,
  ERROR_MESSAGES,
  PAGINATION,
  VALIDATION,
} from "@/lib/constants";

const bookSchema = z.object({
  title: z.string().min(VALIDATION.MIN_NAME_LENGTH, "Title is required"),
  author: z.string().min(VALIDATION.MIN_NAME_LENGTH, "Author is required"),
  isbn: z.string().min(VALIDATION.MIN_NAME_LENGTH, "ISBN is required"),
  genre: z.enum([
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
  ]),
  publicationDate: z.string().datetime(),
  description: z.string().optional(),
  coverImage: z.string().optional(),
  totalCopies: z
    .number()
    .min(VALIDATION.MIN_BOOK_COPIES, "At least 1 copy is required"),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.UNAUTHORIZED },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const genre = searchParams.get("genre");
    const sortBy = searchParams.get("sortBy") || "title";
    const sortOrder = searchParams.get("sortOrder") || "asc";
    const page = parseInt(
      searchParams.get("page") || PAGINATION.DEFAULT_PAGE.toString()
    );
    const limit = parseInt(
      searchParams.get("limit") || PAGINATION.DEFAULT_LIMIT.toString()
    );
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { author: { contains: search, mode: "insensitive" } },
        { isbn: { contains: search, mode: "insensitive" } },
      ];
    }

    if (genre) {
      where.genre = genre;
    }

    const books = await db.book.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
      include: {
        owner: { select: { id: true, name: true, email: true } },
        bookIssues: {
          where: { status: ISSUE_STATUS.ISSUED },
          include: { user: { select: { name: true, email: true } } },
        },
      },
    });

    const total = await db.book.count({ where });

    return NextResponse.json({
      books,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching books:", error);
    return NextResponse.json(
      { error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.UNAUTHORIZED },
        { status: 401 }
      );
    }

    const userRole = (session.user as unknown as { role: string }).role;

    if (
      ![USER_ROLES.ADMIN, USER_ROLES.BOOKKEEPER].includes(
        userRole as "ADMIN" | "BOOKKEEPER"
      )
    ) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.UNAUTHORIZED },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = bookSchema.parse(body);

    const existingBook = await db.book.findUnique({
      where: { isbn: validatedData.isbn },
    });

    if (existingBook) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.BOOK_ALREADY_EXISTS },
        { status: 400 }
      );
    }

    // Determine the owner - if admin creates, assign to first bookkeeper, otherwise use the creator
    let ownerId: string;
    if (userRole === USER_ROLES.ADMIN) {
      const firstBookkeeper = await db.user.findFirst({
        where: { role: USER_ROLES.BOOKKEEPER },
      });
      if (!firstBookkeeper) {
        return NextResponse.json(
          { error: "No bookkeeper found to assign ownership" },
          { status: 400 }
        );
      }
      ownerId = firstBookkeeper.id;
    } else {
      ownerId = session.user.id as string;
    }

    const book = await db.book.create({
      data: {
        ...validatedData,
        rfidTag: generateRFIDTag(),
        publicationDate: new Date(validatedData.publicationDate),
        availableCopies: validatedData.totalCopies,
        ownerId,
      },
    });

    // Create initial ownership audit record
    await db.bookOwnershipAudit.create({
      data: {
        bookId: book.id,
        fromOwnerId: null, // Initial assignment
        toOwnerId: ownerId,
        performedById: session.user.id as string,
        notes: "Initial book creation and ownership assignment",
      },
    });

    return NextResponse.json({ book }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.VALIDATION_ERROR, details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error creating book:", error);
    return NextResponse.json(
      { error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR },
      { status: 500 }
    );
  }
}

// Transfer book ownership
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.UNAUTHORIZED },
        { status: 401 }
      );
    }

    const userRole = (session.user as unknown as { role: string }).role;

    if (
      ![USER_ROLES.ADMIN, USER_ROLES.BOOKKEEPER].includes(
        userRole as "ADMIN" | "BOOKKEEPER"
      )
    ) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.UNAUTHORIZED },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { bookId, newOwnerId, notes } = body;

    if (!bookId || !newOwnerId) {
      return NextResponse.json(
        { error: "Book ID and new owner ID are required" },
        { status: 400 }
      );
    }

    // Get the book with current owner
    const book = await db.book.findUnique({
      where: { id: bookId },
      include: { owner: true },
    });

    if (!book) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.BOOK_NOT_FOUND },
        { status: 404 }
      );
    }

    // Check if new owner is a bookkeeper
    const newOwner = await db.user.findUnique({
      where: { id: newOwnerId, role: USER_ROLES.BOOKKEEPER },
    });

    if (!newOwner) {
      return NextResponse.json(
        { error: "New owner must be a bookkeeper" },
        { status: 400 }
      );
    }

    // Check authorization - only current owner or admin can transfer ownership
    const isOwner = book.ownerId === session.user.id;
    const isAdmin = userRole === USER_ROLES.ADMIN;

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "Only the current owner or admin can transfer ownership" },
        { status: 403 }
      );
    }

    // Update book ownership
    await db.book.update({
      where: { id: bookId },
      data: { ownerId: newOwnerId },
    });

    // Create ownership audit record
    await db.bookOwnershipAudit.create({
      data: {
        bookId,
        fromOwnerId: book.ownerId,
        toOwnerId: newOwnerId,
        performedById: session.user.id as string,
        notes:
          notes || `Ownership transferred by ${isAdmin ? "admin" : "owner"}`,
      },
    });

    return NextResponse.json({
      message: "Book ownership transferred successfully",
      book: await db.book.findUnique({
        where: { id: bookId },
        include: { owner: true },
      }),
    });
  } catch (error) {
    console.error("Error transferring book ownership:", error);
    return NextResponse.json(
      { error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR },
      { status: 500 }
    );
  }
}
