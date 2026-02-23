-- AlterTable
ALTER TABLE "RawEmail" ADD COLUMN     "bankName" TEXT,
ADD COLUMN     "isBankCandidate" BOOLEAN NOT NULL DEFAULT false;
