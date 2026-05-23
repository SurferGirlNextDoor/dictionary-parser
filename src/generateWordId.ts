import crypto from 'crypto';

let wordOrderCounter = 0;
// Fixed base so that IDs are stable across runs when word order doesn't change.
const BASE_TIMESTAMP_MS = 1704067200000; // 2024-01-01T00:00:00.000Z

/**
 * Generates a UUID v7 for each word in dictionary order.
 * UUID v7 embeds a millisecond timestamp in the high bits, so IDs are
 * lexicographically sortable by the order words were encountered — which is
 * the standard DynamoDB mechanism for ordering by date.
 *
 * The random portion is derived from SHA-256 of the spellingsString so that
 * IDs are deterministic and stable across parser runs.
 */
export function generateWordId(spellingsString: string): string {
  const timestamp = BASE_TIMESTAMP_MS + wordOrderCounter;
  wordOrderCounter++;
  return generateUuidV7(timestamp, spellingsString);
}

function generateUuidV7(timestampMs: number, spellingsString: string): string {
  const hash = crypto.createHash('sha256').update(spellingsString).digest();
  const buf = Buffer.allocUnsafe(16);

  // Bytes 0-5: 48-bit Unix timestamp in milliseconds
  buf.writeUInt32BE(Math.floor(timestampMs / 0x10000), 0);
  buf.writeUInt16BE(timestampMs & 0xffff, 4);

  // Byte 6: version nibble (0x7) + 4 bits from hash
  buf[6] = 0x70 | (hash[0] & 0x0f);
  // Byte 7: 8 bits from hash
  buf[7] = hash[1];

  // Byte 8: variant bits (0b10xxxxxx) + 6 bits from hash
  buf[8] = 0x80 | (hash[2] & 0x3f);
  // Bytes 9-15: remaining 56 bits from hash
  buf[9] = hash[3];
  buf[10] = hash[4];
  buf[11] = hash[5];
  buf[12] = hash[6];
  buf[13] = hash[7];
  buf[14] = hash[8];
  buf[15] = hash[9];

  const hex = buf.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}
