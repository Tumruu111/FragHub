import { BOX_SIZE_ML } from './subscriptions';

// A listing is one scent: its opened bottle fills subscription box decants,
// and it can be pre-ordered as a full bottle when it has a bottle price.

// The opened bottle counts as out of stock for boxes once a box decant no
// longer fits
export const statusForVolume = (volumeMl: number) =>
  volumeMl >= BOX_SIZE_ML ? 'in_stock' : 'out_of_order';

export const validateVolume = (
  bottleMl: number,
  volumeMl: number
): string | null => {
  if (!Number.isInteger(bottleMl) || bottleMl <= 0)
    return 'Bottle size must be a whole number of ml above 0';
  if (!Number.isInteger(volumeMl) || volumeMl < 0)
    return 'Ml left cannot be negative';
  if (volumeMl > bottleMl) return 'Ml left cannot be more than the bottle size';
  return null;
};

// Empty means "not sold as a full bottle"
export const validateBottlePrice = (
  price: number | null | undefined
): string | null =>
  price == null || (Number.isFinite(price) && price > 0)
    ? null
    : 'Bottle price must be above 0, or empty to stop selling the bottle';
