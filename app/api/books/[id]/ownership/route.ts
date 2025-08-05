import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ERROR_MESSAGES, USER_ROLES } from "@/lib/constants";
import { z } from "zod";
import {
  requireRole,
  validateRequest,
  createErrorResponse,
  createSuccessResponse,
  getUserId,
  canTransfer,
} from "@/lib/utils/api";

const transferOwnershipSchema = z.object({
  newOwnerId: z.string().min(1, { message: "New owner ID is required" }),
  notes: z.string().min(1, { message: "Transfer notes are required" }),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication and role (admin or bookkeeper)
    const authResult = await requireRole([
      USER_ROLES.ADMIN,
      USER_ROLES.BOOKKEEPER,
    ]);
    if (authResult.error) return authResult.error;

    const { id } = await params;

    // Check if book exists
    const book = await db.book.findUnique({
      where: { id },
      include: { owner: true },
    });

    if (!book) {
      return createErrorResponse(ERROR_MESSAGES.BOOK_NOT_FOUND, 404);
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

    return createSuccessResponse({
      book,
      ownershipHistory: ownershipAudits,
    });
  } catch (error) {
    console.error("Error fetching book ownership history:", error);
    return createErrorResponse(ERROR_MESSAGES.INTERNAL_SERVER_ERROR, 500);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication and role (admin or bookkeeper)
    const authResult = await requireRole([
      USER_ROLES.ADMIN,
      USER_ROLES.BOOKKEEPER,
    ]);
    if (authResult.error) return authResult.error;

    const { id } = await params;
    const session = authResult.session!;

    // Validate request body
    const validationResult = await validateRequest(
      request,
      transferOwnershipSchema
    );
    if (validationResult.error) return validationResult.error;

    const { newOwnerId, notes } = validationResult.data!;

    // Check if book exists
    const book = await db.book.findUnique({
      where: { id },
      include: { owner: true },
    });

    if (!book) {
      return createErrorResponse(ERROR_MESSAGES.BOOK_NOT_FOUND, 404);
    }

    // Check if new owner exists and is a bookkeeper
    const newOwner = await db.user.findUnique({
      where: { id: newOwnerId },
    });

    if (!newOwner) {
      return createErrorResponse("New owner not found", 404);
    }

    if (newOwner.role !== USER_ROLES.BOOKKEEPER) {
      return createErrorResponse("New owner must be a bookkeeper", 400);
    }

    // Check permissions
    if (!canTransfer(session, book.ownerId)) {
      return createErrorResponse(
        "Only the book owner or administrator can transfer ownership",
        403
      );
    }

    // Prevent transferring to the same owner
    if (book.ownerId === newOwnerId) {
      return createErrorResponse(
        "Cannot transfer ownership to the current owner",
        400
      );
    }

    // Ensure session.user.id is defined
    const performedById = getUserId(session);
    if (!performedById) {
      return createErrorResponse("User ID not found in session", 400);
    }

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

    return createSuccessResponse({
      message: "Book ownership transferred successfully",
      book: result,
    });
  } catch (error) {
    console.error("Error transferring book ownership:", error);
    return createErrorResponse(ERROR_MESSAGES.INTERNAL_SERVER_ERROR, 500);
  }
}
