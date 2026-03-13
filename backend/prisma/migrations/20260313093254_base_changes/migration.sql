/*
  Warnings:

  - You are about to drop the column `description` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the `Report` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Report" DROP CONSTRAINT "Report_userId_fkey";

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "description",
ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'REGEX';

-- DropTable
DROP TABLE "Report";
