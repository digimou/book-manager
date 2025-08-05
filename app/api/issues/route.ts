import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { generateOTP } from "@/lib/utils/server";
import {
  USER_ROLES,
  BOOK_STATUS,
  ISSUE_STATUS,
  OTP_CONFIG,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
} from "@/lib/constants";

const issueBookSchema = z.object({
  bookId: z.string().min(1, "Book ID is required"),
  userId: z.string().min(1, "User ID is required"),
  dueDate: z.string().datetime(),
});

const returnBookSchema = z.object({
  bookId: z.string().min(1, "Book ID is required"),
  userId: z.string().min(1, "User ID is required"),
  otpCode: z.string().min(OTP_CONFIG.LENGTH, "OTP code is required"),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const userId = searchParams.get("userId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }

    if (userId) {
      where.userId = userId;
    }

    const issues = await db.bookIssue.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        book: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    const total = await db.bookIssue.count({ where });

    return NextResponse.json({
      issues,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching issues:", error);
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
      ![USER_ROLES.ADMIN, USER_ROLES.LIBRARIAN].includes(
        (session.user as unknown as { role: string }).role as
          | "ADMIN"
          | "LIBRARIAN"
      )
    ) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.UNAUTHORIZED },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = issueBookSchema.parse(body);

    // Check if book exists and is available
    const book = await db.book.findUnique({
      where: { id: validatedData.bookId },
    });

    if (!book) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.BOOK_NOT_FOUND },
        { status: 404 }
      );
    }

    if (book.availableCopies <= 0) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.NO_COPIES_AVAILABLE },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await db.user.findUnique({
      where: { id: validatedData.userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.USER_NOT_FOUND },
        { status: 404 }
      );
    }

    // Generate OTP
    const otpCode = generateOTP();
    const otpExpires = new Date(
      Date.now() + OTP_CONFIG.EXPIRY_MINUTES * 60 * 1000
    );

    // Create book issue
    const bookIssue = await db.bookIssue.create({
      data: {
        bookId: validatedData.bookId,
        userId: validatedData.userId,
        dueDate: new Date(validatedData.dueDate),
        otpCode,
        otpExpires,
      },
    });

    // Update book availability
    await db.book.update({
      where: { id: validatedData.bookId },
      data: {
        availableCopies: book.availableCopies - 1,
        status:
          book.availableCopies - 1 === 0
            ? BOOK_STATUS.ISSUED
            : BOOK_STATUS.AVAILABLE,
      },
    });

    // TODO: Send OTP email to user
    // For now, we'll just return the OTP in the response
    // In production, this should be sent via email

    return NextResponse.json({
      bookIssue,
      otpCode, // Remove this in production
      message: SUCCESS_MESSAGES.BOOK_ISSUED,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.VALIDATION_ERROR, details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error issuing book:", error);
    return NextResponse.json(
      { error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (
      !session?.user ||
      ![USER_ROLES.ADMIN, USER_ROLES.LIBRARIAN].includes(
        (session.user as unknown as { role: string }).role as
          | "ADMIN"
          | "LIBRARIAN"
      )
    ) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.UNAUTHORIZED },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = returnBookSchema.parse(body);

    // Find the book issue
    const bookIssue = await db.bookIssue.findFirst({
      where: {
        bookId: validatedData.bookId,
        userId: validatedData.userId,
        status: ISSUE_STATUS.ISSUED,
      },
    });

    if (!bookIssue) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.BOOK_NOT_FOUND },
        { status: 404 }
      );
    }

    // Verify OTP
    if (bookIssue.otpCode !== validatedData.otpCode) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.INVALID_OTP },
        { status: 400 }
      );
    }

    if (bookIssue.otpExpires && new Date() > bookIssue.otpExpires) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.OTP_EXPIRED },
        { status: 400 }
      );
    }

    // Update book issue status
    await db.bookIssue.update({
      where: { id: bookIssue.id },
      data: {
        status: ISSUE_STATUS.RETURNED,
        returnDate: new Date(),
      },
    });

    // Update book availability
    const book = await db.book.findUnique({
      where: { id: validatedData.bookId },
    });

    if (book) {
      await db.book.update({
        where: { id: validatedData.bookId },
        data: {
          availableCopies: book.availableCopies + 1,
          status: BOOK_STATUS.AVAILABLE,
        },
      });
    }

    return NextResponse.json({
      message: SUCCESS_MESSAGES.BOOK_RETURNED,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.VALIDATION_ERROR, details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error returning book:", error);
    return NextResponse.json(
      { error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR },
      { status: 500 }
    );
  }
}
