// Server-only PDF parsing and chunking utilities.

/** Parse a PDF buffer and return the raw text */
export async function parsePdf(buffer: Buffer): Promise<string> {
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  return result.text;
}

/**
 * Split text into overlapping chunks suitable for embedding.
 * ~500 chars per chunk, 100 char overlap so context isn't lost at boundaries.
 */
export function chunkText(text: string, chunkSize = 500, overlap = 100): string[] {
  const cleaned = text.replace(/\s+/g, " ").trim();
  const chunks: string[] = [];
  let start = 0;

  while (start < cleaned.length) {
    const end = Math.min(start + chunkSize, cleaned.length);
    const chunk = cleaned.slice(start, end).trim();
    if (chunk.length > 20) {
      chunks.push(chunk);
    }
    if (end === cleaned.length) break;
    start = end - overlap;
  }

  return chunks;
}
