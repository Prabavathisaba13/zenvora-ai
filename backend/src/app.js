import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { createChatRouter } from "./chat.js";
import { createResumeRouter, MAX_RESUME_UPLOAD_BYTES } from "./resume.js";

const DEVELOPMENT_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5174",
];

function allowedOrigins() {
  const configuredOrigins = (process.env.FRONTEND_ORIGIN || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  if (process.env.NODE_ENV === "production") return configuredOrigins;
  return [...new Set([...configuredOrigins, ...DEVELOPMENT_ORIGINS])];
}

export function createApp(options = {}) {
  const app = express();
  const origins = allowedOrigins();

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(cors({
    origin(origin, callback) {
      if (!origin || origins.includes(origin)) return callback(null, true);
      return callback(new Error("Origin is not allowed by CORS."));
    },
  }));
  app.use(express.json({ limit: "64kb" }));
  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
  app.use("/api/chat", rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { error: "You've reached the request limit. Please wait a few minutes and try again.", code: "RATE_LIMITED" },
  }), createChatRouter(options));
  app.use("/api/resume", rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { error: "Resume upload limit reached. Please wait before trying again.", code: "UPLOAD_RATE_LIMITED" },
  }), createResumeRouter());

  app.use((error, _req, res, _next) => {
    if (error?.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        error: `PDF resumes must be ${Math.floor(MAX_RESUME_UPLOAD_BYTES / (1024 * 1024))} MB or smaller.`,
        code: "UPLOAD_TOO_LARGE",
      });
    }
    if (error?.code === "LIMIT_FILE_COUNT" || error?.code === "LIMIT_FIELD_COUNT" || error?.code === "LIMIT_UNEXPECTED_FILE" || error?.code === "LIMIT_PART_COUNT") {
      return res.status(400).json({ error: "Upload one PDF file at a time.", code: "INVALID_UPLOAD" });
    }
    if (error?.status && error?.code) {
      return res.status(error.status).json({ error: error.message, code: error.code });
    }
    if (error?.type === "entity.too.large") {
      return res.status(413).json({ error: "The request is too large. Shorten the conversation and try again.", code: "REQUEST_TOO_LARGE" });
    }
    if (error instanceof SyntaxError && "body" in error) {
      return res.status(400).json({ error: "The request body must be valid JSON.", code: "INVALID_JSON" });
    }
    if (error?.message === "Origin is not allowed by CORS.") {
      return res.status(403).json({ error: "This origin is not permitted to use the Zenvora AI API.", code: "CORS_REJECTED" });
    }
    console.error("Unhandled API error.", error);
    return res.status(500).json({ error: "An unexpected server error occurred.", code: "INTERNAL_ERROR" });
  });

  return app;
}
