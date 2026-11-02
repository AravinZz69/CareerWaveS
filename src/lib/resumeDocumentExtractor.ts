import * as pdfjsLib from 'pdfjs-dist';
// Bundle the PDF.js worker as a local Vite asset URL so it works on Vercel production without CDN failures
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import mammoth from 'mammoth';

if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
}

export interface DocumentExtractionMetadata {
  fileName: string;
  fileType: 'pdf' | 'docx' | 'txt';
  fileSizeBytes: number;
  fileSizeLabel: string;
  charCount: number;
  wordCount: number;
  pageCount: number;
  usedOcr: boolean;
  ocrNotice?: string;
  isSingleColumn: boolean;
  hasTables: boolean;
  hasImagesOrTextBoxes: boolean;
  detectedFonts: string[];
  extractedCleanly: boolean;
}

export interface DocumentExtractionResult {
  rawText: string;
  metadata: DocumentExtractionMetadata;
}

export type ExtractionProgressCallback = (update: {
  stage: 'reading' | 'pdf_parse' | 'docx_parse' | 'ocr' | 'complete';
  message: string;
  progressPercent: number;
}) => void;

function countWords(text: string): number {
  const cleaned = (text || '').trim();
  if (!cleaned) return 0;
  return cleaned.split(/\s+/).filter(Boolean).length;
}

/**
 * Extracts text from a PDF file in the browser using pdfjs-dist with reading-order reconstruction,
 * single-column vs multi-column detection, font inspection, and automatic Tesseract.js OCR fallback
 * when a PDF yields under 200 characters (scanned PDF).
 */
async function extractFromPdfBuffer(
  arrayBuffer: ArrayBuffer,
  fileName: string,
  fileSizeBytes: number,
  onProgress?: ExtractionProgressCallback
): Promise<DocumentExtractionResult> {
  onProgress?.({
    stage: 'pdf_parse',
    message: `Reading PDF structure & text layers from "${fileName}"...`,
    progressPercent: 20,
  });

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    useSystemFonts: true,
  });
  const pdfDoc = await loadingTask.promise;
  const pageCount = pdfDoc.numPages || 1;

  const pageTexts: string[] = [];
  const detectedFontsSet = new Set<string>();
  let multiColumnPages = 0;
  let detectedTableLikeGrid = false;
  let hasImages = false;

  for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.0 });
    const pageWidth = viewport.width || 600;
    const textContent = await page.getTextContent();

    // Inspect font styles
    if (textContent.styles) {
      for (const style of Object.values(textContent.styles) as any[]) {
        if (style?.fontFamily) {
          detectedFontsSet.add(String(style.fontFamily));
        }
      }
    }

    // Check operator list for embedded raster images if available
    try {
      const opList = await page.getOperatorList();
      if (
        opList?.fnArray &&
        pdfjsLib.OPS &&
        opList.fnArray.some(
          (fn: number) =>
            fn === pdfjsLib.OPS.paintImageXObject || fn === pdfjsLib.OPS.paintInlineImageXObject
        )
      ) {
        hasImages = true;
      }
    } catch {
      // ignore operator inspection error
    }

    const items = (textContent.items || [])
      .filter((it: any) => typeof it.str === 'string' && it.str.length > 0)
      .map((it: any) => ({
        str: it.str as string,
        x: Number(it.transform?.[4] || 0),
        y: Number(it.transform?.[5] || 0),
        width: Number(it.width || 0),
        hasEOL: Boolean(it.hasEOL),
      }));

    if (items.length === 0) continue;

    // Group items into visual lines by Y coordinate (within 3.5pt tolerance)
    items.sort((a, b) => {
      if (Math.abs(b.y - a.y) > 3.5) return b.y - a.y;
      return a.x - b.x;
    });

    const lines: Array<{ y: number; items: typeof items }> = [];
    for (const item of items) {
      const lastLine = lines[lines.length - 1];
      if (!lastLine || Math.abs(lastLine.y - item.y) > 3.5) {
        lines.push({ y: item.y, items: [item] });
      } else {
        lastLine.items.push(item);
      }
    }

    let splitLinesOnPage = 0;
    let tableLikeLinesOnPage = 0;
    const reconstructedLines: string[] = [];

    for (const line of lines) {
      line.items.sort((a, b) => a.x - b.x);
      let lineStr = '';
      let prevEnd = -1;
      let largeGaps = 0;

      for (const seg of line.items) {
        if (prevEnd >= 0) {
          const gap = seg.x - prevEnd;
          if (gap > pageWidth * 0.18 && seg.x > pageWidth * 0.42) {
            largeGaps++;
          }
          if (gap > 4 && !lineStr.endsWith(' ') && !seg.str.startsWith(' ')) {
            lineStr += ' ';
          }
        }
        lineStr += seg.str;
        prevEnd = seg.x + seg.width;
      }

      if (largeGaps === 1) splitLinesOnPage++;
      if (largeGaps >= 2) tableLikeLinesOnPage++;
      reconstructedLines.push(lineStr.trimEnd());
    }

    if (lines.length > 10 && splitLinesOnPage / lines.length > 0.35) {
      multiColumnPages++;
    }
    if (tableLikeLinesOnPage >= 5) {
      detectedTableLikeGrid = true;
    }

    pageTexts.push(reconstructedLines.join('\n'));
  }

  let fullText = pageTexts.join('\n\n').trim();
  let usedOcr = false;
  let ocrNotice: string | undefined;

  // Step 2 Requirement: If a PDF returns under 200 characters, it is probably scanned — run OCR with tesseract.js
  if (fullText.length < 200 && typeof document !== 'undefined') {
    usedOcr = true;
    ocrNotice =
      'This PDF returned under 200 characters of selectable text (likely a scanned image PDF). OCR via Tesseract.js was automatically executed to extract text.';
    onProgress?.({
      stage: 'ocr',
      message: 'Scanned PDF detected (< 200 chars). Running Tesseract.js OCR on pages...',
      progressPercent: 40,
    });

    const Tesseract = await import('tesseract.js');
    const ocrPages: string[] = [];

    for (let pageNum = 1; pageNum <= Math.min(pageCount, 3); pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: 2.0 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;
        const { data } = await Tesseract.recognize(canvas, 'eng');
        if (data?.text?.trim()) {
          ocrPages.push(data.text.trim());
        }
      }
    }

    if (ocrPages.length > 0) {
      fullText = ocrPages.join('\n\n').trim();
    }
  }

  const charCount = fullText.length;
  const wordCount = countWords(fullText);

  if (charCount < 20) {
    throw new Error(
      'Unable to extract readable text from this PDF (extracted 0 words even after OCR). Please upload a text-based PDF, DOCX, or TXT resume.'
    );
  }

  return {
    rawText: fullText,
    metadata: {
      fileName,
      fileType: 'pdf',
      fileSizeBytes,
      fileSizeLabel: `${Math.max(1, Math.round(fileSizeBytes / 1024))} KB`,
      charCount,
      wordCount,
      pageCount,
      usedOcr,
      ocrNotice,
      isSingleColumn: multiColumnPages === 0,
      hasTables: detectedTableLikeGrid,
      hasImagesOrTextBoxes: hasImages || usedOcr,
      detectedFonts: Array.from(detectedFontsSet),
      extractedCleanly: !usedOcr && charCount >= 200,
    },
  };
}

