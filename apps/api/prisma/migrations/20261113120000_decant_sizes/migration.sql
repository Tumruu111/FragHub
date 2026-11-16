-- Decant sizes: a listing is now one bottle whose ml are shared by fixed
-- decant sizes, each with its own price. Orders remember size and price paid.

-- AlterTable
ALTER TABLE "Listing" ADD COLUMN "bottleMl" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "volumeMl" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "ListingSize" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "sizeMl" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "ListingSize_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ListingSize_listingId_sizeMl_key" ON "ListingSize"("listingId", "sizeMl");

-- AddForeignKey
ALTER TABLE "ListingSize" ADD CONSTRAINT "ListingSize_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN "sizeMl" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "price" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- Carry existing data over. A "5ml" listing with stock 4 becomes a bottle with
-- 20ml left, and its price becomes the price of the 5ml size (if 5ml is one of
-- the fixed sizes). Listings whose size isn't a number keep 0ml and no prices.
UPDATE "Listing"
SET "volumeMl" = "stock" * CAST(substring("size" from '^[0-9]+') AS INTEGER),
    "bottleMl" = "stock" * CAST(substring("size" from '^[0-9]+') AS INTEGER)
WHERE "size" ~ '^[0-9]+';

INSERT INTO "ListingSize" ("id", "listingId", "sizeMl", "price")
SELECT gen_random_uuid()::text, "id", CAST(substring("size" from '^[0-9]+') AS INTEGER), "price"
FROM "Listing"
WHERE substring("size" from '^[0-9]+') IN ('2', '5', '10');

UPDATE "Listing" SET "status" = 'out_of_order' WHERE "volumeMl" < 2;

UPDATE "Order" AS o
SET "price" = l."price",
    "sizeMl" = COALESCE(CAST(substring(l."size" from '^[0-9]+') AS INTEGER), 0)
FROM "Listing" AS l
WHERE o."listingId" = l."id";

-- AlterTable
ALTER TABLE "Listing" DROP COLUMN "price",
DROP COLUMN "size",
DROP COLUMN "stock";
