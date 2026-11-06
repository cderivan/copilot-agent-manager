import * as fs from "fs";
import type { TranscriptRecord } from "../types";

/** Read the last `maxBytes` of a file, dropping a partially cut first line. */
export function readTail(filePath: string, maxBytes = 256 * 1024): string {
  let fd: number | undefined;
  try {
    fd = fs.openSync(filePath, "r");
    const size = fs.fstatSync(fd).size;
    const start = Math.max(0, size - maxBytes);
    const length = size - start;
    if (length <= 0) {
      return "";
    }
    const buffer = Buffer.alloc(length);
    fs.readSync(fd, buffer, 0, length, start);
    let text = buffer.toString("utf8");
    if (start > 0) {
      const newline = text.indexOf("\n");
      if (newline >= 0) {
        text = text.slice(newline + 1);
      }
    }
    return text;
  } catch {
    return "";
  } finally {
    if (fd !== undefined) {
      fs.closeSync(fd);
    }
  }
}

/** Read a whole file when it fits in `maxBytes`, otherwise only its tail. */
export function readText(filePath: string, maxBytes = 8 * 1024 * 1024): string {
  try {
    if (fs.statSync(filePath).size <= maxBytes) {
      return fs.readFileSync(filePath, "utf8");
    }
    return readTail(filePath, maxBytes);
  } catch {
    return "";
  }
}

/** Parse newline-delimited JSON, skipping blank or malformed lines. */
export function parseJsonl(raw: string): TranscriptRecord[] {
  const records: TranscriptRecord[] = [];
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }
    try {
      records.push(JSON.parse(trimmed) as TranscriptRecord);
    } catch {
      // Ignore partial lines and non-JSON noise.
    }
  }
  return records;
}
