-- The shop stops selling single decants and sells full bottles by pre-order
-- instead: half paid up front, the rest once the bottles arrive in UB.
-- Decant prices (ListingSize) and decant checkouts (Payment) are removed;
-- nothing is live yet, so no real orders are lost. Box decants stay in Order.

-- CreateEnum
CREATE TYPE "PreorderStatus" AS ENUM ('awaiting_deposit', 'ordering', 'arrived', 'paid', 'delivered', 'cancelled');

-- CreateEnum
CREATE TYPE "PreorderPaymentKind" AS ENUM ('deposit', 'balance');

-- DropForeignKey
ALTER TABLE "ListingSize" DROP CONSTRAINT "ListingSize_listingId_fkey";

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_paymentId_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_userId_fkey";

-- DropIndex
DROP INDEX "Order_paymentId_idx";

-- AlterTable
ALTER TABLE "Listing" ADD COLUMN     "bottlePrice" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "paymentId";

-- DropTable
DROP TABLE "ListingSize";

-- DropTable
DROP TABLE "Payment";

-- CreateTable
CREATE TABLE "Preorder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "PreorderStatus" NOT NULL DEFAULT 'awaiting_deposit',
    "total" DECIMAL(10,2) NOT NULL,
    "deposit" DECIMAL(10,2) NOT NULL,
    "deliveryPhone" TEXT NOT NULL,
    "deliveryAddress" TEXT NOT NULL,
    "deliveryNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "depositPaidAt" TIMESTAMP(3),
    "arrivedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),

    CONSTRAINT "Preorder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PreorderItem" (
    "id" TEXT NOT NULL,
    "preorderId" TEXT NOT NULL,
    "listingId" TEXT,
    "title" TEXT NOT NULL,
    "bottleMl" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "PreorderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PreorderPayment" (
    "id" TEXT NOT NULL,
    "preorderId" TEXT NOT NULL,
    "kind" "PreorderPaymentKind" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "qpayInvoiceId" TEXT,
    "qpayQrText" TEXT,
    "qpayQrImage" TEXT,
    "qpayUrls" JSONB,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PreorderPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Preorder_userId_idx" ON "Preorder"("userId");

-- CreateIndex
CREATE INDEX "Preorder_status_idx" ON "Preorder"("status");

-- CreateIndex
CREATE INDEX "PreorderItem_preorderId_idx" ON "PreorderItem"("preorderId");

-- CreateIndex
CREATE INDEX "PreorderItem_listingId_idx" ON "PreorderItem"("listingId");

-- CreateIndex
CREATE UNIQUE INDEX "PreorderPayment_preorderId_kind_key" ON "PreorderPayment"("preorderId", "kind");

-- AddForeignKey
ALTER TABLE "Preorder" ADD CONSTRAINT "Preorder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreorderItem" ADD CONSTRAINT "PreorderItem_preorderId_fkey" FOREIGN KEY ("preorderId") REFERENCES "Preorder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreorderItem" ADD CONSTRAINT "PreorderItem_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreorderPayment" ADD CONSTRAINT "PreorderPayment_preorderId_fkey" FOREIGN KEY ("preorderId") REFERENCES "Preorder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

