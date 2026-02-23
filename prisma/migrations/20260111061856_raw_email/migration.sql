-- CreateTable
CREATE TABLE "RawEmail" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "gmailId" TEXT NOT NULL,
    "threadId" TEXT,
    "payload" JSONB NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RawEmail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RawEmail_userId_gmailId_key" ON "RawEmail"("userId", "gmailId");
