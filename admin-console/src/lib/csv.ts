// Tiny dependency-free CSV builder + browser download helper. Shared by the "Export CSV" buttons
// on the list pages and the `csvDownload` helper in components/ui.tsx.

export interface CsvColumn<T> {
  key: keyof T | string;
  header: string;
  /** Optional formatter; receives the row so derived/joined columns are possible. */
  value?: (row: T) => unknown;
}

function escapeField(raw: unknown): string {
  const s = raw == null ? "" : String(raw);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const head = columns.map((c) => escapeField(c.header)).join(",");
  const body = rows.map((row) =>
    columns
      .map((c) => {
        const v = c.value ? c.value(row) : (row as Record<string, unknown>)[c.key as string];
        return escapeField(v);
      })
      .join(","),
  );
  return [head, ...body].join("\r\n");
}

export function download(filename: string, text: string, mime = "text/csv;charset=utf-8"): void {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function csvDownload<T>(filename: string, rows: T[], columns: CsvColumn<T>[]): void {
  download(filename, toCsv(rows, columns));
}
