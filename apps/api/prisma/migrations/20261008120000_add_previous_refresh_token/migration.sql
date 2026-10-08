-- AlterTable
ALTER TABLE "User" ADD COLUMN "previousRefreshToken" TEXT,
ADD COLUMN "previousRefreshTokenAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "User_previousRefreshToken_key" ON "User"("previousRefreshToken");
