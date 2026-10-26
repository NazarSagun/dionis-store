-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "orderId" INTEGER,
ADD COLUMN     "orderStatus" "OrderStatus",
ALTER COLUMN "replyId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

