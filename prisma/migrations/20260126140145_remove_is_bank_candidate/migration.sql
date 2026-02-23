/*
  Warnings:

  - You are about to drop the column `isBankCandidate` on the `RawEmail` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "RawEmail" DROP COLUMN "isBankCandidate",
ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;
