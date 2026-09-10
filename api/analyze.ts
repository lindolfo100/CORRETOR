import { getAI, getNumericStatus, generateContentWithFallback, parseRequestBody } from "./_gemini";

export default async function handler(req: any, res: any) {
  // CORS & headers
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader("Access-Control-Allow-Headers", "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-gemini-api-key");
  res.setHeader("Content-Type", "application/json");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const body = await parseRequestBody(req);
    const { prompt, systemInstruction, image, mimeType, responseMimeType, responseSchema, model } = body;

    const parts: any[] = [{ text: prompt }];
    if (image && mimeType) {
      parts.push({
        inlineData: {
          data: image,
          mimeType: mimeType
        }
      });
    }

    const apiKeyHeader = (req.headers && req.headers["x-gemini-api-key"]) as string | undefined;
    const ai = getAI(apiKeyHeader);

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

    return res.status(200).json({ text: response.text });
  } catch (error: any) {
    const status = getNumericStatus(error);
    const isOverloaded = status === 503;
    const errorMsg = isOverloaded 
      ? "Os modelos do Gemini estão com alta demanda temporária. Aguarde alguns segundos para tentar novamente."
      : (error?.message || "Falha ao analisar redação com IA");
    return res.status(status).json({ error: errorMsg });
  }
}
