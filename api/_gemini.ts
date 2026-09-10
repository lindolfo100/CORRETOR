import { GoogleGenAI } from "@google/genai";
import "dotenv/config";

export class MissingApiKeyError extends Error {
  status = 401;
  code = 401;
  requiresApiKey = true;

  constructor(message?: string) {
    super(
      message ||
      "Nenhuma chave da API do Gemini foi fornecida. Como esta aplicação roda na Vercel com chave individual por usuário, por favor insira sua chave gratuita do Google AI Studio nas configurações do aplicativo para analisar as redações."
    );
    this.name = "MissingApiKeyError";
  }
}

let cachedEnvAI: GoogleGenAI | null = null;

export function extractApiKey(req: any, body?: any): string | undefined {
  const headerKey = (req?.headers?.["x-gemini-api-key"] || req?.headers?.["x-api-key"]) as string | undefined;
  if (headerKey && headerKey.trim().length > 0) {
    return headerKey.trim();
  }
  if (body?.apiKey && typeof body.apiKey === "string" && body.apiKey.trim().length > 0) {
    return body.apiKey.trim();
  }
  const envKey = process.env.GEMINI_API_KEY;
  if (envKey && envKey !== "MY_GEMINI_API_KEY" && envKey.trim().length > 0) {
    return envKey.trim();
  }
  return undefined;
}

export function getAI(customApiKey?: string) {
  if (customApiKey && customApiKey.trim().length > 0) {
    return new GoogleGenAI({
      apiKey: customApiKey.trim(),
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }

  const envKey = process.env.GEMINI_API_KEY;
  if (envKey && envKey !== "MY_GEMINI_API_KEY" && envKey.trim().length > 0) {
    if (!cachedEnvAI) {
      cachedEnvAI = new GoogleGenAI({
        apiKey: envKey.trim(),
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
    return cachedEnvAI;
  }

  throw new MissingApiKeyError();
}

export function getNumericStatus(error: any): number {
  if (error instanceof MissingApiKeyError || error?.status === 401 || error?.code === 401) {
    return 401;
  }
  if (typeof error?.status === "number" && error.status >= 100 && error.status < 600) {
    return error.status;
  }
  if (typeof error?.code === "number" && error.code >= 100 && error.code < 600) {
    return error.code;
  }
  const statusStr = String(error?.status || "").toUpperCase();
  const codeStr = String(error?.code || "").toUpperCase();
  const msg = String(error?.message || "").toLowerCase();

  if (
    msg.includes("chave") ||
    msg.includes("api_key_invalid") ||
    msg.includes("api key not valid") ||
    msg.includes("api key is invalid") ||
    msg.includes("unauthenticated") ||
    statusStr === "UNAUTHENTICATED" ||
    codeStr === "401"
  ) {
    return 401;
  }
  if (statusStr === "UNAVAILABLE" || codeStr === "503" || msg.includes("503") || msg.includes("unavailable") || msg.includes("high demand")) {
    return 503;
  }
  if (statusStr === "RESOURCE_EXHAUSTED" || codeStr === "429" || msg.includes("429") || msg.includes("quota") || msg.includes("resource_exhausted")) {
    return 429;
  }
  if (statusStr === "INVALID_ARGUMENT" || codeStr === "400" || msg.includes("invalid_argument")) {
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

export async function parseRequestBody(req: any): Promise<any> {
  if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) {
    return req.body;
  }
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  if (Buffer.isBuffer(req.body)) {
    try {
      return JSON.parse(req.body.toString("utf-8"));
    } catch {
      return {};
    }
  }

  // If body is not yet parsed, read from readable stream
  if (typeof req.on === "function") {
    return new Promise((resolve) => {
      let data = "";
      req.on("data", (chunk: any) => {
        data += chunk;
      });
      req.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve({});
        }
      });
      req.on("error", () => {
        resolve({});
      });
    });
  }

  return {};
}
