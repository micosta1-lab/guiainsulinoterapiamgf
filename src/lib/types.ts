export type FlowType = "primeira" | "intensificar";

export interface PatientData {
  // Demographics
  idade?: number;
  peso?: number;
  tipoDiabetes?: "DM2" | "DM1" | "outro";
  outroTipoDiabetes?: string;

  // Lab values
  hba1c?: number;
  glicemiaJejum?: number;
  glicemiaPosPrandial?: number;
  glicemiaOcasional?: number;
  glicemiaCeia?: number;

  // Symptoms & flags
  sintomasCatabolicos?: boolean;
  perdaPonderal?: boolean;
  cetonuriaPositiva?: boolean;
  patologiaAguda?: boolean;
  internamentoCirurgia?: boolean;
  insuficienciaRenalHepatica?: boolean;
  gravidez?: boolean;
  terapeuticaOtimizadaHba1cAcima?: boolean;
  reacoesAdversasADO?: boolean;
  valoresLaboratoriaisAlterados?: boolean;

  // Current therapy
  terapeuticaAtual?: "sem_insulina" | "basal" | "basal_rapida" | "pre_mistura" | "outros_ado";
  doseBasalAtual?: number;
  tipoInsulina?: string;
  tipoInsulinaRapida?: string;
  rapidaRefeicoes?: {
    pequenoAlmoco?: { dose?: number };
    almoco?: { dose?: number };
    jantar?: { dose?: number };
  };

  // Lifestyle
  regularidadeRefeicoes?: "regular" | "irregular";
  capacidadeTitulacao?: boolean;
  necessidadeCuidador?: boolean;
  idadeAvancada?: boolean;
  cardiopatiaIsquemica?: boolean;
  obesidadeMarcada?: boolean;
  recusaMultiplasInjecoes?: boolean;
  preferenciaEsquema?: "simples" | "flexivel";
  baixaLiteracia?: boolean;
  esquecimentosFrequentes?: boolean;

  // Hypoglycemia
  hipoglicemiasFrequentes?: boolean;
  hipoglicemiasNoturnas?: boolean;
  hipoglicemiasJejum?: boolean;
  hipoglicemiasEntreRefeicoes?: boolean;
  hipoglicemiasPosPrandiais?: boolean;

  // Glycemic variability
  variabilidadeGlicemica?: boolean;

  // Postprandial pattern
  hiperglicemiasPosPrandiais2Refeicoes?: boolean;
}

export interface RedFlag {
  id: string;
  message: string;
  severity: "urgent" | "warning";
}

export interface InsulinOption {
  nome: string;
  tipo: "basal" | "prandial" | "pre_mistura";
  vantagens: string[];
  limitacoes: string[];
  recomendado: boolean;
  justificacao?: string;
}

export interface TitrationRule {
  faixa: string;
  glicemiaMin: number;
  glicemiaMax: number;
  acao: string;
}

export interface IntensificationStrategy {
  nome: string;
  descricao: string;
  justificacao: string;
  principal: boolean;
  exemplosInsulinas?: string[];
}

export interface ClinicalResult {
  flow: FlowType;

  // Indications
  indicacoesInsulinizacao: string[];
  baseRecomendacao: string[];

  // Red flags
  redFlags: RedFlag[];

  // Insulin recommendation
  insulinaRecomendada?: InsulinOption;
  opcoesInsulina: InsulinOption[];

  // Dose
  doseInicialFixa?: number;
  doseInicialPorPeso?: string;
  doseInicialEscolhida?: number;

  // Titration
  tabelaTitulacaoBasal: TitrationRule[];
  frequenciaTitulacao?: string;

  // Intensification
  estrategiasIntensificacao?: IntensificationStrategy[];
  tabelaTitulacaoRapida?: TitrationRule[];

  // Overbasalization
  overbasalization: boolean;
  overbasalizationMotivos: string[];

  // Pre-mix
  sugerirPreMistura: boolean;
  preMisturaMotivos: string[];
  evitarPreMisturaMotivos: string[];

  // Hypoglycemia management
  recomendacoesHipoglicemia: string[];

  // Education
  educacaoTerapeutica: string[];

  // Follow-up
  seguimentoUSF: string[];

  // Referral needed
  necessitaReferenciacao: boolean;
  motivoReferenciacao?: string;
}
