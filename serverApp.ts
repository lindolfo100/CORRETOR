import express from "express";
import "dotenv/config";
import ocrHandler from "./api/ocr";
import analyzeHandler from "./api/analyze";
import healthHandler from "./api/health";
import validateKeyHandler from "./api/validate-key";
import { getAI, getNumericStatus, generateContentWithFallback } from "./api/_gemini";

export { getAI, getNumericStatus, generateContentWithFallback };

export function createExpressApp() {
  const app = express();

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // API endpoints (mounted on both /api and /)
  app.all("/api/health", (req, res) => healthHandler(req, res));
  app.all("/health", (req, res) => healthHandler(req, res));

  app.all("/api/validate-key", (req, res) => validateKeyHandler(req, res));
  app.all("/validate-key", (req, res) => validateKeyHandler(req, res));

  app.all("/api/ocr", (req, res) => ocrHandler(req, res));
  app.all("/ocr", (req, res) => ocrHandler(req, res));

  app.all("/api/analyze", (req, res) => analyzeHandler(req, res));
  app.all("/analyze", (req, res) => analyzeHandler(req, res));

  // Dedicated JSON error handling for /api routes to prevent HTML responses
  app.use("/api", (err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    void _next;
    console.error("[API Middleware Error]", err);
    const status = getNumericStatus(err);
    res.status(status).json({
      error: err?.message || "Erro no processamento da API"
    });
  });

  return app;
}

const app = createExpressApp();
export default app;
