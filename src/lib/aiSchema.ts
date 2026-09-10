import { Type } from "@google/genai";

export const essayAnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    transcription: {
      type: Type.STRING,
      description: "A transcrição integral e exata do texto manuscrito na imagem."
    },
    nullity: {
      type: Type.OBJECT,
      properties: {
        isValid: { type: Type.BOOLEAN },
        reason: { type: Type.STRING, description: "Se anulada, motivo (Em Branco, Cópia, Fuga ao tema). Null se válida." }
      },
      required: ["isValid"]
    },
    competencies: {
      type: Type.OBJECT,
      properties: {
        c1: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.INTEGER, description: "Nota sugestiva de 0 a 200 (múltiplos de 40)" },
            structureClass: { type: Type.STRING, description: "Excelente, Boa, Regular, Deficitária" },
            deviations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING, description: "Trecho exato do texto (curto)" },
                  type: { type: Type.STRING },
                  correction: { type: Type.STRING },
                  explanation: { type: Type.STRING }
                },
                required: ["text", "type", "correction", "explanation"]
              }
            }
          },
          required: ["score", "structureClass", "deviations"]
        },
        c2: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.INTEGER },
            repertoire: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  reference: { type: Type.STRING, description: "Trecho ou citação" },
                  productive: { type: Type.BOOLEAN },
                  canned: { type: Type.BOOLEAN, description: "Se for citação de bolso sem introdução orgânica" }
                },
                required: ["reference", "productive", "canned"]
              }
            },
            themeAddressed: { type: Type.STRING, description: "'Completo', 'Tangencial' ou 'Fuga'" }
          },
          required: ["score", "repertoire", "themeAddressed"]
        },
        c3: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.INTEGER },
            project: { type: Type.STRING, description: "Estrategico, Falhas_Poucas, Falhas_Algumas, Falhas_Muitas" },
            development: { type: Type.STRING, description: "Pleno, Maior_Parte, Embrionario, Limitado" },
            thesis: { type: Type.STRING, description: "O trecho exato da tese apresentada no texto (geralmente no final da introdução)." },
            topicSentences: {
              type: Type.ARRAY,
              description: "Os tópicos frasais (frases iniciais dos parágrafos de desenvolvimento) extraídos do texto.",
              items: { type: Type.STRING }
            },
            arguments: {
              type: Type.ARRAY,
              description: "Os argumentos principais extraídos do texto",
              items: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING, description: "O trecho ou resumo do argumento" },
                  explanation: { type: Type.STRING, description: "Explicação ou avaliação da qualidade desse argumento" }
                },
                required: ["text", "explanation"]
              }
            }
          },
          required: ["score", "project", "development", "arguments", "thesis", "topicSentences"]
        },
        c4: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.INTEGER },
            connectives: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING },
                  isInterparagraph: { type: Type.BOOLEAN }
                },
                required: ["text", "isInterparagraph"]
              }
            },
            monobloc: { type: Type.BOOLEAN }
          },
          required: ["score", "connectives", "monobloc"]
        },
        c5: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.INTEGER },
            elements: {
              type: Type.OBJECT,
              properties: {
                agent: { type: Type.STRING, description: "Trecho que identifica o Agente, ou 'Não identificado' se não houver" },
                action: { type: Type.STRING, description: "Trecho que identifica a Ação, ou 'Não identificado' se não houver" },
                means: { type: Type.STRING, description: "Trecho do Meio/Modo, ou 'Não identificado' se não houver" },
                effect: { type: Type.STRING, description: "Trecho do Efeito/Finalidade, ou 'Não identificado' se não houver" },
                detail: { type: Type.STRING, description: "Trecho do detalhamento, ou 'Não identificado' se não houver" }
              }
            },
            humanRightsViolation: { type: Type.BOOLEAN }
          },
          required: ["score", "elements", "humanRightsViolation"]
        }
      },
      required: ["c1", "c2", "c3", "c4", "c5"]
    },
    suggestedTotalScore: { type: Type.INTEGER },
    detectedTheme: { type: Type.STRING, description: "O tema geral detectado ou interpretado a partir do texto" },
    feedbackOptions: {
      type: Type.ARRAY,
      items: { type: Type.STRING, description: "Opção de feedback humano redigido para apoiar o professor a usar e editar" }
    }
  },
  required: ["transcription", "nullity", "competencies", "suggestedTotalScore", "detectedTheme", "feedbackOptions"]
};
