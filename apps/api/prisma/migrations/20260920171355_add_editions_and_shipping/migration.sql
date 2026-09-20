-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "shippingCity" TEXT,
ADD COLUMN     "shippingCountry" TEXT,
ADD COLUMN     "shippingLine1" TEXT,
ADD COLUMN     "shippingLine2" TEXT,
ADD COLUMN     "shippingName" TEXT,
ADD COLUMN     "shippingPostalCode" TEXT;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "editionId" INTEGER,
ALTER COLUMN "activationCode" DROP NOT NULL;

-- CreateTable
CREATE TABLE "GameEdition" (
    "id" SERIAL NOT NULL,
    "gameId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "discount" INTEGER NOT NULL DEFAULT 0,
    "stock" INTEGER NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "GameEdition_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "GameEdition" ADD CONSTRAINT "GameEdition_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game_pc"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_editionId_fkey" FOREIGN KEY ("editionId") REFERENCES "GameEdition"("id") ON DELETE SET NULL ON UPDATE CASCADE;
