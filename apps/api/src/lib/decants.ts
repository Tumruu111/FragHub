// Decant sizes every listing is sold in. A listing is one bottle, and every
// size draws from the same ml left in it. Change this list to add a size.
export const DECANT_SIZES_ML = [2, 5, 10];

export const SMALLEST_SIZE_ML = Math.min(...DECANT_SIZES_ML);

export interface SizePrice {
  sizeMl: number;
  price: number;
}

// How many decants of this size the remaining ml can still fill
export const availableUnits = (volumeMl: number, sizeMl: number) =>
  Math.floor(volumeMl / sizeMl);

// The listing is sold out once not even the smallest size fits
export const statusForVolume = (volumeMl: number) =>
  volumeMl >= SMALLEST_SIZE_ML ? 'in_stock' : 'out_of_order';

// Every listing must price exactly the fixed sizes, each above 0
export const validateSizePrices = (sizes: SizePrice[]): string | null => {
  const given = sizes.map((s) => s.sizeMl).sort((a, b) => a - b);
  const expected = [...DECANT_SIZES_ML].sort((a, b) => a - b);
  if (given.join() !== expected.join())
    return `Set a price for each size: ${expected.join('ml, ')}ml`;
  if (sizes.some((s) => !(s.price > 0)))
    return 'Every size needs a price above 0';
  return null;
};

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

// A payment stores one entry per decant bought, as "listingId:sizeMl", so
// 2 × 5ml of listing a is ['a:5', 'a:5'].
export const unitKey = (listingId: string, sizeMl: number) =>
  `${listingId}:${sizeMl}`;

export const parseUnit = (unit: string) => {
  const match = /^(.+):(\d+)$/.exec(unit);
  if (!match) return null;
  return { listingId: match[1], sizeMl: Number(match[2]) };
};
