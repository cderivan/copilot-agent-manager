import * as fs from "fs";

export type SqliteValue = string | number | Uint8Array | null;

export interface SqliteRow {
  [column: string]: SqliteValue;
}

const MAGIC = "SQLite format 3\u0000";

interface Database {
  pageSize: number;
  usable: number;
  encoding: number;
  pages: Map<number, Buffer>;
}

interface Varint {
  value: number;
  length: number;
}

/** SQLite varint: 1-9 bytes, big-endian groups of 7 bits. */
function varint(buf: Buffer, offset: number): Varint {
  let value = 0;
  for (let index = 0; index < 9; index++) {
    const byte = buf[offset + index];
    if (byte === undefined) {
      return { value, length: index };
    }
    if (index === 8) {
      return { value: value * 256 + byte, length: 9 };
    }
    value = value * 128 + (byte & 0x7f);
    if ((byte & 0x80) === 0) {
      return { value, length: index + 1 };
    }
  }
  return { value, length: 9 };
}

function readInt(buf: Buffer, offset: number, size: number): number {
  let value = 0;
  for (let index = 0; index < size; index++) {
    value = value * 256 + (buf[offset + index] ?? 0);
  }
  if (size < 8) {
    const span = Math.pow(2, size * 8);
    if (value >= span / 2) {
      value -= span;
    }
  }
  return value;
}

function decodeText(buf: Buffer, offset: number, size: number, encoding: number): string {
  const slice = buf.subarray(offset, offset + size);
  if (encoding === 1) {
    return slice.toString("utf8");
  }
  const copy = Buffer.from(slice);
  if (copy.length % 2 !== 0) {
    return copy.toString("utf8");
  }
  if (encoding === 3) {
    copy.swap16();
  }
  return copy.toString("utf16le");
}

/** Decode a record: header of serial types, then the value body. */
function decodeRecord(payload: Buffer, encoding: number): SqliteValue[] {
  const header = varint(payload, 0);
  const serials: number[] = [];
  let cursor = header.length;
  while (cursor < header.value) {
    const serial = varint(payload, cursor);
    serials.push(serial.value);
    cursor += serial.length;
  }

  const values: SqliteValue[] = [];
  let body = header.value;
  for (const serial of serials) {
    if (serial === 0) {
      values.push(null);
    } else if (serial >= 1 && serial <= 6) {
      const size = [1, 2, 3, 4, 6, 8][serial - 1];
      values.push(readInt(payload, body, size));
      body += size;
    } else if (serial === 7) {
      values.push(payload.readDoubleBE(body));
      body += 8;
    } else if (serial === 8) {
      values.push(0);
    } else if (serial === 9) {
      values.push(1);
    } else if (serial >= 12) {
      const size = (serial - 12) >> 1;
      if (serial % 2 === 0) {
        values.push(new Uint8Array(payload.subarray(body, body + size)));
      } else {
        values.push(decodeText(payload, body, size, encoding));
      }
      body += size;
    }
  }
  return values;
}

/** WAL checksum: rolling sum over big- or little-endian 32-bit word pairs. */
function walChecksum(
  data: Buffer,
  s0: number,
  s1: number,
  bigEndian: boolean
): [number, number] {
  const words = Math.floor(data.length / 4);
  for (let index = 0; index + 1 < words; index += 2) {
    const x0 = bigEndian
      ? data.readUInt32BE(index * 4)
      : data.readUInt32LE(index * 4);
    const x1 = bigEndian
      ? data.readUInt32BE((index + 1) * 4)
      : data.readUInt32LE((index + 1) * 4);
    s0 = (s0 + x0 + s1) >>> 0;
    s1 = (s1 + x1 + s0) >>> 0;
  }
  return [s0, s1];
}

/**
 * Overlay committed WAL frames onto the page cache.
 *
 * Copilot's chat store often keeps recent rows only in `-wal`, so reading the
 * database file alone returns a stale view (or no tables at all).
 */
