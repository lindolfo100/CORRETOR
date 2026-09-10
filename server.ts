import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import "dotenv/config";

let genAI: GoogleGenAI | null = null;

function getAI() {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      throw new Error("A chave da API Gemini não foi configurada corretamente. Verifique as configurações de segredos.");
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

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // API routes
  app.post("/api/ocr", async (req, res) => {
    try {
      const { image, mimeType, responseMimeType, prompt } = req.body;
      if (!image || !mimeType) {
        return res.status(400).json({ error: "Missing image data or mimeType" });
      }

      const apiKeyHeader = req.headers["x-gemini-api-key"] as string;
      const ai = apiKeyHeader ? new GoogleGenAI({ apiKey: apiKeyHeader }) : getAI();

      const config: any = {};
      if (responseMimeType) config.responseMimeType = responseMimeType;

      const aiText = prompt || "Extract all the text from this image exactly as it appears. Maintain the formatting, paragraphs, and structure where possible. Capture every word even if messy.";

      const requestedModel = req.body.model;
      const primaryModel = requestedModel === "gemini-flash-latest" ? "gemini-flash-latest" : "gemini-flash-lite-latest";
      const fallbackModel = primaryModel === "gemini-flash-lite-latest" ? "gemini-flash-latest" : "gemini-flash-lite-latest";

      // Using OCR with primaryModel, graceful switch to fallback on high demand/quota
      try {
        const response = await ai.models.generateContent({
          model: primaryModel,
          contents: [
            {
              inlineData: {
                data: image,
                mimeType: mimeType
              }
            },
            { text: aiText }
          ],
          config
        });
        return res.json({ text: response.text });
      } catch (_err: any) {
        console.log(`[OCR] Alternando temporariamente para ${fallbackModel} (${_err?.message || 'alta demanda'})`);
        const response = await ai.models.generateContent({
          model: fallbackModel,
          contents: [
            {
              inlineData: {
                data: image,
                mimeType: mimeType
              }
            },
            { text: aiText }
          ],
          config
        });
        return res.json({ text: response.text });
      }
    } catch (error: any) {
      const status = error?.status || (error?.message?.includes('503') ? 503 : (error?.message?.includes('429') ? 429 : 500));
      res.status(status).json({ error: error?.message || "Falha ao processar OCR da imagem" });
    }
  });

  app.post("/api/analyze", async (req, res) => {
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

      const primaryModel = model === "gemini-flash-latest" ? "gemini-flash-latest" : "gemini-flash-lite-latest";
      const fallbackModel = primaryModel === "gemini-flash-latest" ? "gemini-flash-lite-latest" : "gemini-flash-latest";

      // Attempt analysis with primary model, seamless fallback if 503 or 429 occurs
      try {
        const response = await ai.models.generateContent({
          model: primaryModel,
          contents: parts,
          config
        });

        return res.json({ text: response.text });
      } catch (_primaryError: any) {
        console.log(`[Analyze] Alternando temporariamente para ${fallbackModel} (${_primaryError?.message || 'alta demanda'})`);
        const response = await ai.models.generateContent({
          model: fallbackModel,
          contents: parts,
          config
        });
        return res.json({ text: response.text });
      }
    } catch (error: any) {
      const status = error?.status || (error?.message?.includes('503') ? 503 : (error?.message?.includes('429') ? 429 : 500));
      res.status(status).json({ error: error?.message || "Falha ao analisar redação com IA" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
