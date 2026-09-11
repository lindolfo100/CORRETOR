import { EssayAnalysis } from "../types";
import { essayAnalysisSchema } from "../lib/aiSchema";

/** Modelo Gemini Pro para análise profunda — altere aqui para atualizar globalmente */
export async function fetchLanguageToolInsights(text: string): Promise<{ text: string; correction: string; explanation: string }[]> {
  try {
    const response = await fetch('https://api.languagetool.org/v2/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        text,
        language: 'pt-BR',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error('LanguageTool API error:', response.status, errorText);
      return [];
    }

    const raw = await response.text();
    let data: any = null;
    try {
      data = JSON.parse(raw);
    } catch {
      return [];
    }

    if (!data?.matches) return [];

    return data.matches.map((m: any) => {
      const matchText = text.substring(m.context.offset, m.context.offset + m.context.length);
      const correction = m.replacements.length > 0 ? m.replacements[0].value : 'Revisar';
      return {
        text: matchText,
        correction: correction,
        explanation: m.message
      };
    });
  } catch (err) {
    console.error('LanguageTool falhou', err);
    return [];
  }
}

function getSavedModel(fallback: string = 'gemini-3.8-flash'): string {
  if (typeof window === 'undefined') return fallback;
  const stored = localStorage.getItem('user_gemini_model');
  if (!stored || stored === 'gemini-flash-lite-latest') {
    return fallback;
  }
  return stored;
}

async function safeParseResponse(response: Response, defaultErrorText: string): Promise<any> {
  const rawText = await response.text();
  let parsedJson: any = null;
  try {
    parsedJson = JSON.parse(rawText);
  } catch {
    parsedJson = null;
  }

  if (!response.ok) {
    let errorMsg = `${defaultErrorText} (HTTP ${response.status})`;
    let requiresApiKey = response.status === 401;

    if (parsedJson && typeof parsedJson === 'object' && parsedJson.error) {
      errorMsg = parsedJson.error;
      if (parsedJson.requiresApiKey || response.status === 401) {
        requiresApiKey = true;
      }
    } else {
      const stripped = rawText.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();

      if (rawText.includes('A server error') || rawText.includes('FUNCTION_INVOCATION')) {
        errorMsg = 'Falha no servidor da Vercel (FUNCTION_INVOCATION_FAILED). Você pode inserir sua chave gratuita do Google AI Studio nas configurações do aplicativo para corrigir diretamente pelo navegador.';
        requiresApiKey = true;
      } else if (response.status === 401 || stripped.includes('chave') || rawText.includes('GEMINI_API_KEY')) {
        errorMsg = 'Chave da API do Gemini não configurada ou inválida. Insira sua chave gratuita do Google AI Studio nas configurações para continuar.';
        requiresApiKey = true;
      } else if (response.status === 413 || rawText.includes('413') || rawText.includes('Payload Too Large')) {
        errorMsg = 'A imagem é muito pesada para envio (limite de 4.5MB). Tente diminuir a resolução ou comprimir a foto antes de enviar.';
      } else if (rawText.includes('503') || rawText.includes('UNAVAILABLE') || rawText.includes('high demand') || response.status === 503) {
        errorMsg = 'Os servidores do Gemini estão com alta demanda momentânea. Aguarde alguns segundos e tente novamente.';
      } else if (rawText.includes('429') || response.status === 429) {
        errorMsg = 'Limite de requisições por minuto atingido. Aguarde um instante.';
      } else if (stripped.length > 0 && stripped.length < 250 && !stripped.toLowerCase().includes('internal server error')) {
        errorMsg = stripped;
      }
    }

    const err: any = new Error(errorMsg);
    err.status = response.status;
    err.requiresApiKey = requiresApiKey;
    err.rawResponse = rawText;
    throw err;
  }

  if (parsedJson !== null) {
    return parsedJson;
  }

  if (rawText.trim().startsWith('<')) {
    throw new Error('O servidor retornou uma resposta em formato inesperado (HTML). Verifique se o servidor está ativo.');
  }

  return { text: rawText };
}

