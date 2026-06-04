"use client";

/**
 * Extracts plain text from a PDF entirely in the browser.
 *
 * Text extraction (rather than sending the raw PDF to each provider) keeps the
 * input identical across every model, since native PDF support differs widely
 * between providers — which matters for a head-to-head benchmark.
 */
export async function extractPdfText(file: File): Promise<string> {
  // Dynamic import keeps pdf.js out of the server bundle — it touches the DOM.
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();

  const buffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buffer }).promise;
  const pages: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .replace(/\s+\n/g, "\n")
      .trim();
    if (text) {
      pages.push(text);
    }
  }

  await pdf.cleanup();
  return pages.join("\n\n");
}
