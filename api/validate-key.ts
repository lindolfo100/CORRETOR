import { getAI, extractApiKey, parseRequestBody } from "./_gemini";

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader("Access-Control-Allow-Headers", "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-gemini-api-key, x-api-key");
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
    const apiKey = extractApiKey(req, body);

    if (!apiKey) {
      return res.status(400).json({ valid: false, error: "Nenhuma chave foi fornecida." });
    }

    const ai = getAI(apiKey);
    // Lightweight ping to verify authentication
    await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: [{ text: "Ok" }],
      config: {
        maxOutputTokens: 5,
        temperature: 0.0,
      }
    });

    return res.status(200).json({ valid: true, message: "Chave do Gemini validada com sucesso!" });
  } catch (error: any) {
    const msg = String(error?.message || "").toLowerCase();
    let userMsg = "Não foi possível validar a chave da API do Gemini.";
    if (msg.includes("api key not valid") || msg.includes("api_key_invalid") || msg.includes("invalid argument")) {
      userMsg = "Chave de API inválida. Verifique se você copiou o código completo gerado no Google AI Studio.";
    } else if (msg.includes("quota") || msg.includes("429")) {
      userMsg = "Chave válida, porém atingiu o limite temporário de requisições do Google (Quota).";
    } else if (msg.includes("503") || msg.includes("unavailable")) {
      userMsg = "Chave válida, mas os servidores do Gemini estão com alta demanda no momento.";
    }

    return res.status(400).json({ valid: false, error: userMsg });
  }
}