export async function validateGeminiApiKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const trimmed = apiKey.trim();
    if (!trimmed) {
      return { valid: false, error: 'Por favor, insira o código da sua chave de API.' };
    }

    // 1. Tentar validação no backend via /api/validate-key
    try {
      const response = await fetch('/api/validate-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-gemini-api-key': trimmed,
        },
        body: JSON.stringify({ apiKey: trimmed })
      });

      const rawText = await response.text();
      let data: any = null;
      try {
        data = JSON.parse(rawText);
      } catch {
        // Resposta não é JSON (ex: erro HTML ou Vercel plain text)
      }

      if (data && typeof data === 'object') {
        if (response.ok && data.valid) {
          return { valid: true };
        }
        if (data.error && !rawText.includes('A server error') && response.status !== 500) {
          return { valid: false, error: data.error };
        }
      }
    } catch {
      // Backend offline ou falha de rede; tenta validação direta no Google AI Studio
    }

    // 2. Validação direta via Google Generative Language REST API (fallback resiliente para Vercel)
    const directUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(trimmed)}`;
    const directRes = await fetch(directUrl);
    const directText = await directRes.text();
    let directData: any = null;
    try {
      directData = JSON.parse(directText);
    } catch {
      // ignore
    }

    if (directRes.ok && directData?.models) {
      return { valid: true };
    }

    const rawError = String(directData?.error?.message || '').toLowerCase();
    if (rawError.includes('api key not valid') || rawError.includes('api_key_invalid') || directRes.status === 400) {
      return { valid: false, error: 'Chave de API inválida. Verifique se você copiou o código completo gerado no Google AI Studio.' };
    }
    if (rawError.includes('quota') || directRes.status === 429) {
      return { valid: false, error: 'Chave válida, porém atingiu o limite temporário de requisições do Google (Quota).' };
    }
    if (directData?.error?.message) {
      return { valid: false, error: directData.error.message };
    }

    return { valid: false, error: 'Não foi possível validar a chave da API do Gemini. Verifique sua conexão com a internet.' };
  } catch (err: any) {
    return { valid: false, error: err?.message || 'Falha ao validar a chave da API do Gemini.' };
  }
}

async function directGeminiOCR(
  apiKey: string,
  base64Image: string,
  mimeType: string,
  promptText: string,
  model: string
): Promise<string> {
  const cleanImage = base64Image.split(',')[1] || base64Image;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { inlineData: { data: cleanImage, mimeType: mimeType || 'image/jpeg' } },
          { text: promptText }
        ]
      }]
    })
  });
  const rawText = await res.text();
  let data: any = null;
  try {
    data = JSON.parse(rawText);
  } catch {
    // ignore
  }

  if (!res.ok) {
    throw new Error(data?.error?.message || `Erro na API do Gemini (${res.status})`);
  }
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "Transcrição vazia";
}

async function directGeminiAnalysis(
  apiKey: string,
  base64Image: string,
  mimeType: string,
  prompt: string,
  systemInstruction: string,
  model: string
): Promise<string> {
  const cleanImage = base64Image.split(',')[1] || base64Image;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const parts: any[] = [{ text: prompt }];
  if (cleanImage) {
    parts.push({
      inlineData: {
        data: cleanImage,
        mimeType: mimeType || 'image/jpeg'
      }
    });
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents: [{ parts }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: essayAnalysisSchema,
        temperature: 0.0
      }
    })
  });
  const rawText = await res.text();
  let data: any = null;
  try {
    data = JSON.parse(rawText);
  } catch {
    // ignore
  }

  if (!res.ok) {
    throw new Error(data?.error?.message || `Erro na API do Gemini (${res.status})`);
  }
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
}

export async function processEssayImageOCR(base64Image: string, mimeType: string = 'image/jpeg'): Promise<string> {
  const attemptOCR = async (retries = 3, delay = 2000): Promise<string> => {
    const localKey = typeof window !== 'undefined' ? localStorage.getItem('user_gemini_api_key') : null;
    const promptText = `Você é um especialista em leitura de textos manuscritos (OCR manual).
Sua tarefa é transcrever com máxima fidelidade o texto manuscrito presente nesta imagem.

