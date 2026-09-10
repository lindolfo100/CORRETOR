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
    const { image, mimeType, responseMimeType, prompt, model } = body;

    if (!image || !mimeType) {
      return res.status(400).json({ error: "Missing image data or mimeType" });
    }

    const apiKeyHeader = (req.headers && req.headers["x-gemini-api-key"]) as string | undefined;
    const ai = getAI(apiKeyHeader);

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

    return res.status(200).json({ text: response.text });
  } catch (error: any) {
    const status = getNumericStatus(error);
    const isOverloaded = status === 503;
    const errorMsg = isOverloaded 
      ? "Os modelos do Gemini estão com alta demanda no momento. Por favor, aguarde alguns segundos e tente novamente."
      : (error?.message || "Falha ao processar OCR da imagem");
    return res.status(status).json({ error: errorMsg });
  }
}
