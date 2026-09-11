import { extractApiKey, parseRequestBody } from "./_gemini.ts";

export default async function handler(req: any, res: any) {
  try {
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
      return res.status(405).json({ valid: false, error: "Method Not Allowed" });
    }

    const body = await parseRequestBody(req);
    const apiKey = extractApiKey(req, body);

    if (!apiKey) {
      return res.status(400).json({ valid: false, error: "Nenhuma chave foi fornecida." });
    }

    // Ping Google Generative Language API directly for fastest, most reliable key validation
    const testUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`;
    const googleRes = await fetch(testUrl, {
      method: "GET",
      headers: { "Accept": "application/json" }
    });

    if (!googleRes.ok) {
      const errData = await googleRes.json().catch(() => ({}));
      const rawMsg = String(errData?.error?.message || "").toLowerCase();

      let userMsg = "Chave de API inválida. Verifique se copiou a chave correta no Google AI Studio.";
      if (rawMsg.includes("quota") || rawMsg.includes("resource_exhausted") || googleRes.status === 429) {
        userMsg = "Chave válida, porém atingiu o limite temporário de requisições do Google (Quota).";
      } else if (rawMsg.includes("suspended") || rawMsg.includes("disabled")) {
        userMsg = "Esta chave da API do Gemini ou o projeto associado foi desativado no Google Cloud.";
      }

      return res.status(400).json({ valid: false, error: userMsg });
    }

    return res.status(200).json({ valid: true, message: "Chave do Gemini validada com sucesso!" });
  } catch (error: any) {
    console.error("[validate-key error]", error);
    return res.status(500).json({
      valid: false,
      error: error?.message || "Erro interno ao validar a chave."
    });
  }
}