/**
 * Extracts text and structural diagnostics from a DOCX file in the browser using mammoth.
 */
async function extractFromDocxBuffer(
  arrayBuffer: ArrayBuffer,
  fileName: string,
  fileSizeBytes: number,
  onProgress?: ExtractionProgressCallback
): Promise<DocumentExtractionResult> {
  onProgress?.({
    stage: 'docx_parse',
    message: `Extracting text & structure from DOCX "${fileName}" via Mammoth...`,
    progressPercent: 25,
  });

  const [rawResult, htmlResult] = await Promise.all([
    mammoth.extractRawText({ arrayBuffer }),
    mammoth.convertToHtml({ arrayBuffer }).catch(() => ({ value: '' })),
  ]);

  const fullText = (rawResult?.value || '')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const html = String(htmlResult?.value || '');
  const hasTables = /<table[\s>]/i.test(html);
  const hasImages = /<img[\s>]/i.test(html);

  const charCount = fullText.length;
  const wordCount = countWords(fullText);
  const estimatedPages = Math.max(1, Math.ceil(wordCount / 450));

  if (charCount < 20) {
    throw new Error(
      `The DOCX file "${fileName}" contains almost no extractable text (${charCount} characters). Please upload a complete resume.`
    );
  }

  return {
    rawText: fullText,
    metadata: {
      fileName,
      fileType: 'docx',
      fileSizeBytes,
      fileSizeLabel: `${Math.max(1, Math.round(fileSizeBytes / 1024))} KB`,
      charCount,
      wordCount,
      pageCount: estimatedPages,
      usedOcr: false,
      isSingleColumn: !hasTables,
      hasTables,
      hasImagesOrTextBoxes: hasImages,
      detectedFonts: ['Calibri', 'Arial'],
      extractedCleanly: true,
    },
  };
}

/**
 * Main browser entry point to extract text and layout metadata from any uploaded resume file (PDF, DOCX, TXT).
 */
export async function extractResumeDocumentInBrowser(
  file: File,
  onProgress?: ExtractionProgressCallback
): Promise<DocumentExtractionResult> {
  onProgress?.({
    stage: 'reading',
    message: `Reading "${file.name}" (${Math.max(1, Math.round(file.size / 1024))} KB)...`,
    progressPercent: 10,
  });

  const lowerName = file.name.toLowerCase();
  const isPdf = lowerName.endsWith('.pdf') || file.type === 'application/pdf';
  const isDocx =
    lowerName.endsWith('.docx') ||
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

  if (isPdf) {
    const buffer = await file.arrayBuffer();
    return extractFromPdfBuffer(buffer, file.name, file.size, onProgress);
  }

  if (isDocx) {
    const buffer = await file.arrayBuffer();
    return extractFromDocxBuffer(buffer, file.name, file.size, onProgress);
  }

  // Plain text (.txt / .md)
  const rawText = (await file.text()).replace(/\r\n/g, '\n').trim();
  const charCount = rawText.length;
  const wordCount = countWords(rawText);

  if (charCount < 20) {
    throw new Error(
      `The uploaded text file "${file.name}" is empty or too short (${charCount} characters).`
    );
  }

  return {
    rawText,
    metadata: {
      fileName: file.name,
      fileType: 'txt',
      fileSizeBytes: file.size,
      fileSizeLabel: `${Math.max(1, Math.round(file.size / 1024))} KB`,
      charCount,
      wordCount,
      pageCount: Math.max(1, Math.ceil(wordCount / 450)),
      usedOcr: false,
      isSingleColumn: true,
      hasTables: false,
      hasImagesOrTextBoxes: false,
      detectedFonts: ['System Mono'],
      extractedCleanly: true,
    },
  };
}