REGRAS ESTRITAS:
1. Transcreva EXATAMENTE o que está escrito, mantendo todos os erros ortográficos e gramaticais originais.
2. Separe os parágrafos com quebras de linha duplas (\n\n). Identifique novos parágrafos pelo recuo (espaçamento) no início da linha.
3. Ignore trechos que foram COMPLETAMENTE riscados/rasurados pelo aluno — mas mantenha trechos parcialmente legíveis.
4. Mantenha a pontuação original mesmo se incorreta.
5. Não adicione título, comentário, numeração de parágrafos ou qualquer anotação extra.
6. Se uma palavra estiver ilegível, transcreva o que for possível e indique com [ilegível] apenas se absolutamente impossível de decifrar.
7. Preste atenção especial a letras que se confundem em manuscrito: a/o, n/m, u/v, l/t, r/n.
8. Retorne SOMENTE o texto bruto transcrito, sem formatação adicional.`;

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (localKey) {
        headers["x-gemini-api-key"] = localKey;
      }

      const response = await fetch('/api/ocr', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          image: base64Image.split(',')[1] || base64Image,
          mimeType: mimeType || 'image/jpeg',
          prompt: promptText,
          responseMimeType: "text/plain",
          model: getSavedModel('gemini-3.8-flash')
        })
      });

      const resultData = await safeParseResponse(response, "Falha ao processar OCR da imagem");
      return resultData.text || "Transcrição vazia";
    } catch (err: any) {
      // Se o backend falhou com erro de servidor/Vercel ou payload, e temos chave do usuário, usa fallback direto
      const isServerError = err?.status >= 500 || err?.status === 413 || String(err?.message || '').includes('Vercel') || String(err?.message || '').includes('servidor');
      if (isServerError && localKey) {
        console.warn('Backend indisponível ou oscilando. Executando OCR diretamente com a chave do usuário...');
        try {
          return await directGeminiOCR(localKey, base64Image, mimeType, promptText, getSavedModel('gemini-3.8-flash'));
        } catch (directErr) {
          console.error('Fallback direto de OCR também falhou:', directErr);
        }
      }

      const is429 = err?.status === 429 || err?.message?.includes('429') || err?.message?.includes('RESOURCE_EXHAUSTED');
      const is503 = err?.status === 503 || err?.message?.includes('503') || err?.message?.includes('UNAVAILABLE');

      if ((is429 || is503) && retries > 0) {
        const waitTime = is429 ? Math.max(delay, 5000) : delay;
        console.warn(`OCR Gemini API ${is429 ? '429 rate-limit' : '503'}, aguardando ${waitTime}ms... (${retries} tentativas restantes)`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return attemptOCR(retries - 1, waitTime * 3);
      }

      if (is429 && retries === 0) {
        throw new Error("QUOTA_EXCEEDED: Limite de requisições atingido. Aguarde 1 minuto e tente novamente.");
      }

      console.error("OCR falhou", err);
      if (err?.status === 401 || err?.requiresApiKey || err?.message?.includes("API key not valid") || err?.message?.includes("chave")) {
        throw new Error("Chave da API do Gemini não configurada ou inválida. Por favor, insira sua chave gratuita do Google AI Studio nas configurações do aplicativo.");
      }
      throw err;
    }
  };

  return attemptOCR();
}

export type SpecialNeedsProfile = 'none' | 'dislexia' | 'surdez' | 'tea';

export async function processEssayImage(
  base64Image: string,
  mimeType: string = 'image/jpeg',
  theme?: string,
  preTranscription?: string,
  specialNeedsProfile: SpecialNeedsProfile = 'none'
): Promise<EssayAnalysis> {
  let systemInstruction = `Você é um avaliador mestre da redação do ENEM, seguindo rigorosamente a Matriz de Referência e a Cartilha do Participante 2025.
Sua função é receber uma imagem da redação manuscrita ou arquivo e estruturar a análise ontológica profunda (Anulação + 5 Competências).
A transcrição ('transcription') que você retornar PRECISA ser EXATAMENTE igual ao texto manuscrito da imagem. Se houver falhas com formatação ou tamanho, use a transcrição fornecida em anexo. Ignore trechos que foram completamente riscados/rasurados pelo aluno.
Nas deviações e extrações de elementos, extraia frases/trechos exatos e concisos do texto. Priorize precisão. O campo 'detectedTheme' deve resumir o tema identificado na redação.

### REGRAS RÍGIDAS DE AVALIAÇÃO:

