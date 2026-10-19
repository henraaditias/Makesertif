const SHEET_ID_PATTERN = /\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/;
const GID_PATTERN = /[?&#]gid=(\d+)/;

export function sheetCsvUrl(link: string): string {
  const id = SHEET_ID_PATTERN.exec(link)?.[1];
  if (!id) {
    throw new Error(
      "Link tidak dikenali. Contoh format: https://docs.google.com/spreadsheets/d/ID_SHEET/edit",
    );
  }
  const gid = GID_PATTERN.exec(link)?.[1];
  const gidPart = gid ? `&gid=${gid}` : "";
  return `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv${gidPart}`;
}
