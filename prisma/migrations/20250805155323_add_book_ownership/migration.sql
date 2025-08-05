/*
  Warnings:

  - Added the required column `ownerId` to the `Book` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Book" ADD COLUMN     "ownerId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "public"."BookOwnershipAudit" (
    "id" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "fromOwnerId" TEXT,
    "toOwnerId" TEXT NOT NULL,
    "performedById" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookOwnershipAudit_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."Book" ADD CONSTRAINT "Book_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BookOwnershipAudit" ADD CONSTRAINT "BookOwnershipAudit_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "public"."Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BookOwnershipAudit" ADD CONSTRAINT "BookOwnershipAudit_fromOwnerId_fkey" FOREIGN KEY ("fromOwnerId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BookOwnershipAudit" ADD CONSTRAINT "BookOwnershipAudit_toOwnerId_fkey" FOREIGN KEY ("toOwnerId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BookOwnershipAudit" ADD CONSTRAINT "BookOwnershipAudit_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
