import { createHmac } from "crypto";

// The QR code / ticket identity for a whole ticket (never a single leg).
//
// hash = HMAC-SHA256(secret, "<ticketId>:<hashVersion>")
//
// Bump Ticket.hashVersion on resale or name change and store the new hash
// in Ticket.qrHash. The old QR code then no longer matches anything in the
// database, so it stops working.
//
// TICKET_HASH_SECRET must be a long random string kept only in .env
// (never committed). Generate one with:
//   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
export function ticketHash(ticketId: string, hashVersion: number): string {
  const secret = process.env.TICKET_HASH_SECRET;
  if (!secret) {
    throw new Error("TICKET_HASH_SECRET is not set");
  }
  return createHmac("sha256", secret)
    .update(`${ticketId}:${hashVersion}`)
    .digest("hex");
}