function applyWal(filePath: string, pageSize: number, pages: Map<number, Buffer>): void {
  let wal: Buffer;
  try {
    wal = fs.readFileSync(`${filePath}-wal`);
  } catch {
    return;
  }
  if (wal.length < 32) {
    return;
  }
  const magic = wal.readUInt32BE(0);
  if (magic !== 0x377f0682 && magic !== 0x377f0683) {
    return;
  }
  if (wal.readUInt32BE(8) !== pageSize) {
    return;
  }

  const salt1 = wal.readUInt32BE(16);
  const salt2 = wal.readUInt32BE(20);
  const stored0 = wal.readUInt32BE(24);
  const stored1 = wal.readUInt32BE(28);
  const bigHeader = walChecksum(wal.subarray(0, 24), 0, 0, true);
  const littleHeader = walChecksum(wal.subarray(0, 24), 0, 0, false);
  const bigEndian =
    bigHeader[0] === stored0 && bigHeader[1] === stored1
      ? true
      : littleHeader[0] === stored0 && littleHeader[1] === stored1
        ? false
        : magic === 0x377f0683;

  const frameSize = 24 + pageSize;
  const committed: Array<{ pageNo: number; data: Buffer }> = [];
  let pending: Array<{ pageNo: number; data: Buffer }> = [];
  let checksum = walChecksum(wal.subarray(0, 24), 0, 0, bigEndian);
  let offset = 32;

  while (offset + frameSize <= wal.length) {
    if (wal.readUInt32BE(offset + 8) !== salt1 || wal.readUInt32BE(offset + 12) !== salt2) {
      break;
    }
    checksum = walChecksum(wal.subarray(offset, offset + 8), checksum[0], checksum[1], bigEndian);
    checksum = walChecksum(
      wal.subarray(offset + 24, offset + frameSize),
      checksum[0],
      checksum[1],
      bigEndian
    );
    if (wal.readUInt32BE(offset + 16) !== checksum[0] || wal.readUInt32BE(offset + 20) !== checksum[1]) {
      break;
    }
    pending.push({
      pageNo: wal.readUInt32BE(offset),
      data: wal.subarray(offset + 24, offset + frameSize),
    });
    if (wal.readUInt32BE(offset + 4) !== 0) {
      committed.push(...pending);
      pending = [];
    }
    offset += frameSize;
  }

  for (const frame of committed) {
    pages.set(frame.pageNo, frame.data);
  }
}

/** Read one table-leaf cell, following the overflow chain when the row is large. */
function readLeafCell(db: Database, page: Buffer, offset: number): SqliteValue[] {
  const size = varint(page, offset);
  let cursor = offset + size.length;
  const rowid = varint(page, cursor);
  cursor += rowid.length;

  const total = size.value;
  const maxLocal = db.usable - 35;
  const minLocal = Math.floor(((db.usable - 12) * 32) / 255) - 23;
  let local = total;
  if (total > maxLocal) {
    local = minLocal + ((total - minLocal) % (db.usable - 4));
    if (local > maxLocal) {
      local = minLocal;
    }
  }

  const payload = Buffer.alloc(total);
  const copied = Math.max(0, Math.min(local, total, page.length - cursor));
  page.copy(payload, 0, cursor, cursor + copied);

  if (total > local) {
    let nextPage = page.readUInt32BE(cursor + local);
    let written = copied;
    while (written < total && nextPage) {
      const overflow = db.pages.get(nextPage);
      if (!overflow) {
        break;
      }
      const take = Math.min(db.usable - 4, total - written);
      overflow.copy(payload, written, 4, 4 + take);
      written += take;
      nextPage = overflow.readUInt32BE(0);
    }
  }

  return decodeRecord(payload, db.encoding);
}

