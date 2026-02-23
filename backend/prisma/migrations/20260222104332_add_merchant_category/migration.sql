-- CreateTable
CREATE TABLE "MerchantCategory" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "merchantKeyword" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MerchantCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MerchantCategory_userId_merchantKeyword_key" ON "MerchantCategory"("userId", "merchantKeyword");

-- AddForeignKey
ALTER TABLE "MerchantCategory" ADD CONSTRAINT "MerchantCategory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
