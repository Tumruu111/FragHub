import { parseUnit, SMALLEST_SIZE_ML } from './decants';

// Pure checkout maths, kept apart from the database so it can be tested.

export interface CartLine {
  listing: { id: string; title: string; status: string; volumeMl: number };
  sizeMl: number;
  price: number;
  quantity: number;
}

// ['a:5', 'a:5', 'b:2'] → [{ a, 5ml, × 2 }, { b, 2ml, × 1 }]. Unparseable
// units are dropped; compare the line count to spot them.
export const groupUnits = (units: string[]) => {
  const counts = new Map<string, number>();
  for (const unit of units) counts.set(unit, (counts.get(unit) ?? 0) + 1);
  const lines = [...counts].flatMap(([unit, quantity]) => {
    const parsed = parseUnit(unit);
    return parsed ? [{ ...parsed, quantity }] : [];
  });
  return { lines, distinct: counts.size };
};

// Every size draws from the same bottle, so add up the ml each listing needs
// and compare it to what's left. Returns a message for the first shortfall.
export const findShortage = (lines: CartLine[]): string | null => {
  const mlWanted = new Map<string, number>();
  for (const { listing, sizeMl, quantity } of lines)
    mlWanted.set(
      listing.id,
      (mlWanted.get(listing.id) ?? 0) + sizeMl * quantity
    );

  const short = lines.find(
    ({ listing }) =>
      listing.status === 'out_of_order' ||
      listing.volumeMl < (mlWanted.get(listing.id) ?? 0)
  );
  if (!short) return null;

  const { title, volumeMl, status } = short.listing;
  return status === 'out_of_order' || volumeMl < SMALLEST_SIZE_ML
    ? `"${title}" is out of stock`
    : `Only ${volumeMl}ml of "${title}" left`;
};

export const cartTotal = (lines: Pick<CartLine, 'price' | 'quantity'>[]) =>
  lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
