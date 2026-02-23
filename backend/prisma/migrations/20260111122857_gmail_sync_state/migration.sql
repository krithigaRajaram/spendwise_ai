-- CreateTable
CREATE TABLE "GmailSyncState" (
    "userId" INTEGER NOT NULL,
    "lastFetchedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GmailSyncState_pkey" PRIMARY KEY ("userId")
);

-- AddForeignKey
ALTER TABLE "GmailSyncState" ADD CONSTRAINT "GmailSyncState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