**NULIDADE (Motor de Regras):**
- Anule (isValid: false) caso haja: Fuga Total ao Tema, Em Branco, Texto Insuficiente (<= 7 linhas efetivas — mín. de 8 linhas conforme Cartilha 2025), Cópia massiva dos textos motivadores, Parte Desconectada (xingamentos, orações, recados, desenhos), Ilegibilidade severa, ou texto que não atenda à tipologia dissertativo-argumentativa.
- Se houver Violação de Direitos Humanos em qualquer parte do texto, marque \`humanRightsViolation: true\` em C5 — isso zera TODA a redação (nota final = 0).

**COMPETÊNCIA 1 (Modalidade Escrita Formal da Língua Portuguesa):**
Avalie dois eixos separados: (A) Convenções de Escrita (ortografia, acentuação, hífen, maiúsculas/minúsculas) e (B) Escolhas de Registro/Gramática (concordância, regência, crase, pontuação, sintaxe, colocação pronominal).
- **200 Pts:** Estrutura Excelente — máx. 2 desvios leves dentre (A) ou (B), sem nenhum desvio grave. Domínio pleno.
- **160 Pts:** Estrutura Boa — poucos desvios. Bom domínio com eventuais deslizes leves.
- **120 Pts:** Estrutura Regular — desvios frequentes mas que não comprometem a compreensão. Pode ter excesso de períodos simples ou justaposição ocasional.
- **80 Pts:** Estrutura Deficitária — muitos desvios graves (truncamentos sintáticos, justaposições de orações, traços constantes de oralidade), comprometendo trechos.
- **40 Pts:** Precária — extrema dificuldade com a escrita formal, domínio insuficiente.
- **0 Pts:** Desconhecimento total da modalidade escrita formal.
Identifique e classifique os erros no array \`deviations\` com campos: text (trecho exato curto), type (categoria: Ortografia, Acentuação, Concordância, Regência, Crase, Pontuação, Sintaxe, Oralidade), correction, explanation.

**COMPETÊNCIA 2 (Tema, Tipologia Dissertativo-Argumentativa e Repertório Sociocultural):**
- **Extraia o tema identificado da redação.**
- Distingua entre Repertório Legitimado (dados oficiais, pesquisas, legislação, referências filosóficas/sociológicas/históricas verificáveis) e Repertório Não Legitimado (senso comum, informações não verificáveis, "fake news").
- **200 Pts:** Repertório Legitimado, Pertinente ao tema E com Uso Produtivo Orgânico (vinculado intrinsecamente à tese, não apenas "colado"). Desenvolve plenamente o tema.
- **160 Pts:** Uso Produtivo Mecânico — "Repertório de Bolso" detectado (citações coringas/genéricas que poderiam servir para qualquer tema). Ou bom repertório com desenvolvimento parcial do tema.
- **120 Pts:** Repertório estritamente baseado nos Textos Motivadores (paráfrase), ou repertório não pertinente/não legitimado. Aborda o tema de forma previsível.
- **80 Pts:** Abordagem temática incipiente e/ou inadequação severa da tipologia. Texto massivamente derivado dos textos motivadores.
- **40 Pts:** Tangenciamento — aborda apenas o hiperônimo temático sem recorte exigido.
- **0 Pts:** Fuga total ao tema ou não atendimento à estrutura dissertativo-argumentativa.

**COMPETÊNCIA 3 (Projeto de Texto e Desenvolvimento Argumentativo):**
- **Extraia a Tese (\`thesis\`) — posicionamento defendido, geralmente no final da introdução.**
- **Extraia os Tópicos Frasais (\`topicSentences\`) — frases iniciais de cada parágrafo de desenvolvimento.**
- **Extraia os argumentos principais (\`arguments\`) com avaliação qualitativa.**
- **200 Pts:** Projeto Estratégico com direcionamento inabalável, progressão lógica clara entre parágrafos, desenvolvimento pleno de todos os argumentos.
- **160 Pts:** Poucas Falhas — desenvolvimento da maior parte dos argumentos, boa progressão com eventuais deslizes de sequenciamento.
- **120 Pts:** Algumas Falhas — problemas de sequenciamento, desenvolvimento embrionário de argumentos, possível circularidade.
- **80 Pts:** Muitas Falhas — Contradição lógica entre tese e argumentos, ou entre premissas dos parágrafos. Argumentação superficial.
- **40 Pts:** Direcionamento argumentativo quase inexistente, incoerência extrema.
- **0 Pts:** Texto não apresenta informações, fatos ou opiniões relacionáveis, ou conteúdo totalmente incompreensível.

**COMPETÊNCIA 4 (Mecanismos Linguísticos de Coesão):**
- Avalie separadamente: (A) Coesão Interparágrafo (conectivos na ABERTURA de parágrafos ligando-os ao anterior) e (B) Coesão Intraparágrafo (conectivos dentro do parágrafo entre períodos/orações). Identifique cada conectivo com \`isInterparagraph\`.
- **200 Pts:** Operadores Interparágrafos na cabeça de >= 2 parágrafos + Saturação Intraparágrafo com diversidade de conectivos. Sem repetições viciosas. Adequação semântica perfeita.
- **160 Pts:** >= 1 momento interparágrafo claro + boa coesão intraparágrafo. Poucas repetições.
- **120 Pts:** Repertório de conectivos pouco diversificado e/ou inadequações de uso semântico.
- **80 Pts:** Formato Monobloco (texto inteiro em 1 parágrafo contínuo) OU repertório limitado e vicioso ("Ademais", "Outrossim" repetidos mecanicamente).
- **40 Pts:** Articulação precária entre partes do texto.
- **0 Pts:** Ausência de articulação, ideias fragmentadas sem conectivos.

**COMPETÊNCIA 5 (Proposta de Intervenção Detalhada — Respeito aos Direitos Humanos):**
- **REGRA CRÍTICA — VIOLAÇÃO DE DH:** Se o texto contiver incitação explícita a ódio, tortura, racismo, discriminação, violência ou morte, marque \`humanRightsViolation: true\`. Isso ZERA TODA A REDAÇÃO (0/1000), não apenas C5.
- Se não houver violação de DH E houver proposta de intervenção, avalie os 5 elementos (\`elements\`, cada um vale 40 pts):
  • **Ação** (verbo interventivo explícito — o que deve ser feito)
  • **Agente** (executor claro e específico: "Governo Federal", "MEC", "Escola X" são válidos; "Sociedade", "Alguém" são vagos)
  • **Meio/Modo** (como a ação será executada — campanhas, leis, projetos, etc.)
  • **Efeito/Finalidade** (resultado esperado — "a fim de", "para que")
  • **Detalhamento** (expansão explicativa de qualquer um dos outros 4 elementos)
- REGRA CRÍTICA PARA OS ELEMENTOS: Se um dos 5 elementos NÃO for identificado, preencha o campo com a string "Não identificado" em vez de null. NUNCA use null, vazio ou undefined nos elementos da proposta.
- **0 Pts (sem DH):** Proposta não apresentada ou completamente desconectada do tema.`;

  if (specialNeedsProfile === 'dislexia') {
    systemInstruction += `\n\n### DIRETRIZES ESPECIAIS: ALUNO COM DISLEXIA
Foi sinalizado que este texto pertence a um aluno com Dislexia. Adapte a correção de acordo com a "Cartilha do Participante com Dislexia - Enem 2025":
- C1 (Flexibilidade máxima): Não supervalorize desvios se o texto for legível. Tolere substituições (p/b, m/n, etc), escrita espelhada, hipo/hipersegmentação, pseudopalavras, falhas de pontuação/acentuação e uso excessivo de voz passiva ou frases curtas.
- C2: Avalie se defendeu ponto de vista. Repertório normal. Atenção a trechos copiados (não pontuar).
- C3: Seja mais tolerante com circularidade de informações, o principal é identificar introdução, desenvolvimento e conclusão.
- C4: Valorize a tentativa de conexão, tolere trocas, omissões ou conectivos com leve imprecisão.
- C5: Avalie normalmente os 5 elementos.
- Feedback: Empático, acolhedor. Estruture em tópicos curtos. Foque nas ideias, não em ortografia miúda.`;
  } else if (specialNeedsProfile === 'surdez') {
    systemInstruction += `\n\n### DIRETRIZES ESPECIAIS: ALUNO SURDO/DEFICIÊNCIA AUDITIVA (L2)
Foi sinalizado que este texto pertence a um aluno Surdo, tendo Libras como L1 e Português como L2. Adapte a correção:
- C1 (Flexibilidade máxima): Tolere ordem invertida (objeto antes do verbo), negação após o verbo, verbos no infinitivo ou ausência de verbos de ligação ("ser"/"estar"), omissão de artigos/preposições/flexões e trocas fonéticas.
- C2: Avalie a tipologia dissertativo-argumentativa. Repertório válido mesmo com sintaxe atípica.
- C3: Foco na intenção argumentativa (ponto de vista e apoio). Tolere falhas na concatenação causadas pela interferência da Libras.
- C4 (Máxima tolerância): A Libras não tem equivalentes para muitos conectivos (preposições, conjunções). Avalie a coesão pela relação semântica (sentido), mesmo com justaposição.
- C5: Avalie normalmente os 5 elementos em L2.
- Feedback: Extremamente visual, direto, foco no bilinguismo (elogie o esforço em L2). Dê exemplos práticos (como reescrever a frase).`;
  } else if (specialNeedsProfile === 'tea') {
    systemInstruction += `\n\n### DIRETRIZES ESPECIAIS: ALUNO COM TEA (AUTISMO)
Foi sinalizado que este texto pertence a um aluno com Transtorno do Espectro Autista. Adapte a correção:
- C1 (Flexível): Tolere disortografia e foco sintático (truncamentos). Se for compreensível, não zere ou penalize severamente por gramática.
- C2: Aceite hiperfoco ou interpretação extremamente literal do tema. O repertório é válido desde que tenha tentado conectá-lo.
- C3: Foco na intenção lógica. Tolere mudanças abruptas de assunto entre parágrafos se houver tentativa de argumento.
- C4: NÃO PENALIZE a repetição de palavras. Avalie o uso simples ou repetitivo de conectivos como sucesso prático.
- C5: Avalie os 5 essenciais, mas respeitando limitações do aluno.
- Feedback: Extremamente literal. Sem metáforas/ironias. Em tópicos visuais. Primeiro o que fez bem (literal), depois como arrumar o resto de forma muito direta.`;
  }

  let prompt = "Analise esta redação como avaliador ENEM com base no nosso formato estabelecido, empregando estritamente a Rúbrica detalhada providenciada em sua instrução.";
  if (theme && theme.trim() !== '') {
    prompt += `\nO TEMA OFICIAL DA REDAÇÃO É: "${theme}". Avalie a aderência do texto a este tema (Competência 2).`;
  }

  if (preTranscription) {
    prompt += `\n\nAQUI ESTÁ A TRANSCRIÇÃO PRÉVIA DA REDAÇÃO:\n"""\n${preTranscription}\n"""\nPor favor, retorne esta mesma transcrição no campo 'transcription' ou uma versão ainda mais correta a partir da imagem.`;
  }

  const attemptProcess = async (retries = 3, delay = 2000): Promise<EssayAnalysis> => {
    const localKey = typeof window !== 'undefined' ? localStorage.getItem('user_gemini_api_key') : null;
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (localKey) {
        headers["x-gemini-api-key"] = localKey;
      }

      let rawResponseText = "";
      try {
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            image: base64Image.split(',')[1] || base64Image,
            mimeType: mimeType || 'image/jpeg',
            prompt,
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: essayAnalysisSchema,
            model: getSavedModel('gemini-3.8-flash')
          })
        });

        const resultData = await safeParseResponse(response, "Falha ao analisar redação com IA");
        rawResponseText = resultData.text || "{}";
      } catch (fetchErr: any) {
        const isServerError = fetchErr?.status >= 500 || fetchErr?.status === 413 || String(fetchErr?.message || '').includes('Vercel') || String(fetchErr?.message || '').includes('servidor');
        if (isServerError && localKey) {
          console.warn('Backend indisponível ou erro 500. Executando análise diretamente com a chave do usuário...');
          rawResponseText = await directGeminiAnalysis(
            localKey,
            base64Image,
            mimeType,
            prompt,
            systemInstruction,
            getSavedModel('gemini-3.8-flash')
          );
        } else {
          throw fetchErr;
        }
      }
      
      let result;
      try {
        result = JSON.parse(rawResponseText || "{}");
      } catch (e) {
        console.warn("JSON Parse Error on AI response. Might be truncated. Attempting to repair...", e);
        try {
          const text = rawResponseText || "{}";
          const cleanedText = text.replace(/\]\s*$/, ']}').replace(/}\s*$/, '}}');
          result = JSON.parse(cleanedText);
        } catch {
          console.error("Failed to parse AI response:", rawResponseText);
          throw new Error("A IA devolveu uma resposta incompleta ou com falha na formatação. Tente novamente.");
        }
      }

      const c1Score = result.competencies?.c1?.score || 0;
      const c2Score = result.competencies?.c2?.score || 0;
      const c3Score = result.competencies?.c3?.score || 0;
      const c4Score = result.competencies?.c4?.score || 0;
      const c5Score = result.competencies?.c5?.score || 0;

      // Violação de DH zera TODA a redação (Cartilha 2025)
      const hasDHViolation = result.competencies?.c5?.humanRightsViolation === true;
      const calculatedTotalScore = hasDHViolation ? 0 : (c1Score + c2Score + c3Score + c4Score + c5Score);

      const normalizeC5Element = (val: any): string => {
        if (!val || typeof val !== 'string') return 'Não identificado';
        const clean = val.trim();
        const lower = clean.toLowerCase();
        if (lower === '' || lower === 'null' || lower === 'undefined' || lower === 'none' || lower === 'não identificado' || lower === 'nao identificado' || lower === 'ausente' || lower === 'inexistente') {
          return 'Não identificado';
        }
        return clean;
      };

      const rawC5Elements = result.competencies?.c5?.elements || {};
      const normalizedC5Elements = {
        agent: normalizeC5Element(rawC5Elements.agent),
        action: normalizeC5Element(rawC5Elements.action),
        means: normalizeC5Element(rawC5Elements.means),
        effect: normalizeC5Element(rawC5Elements.effect),
        detail: normalizeC5Element(rawC5Elements.detail),
      };

      // Validate and fill in defaults for missing property structures
      return {
        transcription: result.transcription || "Transcrição não disponível.",
        detectedTheme: result.detectedTheme || "Tema não identificado",
        nullity: result.nullity || { isValid: true, reason: null },
        competencies: {
          c1: result.competencies?.c1 || { score: 0, structureClass: 'Deficitária', deviations: [] },
          c2: result.competencies?.c2 || { score: 0, repertoire: [], themeAddressed: 'Tangencial' },
          c3: result.competencies?.c3 || { score: 0, project: 'Falhas_Muitas', development: 'Limitado', arguments: [], thesis: null, topicSentences: [] },
          c4: result.competencies?.c4 || { score: 0, connectives: [], monobloc: false },
          c5: {
            score: c5Score,
            elements: normalizedC5Elements,
            humanRightsViolation: hasDHViolation
          }
        },
        suggestedTotalScore: calculatedTotalScore,
        feedbackOptions: result.feedbackOptions || ["Feedback não disponível devido a um erro de formatação."]
      } as EssayAnalysis;
    } catch (err: any) {
      const is429 = err?.status === 429 || err?.message?.includes('429') || err?.message?.includes('RESOURCE_EXHAUSTED');
      const is503 = err?.status === 503 || err?.message?.includes('503') || err?.message?.includes('UNAVAILABLE');

      if ((is429 || is503) && retries > 0) {
        const waitTime = is429 ? Math.max(delay, 5000) : delay;
        console.warn(`Analysis Gemini API ${is429 ? '429 rate-limit' : '503'}, aguardando ${waitTime}ms... (${retries} tentativas restantes)`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return attemptProcess(retries - 1, waitTime * 3);
      }

      if (is429 && retries === 0) {
        throw new Error("QUOTA_EXCEEDED: Limite de requisições atingido. Aguarde 1 minuto e tente novamente.");
      }

      console.error("AI processing failed", err);
      if (err?.status === 401 || err?.requiresApiKey || err?.message?.includes("API key not valid") || err?.message?.includes("INVALID_ARGUMENT") || err?.message?.includes("chave")) {
        throw new Error("Chave da API do Gemini não configurada ou inválida. Por favor, configure sua chave gratuita do Google AI Studio nas configurações do aplicativo para analisar redações.");
      }
      throw err;
    }
  };

  return attemptProcess();
}

