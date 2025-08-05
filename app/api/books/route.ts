import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateRFIDTag } from "@/lib/utils/server";
import { USER_ROLES, ERROR_MESSAGES, PAGINATION } from "@/lib/constants";
import { createBookSchema } from "@/lib/schemas";

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
          where: { status: "ISSUED" },
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
    const validatedData = createBookSchema.parse(body);

    const existingBook = await db.book.findUnique({
      where: { isbn: validatedData.isbn },
    });

    if (existingBook) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.BOOK_ALREADY_EXISTS },
        { status: 400 }
      );
    }

    // Get the user ID from the session
    const ownerId = session.user.id;

    // Validate that we have a valid ownerId
    if (!ownerId) {
      return NextResponse.json(
        { error: "Unable to determine book owner" },
        { status: 400 }
      );
    }

    // Convert date format to ISO string for database
    const publicationDate = new Date(
      validatedData.publicationDate + "T00:00:00"
    ).toISOString();

    // Use a transaction to ensure both book and audit record are created together
    const result = await db.$transaction(async (tx) => {
      // Create the book
      const book = await tx.book.create({
        data: {
          title: validatedData.title,
          author: validatedData.author,
          isbn: validatedData.isbn,
          genre: validatedData.genre,
          publicationDate: new Date(publicationDate),
          description: validatedData.description,
          coverImage: validatedData.coverImage,
          totalCopies: validatedData.totalCopies,
          rfidTag: generateRFIDTag(),
          availableCopies: validatedData.totalCopies,
          ownerId,
        },
      });

      // Create initial ownership audit record
      await tx.bookOwnershipAudit.create({
        data: {
          bookId: book.id,
          fromOwnerId: null, // Initial assignment
          toOwnerId: ownerId,
          performedById: ownerId, // Use the same owner ID
          notes: "Initial book creation and ownership assignment",
        },
      });

      return book;
    });

    return NextResponse.json({ book: result }, { status: 201 });
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
