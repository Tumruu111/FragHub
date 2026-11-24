-- Subscribers now choose "for him" or "for her" only. Nothing is live yet,
-- but any test subscription still set to "either" becomes "him" so the
-- column can switch to the smaller enum.
UPDATE "Subscription" SET "forWhom" = 'him' WHERE "forWhom" = 'either';

-- AlterEnum
BEGIN;
CREATE TYPE "SubscriberFor_new" AS ENUM ('him', 'her');
ALTER TABLE "Subscription" ALTER COLUMN "forWhom" TYPE "SubscriberFor_new" USING ("forWhom"::text::"SubscriberFor_new");
ALTER TYPE "SubscriberFor" RENAME TO "SubscriberFor_old";
ALTER TYPE "SubscriberFor_new" RENAME TO "SubscriberFor";
DROP TYPE "SubscriberFor_old";
COMMIT;