function walkTable(
  db: Database,
  pageNo: number,
  rows: SqliteValue[][],
  seen: Set<number>
): void {
  if (seen.has(pageNo)) {
    return;
  }
  seen.add(pageNo);
  const page = db.pages.get(pageNo);
  if (!page) {
    return;
  }
  const header = pageNo === 1 ? 100 : 0;
  const type = page[header];
  const cellCount = page.readUInt16BE(header + 3);

  if (type === 5) {
    const pointerBase = header + 12;
    for (let index = 0; index < cellCount; index++) {
      const cell = page.readUInt16BE(pointerBase + index * 2);
      walkTable(db, page.readUInt32BE(cell), rows, seen);
    }
    walkTable(db, page.readUInt32BE(header + 8), rows, seen);
    return;
  }

  if (type !== 13) {
    return;
  }
  const pointerBase = header + 8;
  for (let index = 0; index < cellCount; index++) {
    const cell = page.readUInt16BE(pointerBase + index * 2);
    rows.push(readLeafCell(db, page, cell));
  }
}

/** Column names from a CREATE TABLE statement, in declaration order. */
function parseColumns(sql: string): string[] {
  const start = sql.indexOf("(");
  const end = sql.lastIndexOf(")");
  if (start < 0 || end <= start) {
    return [];
  }

  const parts: string[] = [];
  let current = "";
  let depth = 0;
  let quote = "";
  for (const char of sql.slice(start + 1, end)) {
    if (quote) {
      current += char;
      if (char === quote) {
        quote = "";
      }
      continue;
    }
    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      current += char;
      continue;
    }
    if (char === "[") {
      quote = "]";
      current += char;
      continue;
    }
    if (char === "(") {
      depth++;
    } else if (char === ")") {
      depth--;
    } else if (char === "," && depth === 0) {
      parts.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  if (current.trim()) {
    parts.push(current);
  }

  const columns: string[] = [];
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed || /^(primary|unique|check|foreign|constraint)\b/i.test(trimmed)) {
      continue;
    }
    const match = /^("([^"]+)"|`([^`]+)`|\[([^\]]+)\]|([A-Za-z_][\w$]*))/.exec(trimmed);
    if (!match) {
      continue;
    }
    columns.push(match[2] || match[3] || match[4] || match[5] || "");
  }
  return columns;
}

/**
 * Read whole tables from a SQLite database file without any native dependency.
 *
 * Read-only by design: it parses the file format directly, handles overflow
 * pages, and replays committed WAL frames.
 */
export function readTables(filePath: string, names: string[]): Map<string, SqliteRow[]> {
  const raw = fs.readFileSync(filePath);
  if (raw.length < 512 || raw.toString("latin1", 0, 16) !== MAGIC) {
    throw new Error(`Not a SQLite database: ${filePath}`);
  }

  let pageSize = raw.readUInt16BE(16);
  if (pageSize === 1) {
    pageSize = 65536;
  }
  if (pageSize < 512 || pageSize % 2 !== 0) {
    throw new Error(`Unsupported SQLite page size: ${pageSize}`);
  }

  const usable = pageSize - raw[20];
  const encoding = raw.readUInt32BE(56) || 1;
  const pages = new Map<number, Buffer>();
  const pageCount = Math.floor(raw.length / pageSize);
  for (let index = 0; index < pageCount; index++) {
    pages.set(index + 1, raw.subarray(index * pageSize, (index + 1) * pageSize));
  }

  const db: Database = { pageSize, usable, encoding, pages };
  applyWal(filePath, pageSize, pages);

  const masterRows: SqliteValue[][] = [];
  walkTable(db, 1, masterRows, new Set<number>());

  const result = new Map<string, SqliteRow[]>();
  for (const row of masterRows) {
    const type = row[0];
    const name = row[1];
    const rootPage = row[3];
    const sql = row[4];
    if (type !== "table" || typeof name !== "string" || typeof rootPage !== "number") {
      continue;
    }
    if (!names.includes(name) || typeof sql !== "string") {
      continue;
    }
    const columns = parseColumns(sql);
    const rawRows: SqliteValue[][] = [];
    walkTable(db, rootPage, rawRows, new Set<number>());
    result.set(
      name,
      rawRows.map((values) => {
        const object: SqliteRow = {};
        columns.forEach((column, index) => {
          object[column] = values[index] ?? null;
        });
        return object;
      })
    );
  }
  return result;
}
