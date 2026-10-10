import { extname } from "node:path";
import { Router } from "express";
import multer from "multer";
import { PDFParse } from "pdf-parse";

export const MAX_RESUME_UPLOAD_BYTES = 5 * 1024 * 1024;
export const MAX_RESUME_PAGES = 20;
export const MAX_RESUME_TEXT_LENGTH = 7000;

function uploadError(message, status, code) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_RESUME_UPLOAD_BYTES,
    files: 1,
    fields: 0,
    parts: 1,
    fieldNameSize: 64,
  },
  fileFilter(_req, file, callback) {
    if (file.mimetype !== "application/pdf" || extname(file.originalname).toLowerCase() !== ".pdf") {
      return callback(uploadError("Upload a PDF file with a .pdf extension.", 415, "UNSUPPORTED_FILE_TYPE"));
    }
    return callback(null, true);
  },
});

function hasPdfSignature(buffer) {
  const header = buffer.subarray(0, 1024).toString("latin1");
  const trailer = buffer.subarray(Math.max(0, buffer.length - 1024)).toString("latin1");
  return header.includes("%PDF-") && trailer.includes("%%EOF");
}

export function createResumeRouter() {
  const router = Router();

  router.post("/parse", upload.single("file"), async (req, res) => {
    const file = req.file;
    if (!file) {
      return res.status(400).json({
        error: "Choose a PDF resume to upload.",
        code: "FILE_REQUIRED",
      });
    }
    if (!hasPdfSignature(file.buffer)) {
      return res.status(422).json({
        error: "This file is not a valid PDF. Choose a readable PDF and try again.",
        code: "INVALID_PDF",
      });
    }

    let parser;
    try {
      parser = new PDFParse({ data: file.buffer });
      const info = await parser.getInfo();
      if (!info.total || info.total > MAX_RESUME_PAGES) {
        return res.status(413).json({
          error: `PDF resumes must contain between 1 and ${MAX_RESUME_PAGES} pages.`,
          code: "PDF_PAGE_LIMIT",
        });
      }

      const parsed = await parser.getText({ first: MAX_RESUME_PAGES });
      const text = parsed.text
        .replace(/(?:^|\n)\s*--\s+\d+\s+of\s+\d+\s+--\s*(?=\n|$)/g, "\n")
        .trim();
      if (!text) {
        return res.status(422).json({
          error: "No selectable text was found. Scanned PDFs and OCR are not supported yet.",
          code: "PDF_NO_TEXT",
        });
      }

      return res.json({
        text: text.slice(0, MAX_RESUME_TEXT_LENGTH),
        pages: info.total,
        truncated: text.length > MAX_RESUME_TEXT_LENGTH,
      });
    } catch {
      console.warn("PDF resume parsing failed for an uploaded document.");
      return res.status(422).json({
        error: "Zenvora AI couldn't read this PDF. It may be malformed, encrypted, or unsupported.",
        code: "PDF_PARSE_FAILED",
      });
    } finally {
      if (parser) {
        try {
          await parser.destroy();
        } catch {
          console.warn("PDF parser resources could not be released cleanly.");
        }
      }
    }
  });

  return router;
}
