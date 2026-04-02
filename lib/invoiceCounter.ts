import { Db } from "mongodb";

/**
 * Atomic invoice number generator using invoice_counters collection.
 * Returns a sequential number like "2026-0001", "2026-0002", etc.
 * MongoDB upsert + $inc prevents race conditions.
 */
export async function nextInvoiceNumber(db: Db, userId: string): Promise<{
  number: string;
  invoiceYear: number;
  invoiceIndex: number;
}> {
  const year = new Date().getFullYear();

  const result = await db.collection("invoice_counters").findOneAndUpdate(
    { userId, year },
    { $inc: { currentNumber: 1 } },
    { upsert: true, returnDocument: "after" }
  );

  const invoiceIndex: number = result?.currentNumber ?? 1;
  const number = `${year}-${String(invoiceIndex).padStart(4, "0")}`;

  return { number, invoiceYear: year, invoiceIndex };
}
