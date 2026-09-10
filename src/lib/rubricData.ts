/**
 * Dados da Rúbrica Oficial ENEM 2025
 * Baseado na Cartilha do Participante e nos Fascículos de Competência 1-5.
 */

export interface RubricLevel {
  score: number;
  label: string;
  description: string;
}

export interface CompetencyRubric {
  id: 'c1' | 'c2' | 'c3' | 'c4' | 'c5';
  title: string;
  subtitle: string;
  color: string;       // accent text color
  bgColor: string;     // light background
  borderColor: string; // border / accent
  ringColor: string;   // focus ring
  icon: string;        // emoji label
  levels: RubricLevel[];
}

export const RUBRIC_DATA: CompetencyRubric[] = [
  {
    id: 'c1',
    title: 'Competência 1',
    subtitle: 'Domínio da Norma Culta',
    color: '#2563EB',
    bgColor: '#EFF6FF',
    borderColor: '#3B82F6',
    ringColor: '#60A5FA',
    icon: '✍️',
    levels: [
      { score: 200, label: 'Excelente', description: 'Demonstra excelente domínio da modalidade escrita formal. Máximo de 2 desvios leves (gramaticais ou convencionais) sem reincidência.' },
      { score: 160, label: 'Bom', description: 'Demonstra bom domínio. Poucos desvios gramaticais e de convenções da escrita, sem prejudicar a compreensão.' },
      { score: 120, label: 'Mediano', description: 'Demonstra domínio mediano. Desvios frequentes mas que não comprometem a compreensão global. Pode apresentar excesso de períodos simples.' },
      { score: 80, label: 'Insuficiente', description: 'Demonstra domínio insuficiente. Muitos desvios graves (truncamentos, justaposições, marcas de oralidade) que comprometem trechos do texto.' },
      { score: 40, label: 'Precário', description: 'Demonstra domínio precário da modalidade escrita formal, com diversificados e frequentes desvios de todas as naturezas.' },
      { score: 0, label: 'Nulo', description: 'Demonstra desconhecimento da modalidade escrita formal da Língua Portuguesa.' },
    ],
  },
  {
    id: 'c2',
    title: 'Competência 2',
    subtitle: 'Compreensão do Tema e Repertório',
    color: '#7C3AED',
    bgColor: '#F5F3FF',
    borderColor: '#8B5CF6',
    ringColor: '#A78BFA',
    icon: '📖',
    levels: [
      { score: 200, label: 'Pleno', description: 'Desenvolve o tema plenamente com repertório sociocultural legitimado, pertinente e com uso produtivo orgânico (vinculado à tese, não "colado").' },
      { score: 160, label: 'Bom', description: 'Desenvolve bem o tema, com uso produtivo mecânico do repertório ("repertório de bolso" detectado — citações genéricas que servem a qualquer tema).' },
      { score: 120, label: 'Previsível', description: 'Desenvolve o tema de forma previsível. Repertório estritamente baseado nos textos motivadores (paráfrase) ou não pertinente/não legitimado.' },
      { score: 80, label: 'Incipiente', description: 'Desenvolve o tema de forma incipiente e/ou inadequação à tipologia dissertativo-argumentativa. Texto massivamente derivado dos motivadores.' },
      { score: 40, label: 'Tangencial', description: 'Apresenta o assunto de forma tangencial — aborda apenas o hiperônimo temático sem o recorte exigido pela proposta.' },
      { score: 0, label: 'Fuga', description: 'Fuga ao tema ou não atendimento à estrutura dissertativo-argumentativa.' },
    ],
  },
  {
    id: 'c3',
    title: 'Competência 3',
    subtitle: 'Projeto de Texto e Argumentação',
    color: '#D97706',
    bgColor: '#FFFBEB',
    borderColor: '#F59E0B',
    ringColor: '#FBBF24',
    icon: '🧠',
    levels: [
      { score: 200, label: 'Estratégico', description: 'Projeto de texto estratégico com progressão lógica inabalável. Desenvolvimento pleno de todos os argumentos com seleção cuidadosa de fatos e opiniões.' },
      { score: 160, label: 'Poucas falhas', description: 'Apresenta bom projeto de texto. Desenvolvimento da maior parte dos argumentos com boa progressão e eventuais deslizes de sequenciamento.' },
      { score: 120, label: 'Algumas falhas', description: 'Apresenta projeto mediano. Problemas de sequenciamento, desenvolvimento embrionário de argumentos, possível circularidade.' },
      { score: 80, label: 'Muitas falhas', description: 'Projeto deficiente com contradição lógica entre tese e argumentos, ou entre premissas. Argumentação superficial e/ou incoerente.' },
      { score: 40, label: 'Quase inexistente', description: 'Apresenta direcionamento argumentativo quase inexistente, com incoerência extrema e sem progressão.' },
      { score: 0, label: 'Nulo', description: 'Não apresenta informações, fatos ou opiniões relacionáveis ao tema, ou conteúdo totalmente incompreensível.' },
    ],
  },
  {
    id: 'c4',
    title: 'Competência 4',
    subtitle: 'Coesão e Conectivos',
    color: '#059669',
    bgColor: '#ECFDF5',
    borderColor: '#10B981',
    ringColor: '#34D399',
    icon: '🔗',
    levels: [
      { score: 200, label: 'Diversificado', description: 'Articula as partes do texto com operadores interparágrafos na abertura de ≥2 parágrafos + saturação intraparágrafo com diversidade. Sem repetições viciosas.' },
      { score: 160, label: 'Bom', description: 'Articula bem as partes do texto com ≥1 momento interparágrafo claro + boa coesão intraparágrafo. Poucas repetições de conectivos.' },
      { score: 120, label: 'Mediano', description: 'Articula com repertório de conectivos pouco diversificado e/ou inadequações de uso semântico (conectivos usados com sentido trocado).' },
      { score: 80, label: 'Insuficiente', description: 'Formato monobloco (texto inteiro em 1 parágrafo) OU repertório limitado e vicioso ("Ademais", "Outrossim" repetidos mecanicamente).' },
      { score: 40, label: 'Precário', description: 'Articulação precária entre as partes do texto, com pouquíssimos recursos coesivos.' },
      { score: 0, label: 'Nulo', description: 'Ausência de articulação entre as partes. Ideias fragmentadas sem conectivos.' },
    ],
  },
  {
    id: 'c5',
    title: 'Competência 5',
    subtitle: 'Proposta de Intervenção',
    color: '#E11D48',
    bgColor: '#FFF1F2',
    borderColor: '#F43F5E',
    ringColor: '#FB7185',
    icon: '💡',
    levels: [
      { score: 200, label: 'Completa', description: 'Proposta detalhada, relacionada ao tema, com os 5 elementos (Agente + Ação + Meio + Efeito + Detalhamento) e respeito aos direitos humanos.' },
      { score: 160, label: '4 elementos', description: 'Proposta com 4 dos 5 elementos de intervenção. Falta detalhamento ou um dos elementos essenciais (agente, ação, meio ou efeito).' },
      { score: 120, label: '3 elementos', description: 'Proposta com 3 dos 5 elementos de intervenção. Parcialmente elaborada, com lacunas significativas.' },
      { score: 80, label: '2 elementos', description: 'Proposta com 2 dos 5 elementos. Esboço vago de intervenção sem agente ou ação claros.' },
      { score: 40, label: '1 elemento', description: 'Proposta com apenas 1 elemento de intervenção. Extremamente vaga, sem viabilidade.' },
      { score: 0, label: 'Ausente', description: 'Não apresenta proposta de intervenção ou proposta completamente desconectada do tema.' },
    ],
  },
];

