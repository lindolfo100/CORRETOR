import express from "express";
import { GoogleGenAI } from "@google/genai";
import "dotenv/config";

let genAI: GoogleGenAI | null = null;

export function getAI() {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      throw new Error("A chave da API Gemini não foi configurada corretamente. Verifique as variáveis de ambiente (GEMINI_API_KEY).");
    }
    genAI = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return genAI;
}

export function getNumericStatus(error: any): number {
  if (typeof error?.status === "number" && error.status >= 100 && error.status < 600) {
    return error.status;
  }
  if (typeof error?.code === "number" && error.code >= 100 && error.code < 600) {
    return error.code;
  }
  const statusStr = String(error?.status || "").toUpperCase();
  const codeStr = String(error?.code || "").toUpperCase();
  const msg = String(error?.message || "").toLowerCase();

  if (statusStr === "UNAVAILABLE" || codeStr === "503" || msg.includes("503") || msg.includes("unavailable") || msg.includes("high demand")) {
    return 503;
  }
  if (statusStr === "RESOURCE_EXHAUSTED" || codeStr === "429" || msg.includes("429") || msg.includes("quota") || msg.includes("resource_exhausted")) {
    return 429;
  }
  if (statusStr === "INVALID_ARGUMENT" || codeStr === "400" || msg.includes("invalid_argument") || msg.includes("api key not valid")) {
    return 400;
  }
  return 500;
}

const VALID_MODELS = ["gemini-3.8-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];

export async function generateContentWithFallback(
  ai: GoogleGenAI,
  requestedModel: string | undefined,
  contents: any,
  config: any
) {
  let cleanModel = requestedModel;
  if (!cleanModel || cleanModel === "gemini-flash-lite-latest") {
    cleanModel = "gemini-3.8-flash";
  }

  const modelQueue = [
    cleanModel,
    ...VALID_MODELS
  ].filter((m, idx, arr) => arr.indexOf(m) === idx);

  let lastError: any = null;

  for (const modelName of modelQueue) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents,
        config
      });
      return response;
    } catch (err: any) {
      lastError = err;
      const status = getNumericStatus(err);
      console.warn(`[Gemini API] Falha no modelo ${modelName} (${status}: ${err?.message || "demanda alta"}). Tentando próximo modelo...`);
      if (status !== 503 && status !== 429) {
        throw err;
      }
    }
  }

  throw lastError;
}

export function createExpressApp() {
  const app = express();

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  const apiRouter = express.Router();

  // Health check
  apiRouter.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "enem-ai-api" });
  });

  // OCR Endpoint
  apiRouter.post("/ocr", async (req, res) => {
    try {
      const { image, mimeType, responseMimeType, prompt, model } = req.body;
      if (!image || !mimeType) {
        return res.status(400).json({ error: "Missing image data or mimeType" });
      }

      const apiKeyHeader = req.headers["x-gemini-api-key"] as string;
      const ai = apiKeyHeader ? new GoogleGenAI({ apiKey: apiKeyHeader }) : getAI();

      const config: any = {};
      if (responseMimeType) config.responseMimeType = responseMimeType;

      const aiText = prompt || "Extract all the text from this image exactly as it appears. Maintain the formatting, paragraphs, and structure where possible. Capture every word even if messy.";

      const response = await generateContentWithFallback(
        ai,
        model || "gemini-3.8-flash",
        [
          {
            inlineData: {
              data: image,
              mimeType: mimeType
            }
          },
          { text: aiText }
        ],
        config
      );

      return res.json({ text: response.text });
    } catch (error: any) {
      const status = getNumericStatus(error);
      const isOverloaded = status === 503;
      const errorMsg = isOverloaded 
        ? "Os modelos do Gemini estão com alta demanda no momento. Por favor, aguarde alguns segundos e tente novamente."
        : (error?.message || "Falha ao processar OCR da imagem");
      res.status(status).json({ error: errorMsg });
    }
  });

  // Analyze Endpoint
  apiRouter.post("/analyze", async (req, res) => {
    try {
      const { prompt, systemInstruction, image, mimeType, responseMimeType, responseSchema, model } = req.body;
      
      const parts: any[] = [{ text: prompt }];
      if (image && mimeType) {
        parts.push({
          inlineData: {
            data: image,
            mimeType: mimeType
          }
        });
      }

      const apiKeyHeader = req.headers["x-gemini-api-key"] as string;
      const ai = apiKeyHeader ? new GoogleGenAI({ apiKey: apiKeyHeader }) : getAI();

      const config: any = {
        systemInstruction: systemInstruction
      };
      if (responseMimeType) config.responseMimeType = responseMimeType;
      if (responseSchema) config.responseSchema = responseSchema;
      config.temperature = 0.0;

      const response = await generateContentWithFallback(
        ai,
        model || "gemini-3.8-flash",
        parts,
        config
      );

      return res.json({ text: response.text });
    } catch (error: any) {
      const status = getNumericStatus(error);
      const isOverloaded = status === 503;
      const errorMsg = isOverloaded 
        ? "Os modelos do Gemini estão com alta demanda temporária. Aguarde alguns segundos para tentar novamente."
        : (error?.message || "Falha ao analisar redação com IA");
      res.status(status).json({ error: errorMsg });
    }
  });

  // Mount at both /api and / so it works seamlessly with and without route rewrite prefixes
  app.use("/api", apiRouter);
  app.use("/", apiRouter);

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
