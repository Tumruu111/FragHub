-- Delivery: checkout asks for a phone number and address, kept on the payment.
-- Each order points at the payment it came from.

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN "deliveryAddress" TEXT,
ADD COLUMN "deliveryNote" TEXT,
ADD COLUMN "deliveryPhone" TEXT;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN "paymentId" TEXT;

-- CreateIndex
CREATE INDEX "Order_paymentId_idx" ON "Order"("paymentId");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
