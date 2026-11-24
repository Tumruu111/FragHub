-- Subscriptions: monthly boxes of decants. Listings get a tier and who they
-- suit; subscriptions, monthly invoices and boxes are new tables.

-- CreateEnum
CREATE TYPE "ListingTier" AS ENUM ('arabian', 'designer', 'niche');

-- CreateEnum
CREATE TYPE "ScentFor" AS ENUM ('masculine', 'feminine', 'unisex');

-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('base', 'premium');

-- CreateEnum
CREATE TYPE "SubscriberFor" AS ENUM ('him', 'her', 'either');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('pending', 'active', 'cancelled', 'waitlist');

-- CreateEnum
CREATE TYPE "BoxStatus" AS ENUM ('proposed', 'confirmed');

-- AlterTable
ALTER TABLE "Listing" ADD COLUMN     "scentFor" "ScentFor" NOT NULL DEFAULT 'unisex',
ADD COLUMN     "tier" "ListingTier" NOT NULL DEFAULT 'designer';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "boxId" TEXT;

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan" "SubscriptionPlan" NOT NULL,
    "forWhom" "SubscriberFor" NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'pending',
    "deliveryPhone" TEXT NOT NULL,
    "deliveryAddress" TEXT NOT NULL,
    "deliveryNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "cancelledAt" TIMESTAMP(3),

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionInvoice" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "qpayInvoiceId" TEXT,
    "qpayQrText" TEXT,
    "qpayQrImage" TEXT,
    "qpayUrls" JSONB,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Box" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "status" "BoxStatus" NOT NULL DEFAULT 'proposed',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),

    CONSTRAINT "Box_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BoxItem" (
    "id" TEXT NOT NULL,
    "boxId" TEXT NOT NULL,
    "tier" "ListingTier" NOT NULL,
    "sizeMl" INTEGER NOT NULL,
    "listingId" TEXT,

    CONSTRAINT "BoxItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_userId_key" ON "Subscription"("userId");

-- CreateIndex
CREATE INDEX "SubscriptionInvoice_month_status_idx" ON "SubscriptionInvoice"("month", "status");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionInvoice_subscriptionId_month_key" ON "SubscriptionInvoice"("subscriptionId", "month");

-- CreateIndex
CREATE INDEX "Box_month_idx" ON "Box"("month");

-- CreateIndex
CREATE UNIQUE INDEX "Box_subscriptionId_month_key" ON "Box"("subscriptionId", "month");

-- CreateIndex
CREATE INDEX "BoxItem_listingId_idx" ON "BoxItem"("listingId");

-- CreateIndex
CREATE INDEX "Order_boxId_idx" ON "Order"("boxId");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_boxId_fkey" FOREIGN KEY ("boxId") REFERENCES "Box"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionInvoice" ADD CONSTRAINT "SubscriptionInvoice_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Box" ADD CONSTRAINT "Box_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoxItem" ADD CONSTRAINT "BoxItem_boxId_fkey" FOREIGN KEY ("boxId") REFERENCES "Box"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoxItem" ADD CONSTRAINT "BoxItem_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

