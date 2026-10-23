-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'SHIPPED', 'DELIVERED');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "trackingNumber" TEXT;

-- A digital-only order has nothing to ship.
UPDATE "Order" SET "status" = 'DELIVERED'
WHERE NOT EXISTS (
  SELECT 1 FROM "OrderItem" WHERE "OrderItem"."orderId" = "Order"."id" AND "OrderItem"."editionId" IS NOT NULL
);
