type Cell = string | number | boolean | null | undefined;

/** Quotes a cell when it contains a comma, quote or newline (RFC 4180); embedded quotes are doubled. */
function escapeCell(value: Cell): string {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

/**
 * Serialises rows to RFC 4180 CSV with a header row in `columns` order. Formula-looking cells
 * (=, +, -, @) are prefixed with ' so spreadsheets don't execute user-submitted text.
 */
export function toCsv<T extends Record<string, Cell>>(rows: T[], columns: (keyof T & string)[]): string {
  const safe = (v: Cell) => (typeof v === "string" && /^[=+\-@]/.test(v) ? `'${v}` : v);
  const lines = [columns.join(","), ...rows.map((row) => columns.map((c) => escapeCell(safe(row[c]))).join(","))];
  return `${lines.join("\r\n")}\r\n`;
}
