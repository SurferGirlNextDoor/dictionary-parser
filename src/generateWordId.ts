import crypto from 'crypto';

let wordOrderCounter = 0;
// Fixed base so that IDs are stable across runs when word order doesn't change.
const BASE_TIMESTAMP_MS = 1704067200000; // 2024-01-01T00:00:00.000Z

/**
 * Generates a UUID v7 for each word in dictionary order.
 * UUID v7 embeds a millisecond timestamp in the high bits, so IDs are
 * lexicographically sortable by the order words were encountered — which is
 * the standard DynamoDB mechanism for ordering by date.
 */
export function generateWordId(_spellingsString: string): string {
  const timestamp = BASE_TIMESTAMP_MS + wordOrderCounter;
  wordOrderCounter++;
  return generateUuidV7(timestamp);
}

function generateUuidV7(timestampMs: number): string {
  const random = crypto.randomBytes(10);
  const buf = Buffer.allocUnsafe(16);

  // Bytes 0-5: 48-bit Unix timestamp in milliseconds
  buf.writeUInt32BE(Math.floor(timestampMs / 0x10000), 0);
  buf.writeUInt16BE(timestampMs & 0xffff, 4);

  // Byte 6: version nibble (0x7) + 4 bits of rand_a
  buf[6] = 0x70 | (random[0] & 0x0f);
  // Byte 7: 8 bits of rand_a
  buf[7] = random[1];

  // Byte 8: variant bits (0b10xxxxxx) + 6 bits of rand_b
  buf[8] = 0x80 | (random[2] & 0x3f);
  // Bytes 9-15: remaining 56 bits of rand_b
  buf[9] = random[3];
  buf[10] = random[4];
  buf[11] = random[5];
  buf[12] = random[6];
  buf[13] = random[7];
  buf[14] = random[8];
  buf[15] = random[9];

  const hex = buf.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}
