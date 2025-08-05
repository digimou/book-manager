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
    if (
      !session?.user ||
      (session.user as unknown as { role: string }).role !== USER_ROLES.ADMIN
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

    const book = await db.book.create({
      data: {
        ...validatedData,
        rfidTag: generateRFIDTag(),
        publicationDate: new Date(validatedData.publicationDate),
        availableCopies: validatedData.totalCopies,
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
