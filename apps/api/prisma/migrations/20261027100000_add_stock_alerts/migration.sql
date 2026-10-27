-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "editionId" INTEGER;

-- CreateTable
CREATE TABLE "StockAlert" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "editionId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notifiedAt" TIMESTAMP(3),

    CONSTRAINT "StockAlert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StockAlert_editionId_notifiedAt_idx" ON "StockAlert"("editionId", "notifiedAt");

-- CreateIndex
CREATE UNIQUE INDEX "StockAlert_userId_editionId_key" ON "StockAlert"("userId", "editionId");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_editionId_fkey" FOREIGN KEY ("editionId") REFERENCES "GameEdition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockAlert" ADD CONSTRAINT "StockAlert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockAlert" ADD CONSTRAINT "StockAlert_editionId_fkey" FOREIGN KEY ("editionId") REFERENCES "GameEdition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