/** Retorna a rúbrica de uma competência pelo ID */
export function getRubric(id: 'c1' | 'c2' | 'c3' | 'c4' | 'c5'): CompetencyRubric {
  return RUBRIC_DATA.find(r => r.id === id)!;
}

/** Retorna o nível da rúbrica correspondente à nota */
export function getRubricLevel(id: 'c1' | 'c2' | 'c3' | 'c4' | 'c5', score: number): RubricLevel {
  const rubric = getRubric(id);
  return rubric.levels.find(l => l.score === score) || rubric.levels[rubric.levels.length - 1];
}

/** Labels para perfis de necessidades especiais */
export const SPECIAL_NEEDS_LABELS: Record<string, { label: string; color: string; bgColor: string; borderColor: string; description: string }> = {
  none: { label: 'Padrão', color: '#6B7280', bgColor: '#F3F4F6', borderColor: '#D1D5DB', description: 'Correção padrão conforme Cartilha do Participante 2025.' },
  dislexia: { label: 'Dislexia', color: '#D97706', bgColor: '#FFFBEB', borderColor: '#F59E0B', description: 'Flexibilidade em C1: tolera substituições, espelhamento, hipo/hipersegmentação. Foco nas ideias.' },
  surdez: { label: 'Surdez (L2)', color: '#2563EB', bgColor: '#EFF6FF', borderColor: '#3B82F6', description: 'Máxima tolerância em C1/C4: aceita interferência da Libras, ordem invertida, ausência de artigos.' },
  tea: { label: 'TEA', color: '#7C3AED', bgColor: '#F5F3FF', borderColor: '#8B5CF6', description: 'Tolera hiperfoco, repetições, mudanças abruptas. Não penaliza repetição de palavras em C4.' },
};
