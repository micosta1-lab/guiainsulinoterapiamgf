import type { PatientData, ClinicalResult, RedFlag, InsulinOption, TitrationRule, IntensificationStrategy, FlowType } from "./types";

export function evaluatePatient(data: PatientData, flow: FlowType): ClinicalResult {
  const redFlags = detectRedFlags(data);
  const indicacoes = detectIndicacoesInsulinizacao(data);
  const baseRecomendacao = indicacoes.map(i => i);

  const overbasalizationResult = checkOverbasalization(data);
  const preMisturaResult = checkPreMistura(data);

  const opcoesInsulina = getInsulinOptions(data);
  const insulinaRecomendada = opcoesInsulina.find(o => o.recomendado) || opcoesInsulina[0];

  const doseInicialFixa = 10;
  const dosePorPeso = data.peso ? Math.round(data.peso * 0.15) : undefined;
  const doseInicialEscolhida = dosePorPeso && dosePorPeso > 10 ? dosePorPeso : doseInicialFixa;

  const tabelaTitulacaoBasal = getTabelaTitulacaoBasal();
  const frequenciaTitulacao = getFrequenciaTitulacao(insulinaRecomendada?.nome || "");

  let estrategiasIntensificacao: IntensificationStrategy[] | undefined;
  let tabelaTitulacaoRapida: TitrationRule[] | undefined;
  if (flow === "intensificar") {
    estrategiasIntensificacao = getEstrategiasIntensificacao(data);
    tabelaTitulacaoRapida = getTabelaTitulacaoRapida();
  }

  const necessitaReferenciacao = redFlags.some(r => r.severity === "urgent");
  const motivoReferenciacao = necessitaReferenciacao
    ? redFlags.filter(r => r.severity === "urgent").map(r => r.message).join("; ")
    : undefined;

  return {
    flow,
    indicacoesInsulinizacao: indicacoes,
    baseRecomendacao,
    redFlags,
    insulinaRecomendada,
    opcoesInsulina,
    doseInicialFixa,
    doseInicialPorPeso: data.peso ? `0,1–0,2 U/kg/dia (${Math.round(data.peso * 0.1)}–${Math.round(data.peso * 0.2)} U)` : undefined,
    doseInicialEscolhida,
    tabelaTitulacaoBasal,
    frequenciaTitulacao,
    estrategiasIntensificacao,
    tabelaTitulacaoRapida,
    overbasalization: overbasalizationResult.detected,
    overbasalizationMotivos: overbasalizationResult.motivos,
    sugerirPreMistura: preMisturaResult.sugerir,
    preMisturaMotivos: preMisturaResult.motivos,
    evitarPreMisturaMotivos: preMisturaResult.evitar,
    recomendacoesHipoglicemia: getRecomendacoesHipoglicemia(data),
    educacaoTerapeutica: getEducacaoTerapeutica(),
    seguimentoUSF: getSeguimentoUSF(),
    necessitaReferenciacao,
    motivoReferenciacao,
  };
}

function detectRedFlags(data: PatientData): RedFlag[] {
  const flags: RedFlag[] = [];

  if (data.gravidez) {
    flags.push({ id: "gravidez", message: "Gravidez — referenciação obrigatória a consulta hospitalar", severity: "urgent" });
  }
  if (data.cetonuriaPositiva) {
    flags.push({ id: "cetonuria", message: "Cetonúria positiva — excluir DM1 / cetoacidose. Considerar referenciação urgente", severity: "urgent" });
  }
  if (data.tipoDiabetes === "DM1") {
    flags.push({ id: "dm1", message: "Suspeita de DM1 — referenciar a consulta hospitalar de Endocrinologia/Diabetologia", severity: "urgent" });
  }
  if (data.patologiaAguda) {
    flags.push({ id: "aguda", message: "Descompensação aguda intercorrente — considerar avaliação hospitalar", severity: "urgent" });
  }
  if (data.hipoglicemiasFrequentes && data.hipoglicemiasNoturnas) {
    flags.push({ id: "hipo_grave", message: "Hipoglicemias frequentes e noturnas — risco elevado, rever esquema urgente", severity: "warning" });
  }
  if (data.glicemiaOcasional && data.glicemiaOcasional > 300) {
    flags.push({ id: "glic_300", message: "Glicemia ocasional >300 mg/dL — descompensação significativa", severity: "warning" });
  }
  if (data.hba1c && data.hba1c > 10) {
    flags.push({ id: "hba1c_10", message: "HbA1c >10% — descompensação metabólica marcada", severity: "warning" });
  }
  if (data.internamentoCirurgia) {
    flags.push({ id: "intern", message: "Internamento/cirurgia programada — ajuste de insulinoterapia em contexto hospitalar", severity: "urgent" });
  }
  if (data.sintomasCatabolicos && data.perdaPonderal) {
    flags.push({ id: "catabolicos", message: "Sintomas catabólicos com perda ponderal — excluir DM1, considerar referenciação", severity: "warning" });
  }

  return flags;
}

function detectIndicacoesInsulinizacao(data: PatientData): string[] {
  const indicacoes: string[] = [];

  if (data.glicemiaJejum && data.glicemiaJejum > 250)
    indicacoes.push("Glicemia em jejum >250 mg/dL");
  if (data.glicemiaOcasional && data.glicemiaOcasional > 300)
    indicacoes.push("Glicemia ocasional >300 mg/dL");
  if (data.hba1c && data.hba1c > 10)
    indicacoes.push("HbA1c >10%");
  if (data.cetonuriaPositiva)
    indicacoes.push("Cetonúria positiva");
  if (data.sintomasCatabolicos)
    indicacoes.push("Sintomas espoliativos/catabólicos");
  if (data.perdaPonderal)
    indicacoes.push("Perda ponderal significativa");
  if (data.patologiaAguda)
    indicacoes.push("Descompensação por doença aguda");
  if (data.insuficienciaRenalHepatica)
    indicacoes.push("Insuficiência renal/hepática com limitação a ADO");
  if (data.internamentoCirurgia)
    indicacoes.push("Internamento ou cirurgia programada");
  if (data.gravidez)
    indicacoes.push("Gravidez");
  if (data.terapeuticaAtual === "outros_ado" && data.hba1c && data.hba1c > 7)
    indicacoes.push("Falência de terapêutica otimizada não insulínica acima do alvo");

  if (indicacoes.length === 0 && data.hba1c && data.hba1c > 7) {
    indicacoes.push("HbA1c acima do alvo terapêutico individualizado");
  }

  return indicacoes;
}

function getInsulinOptions(data: PatientData): InsulinOption[] {
  const preferirAnalogos = data.idadeAvancada || data.necessidadeCuidador || data.hipoglicemiasNoturnas || data.cardiopatiaIsquemica;
  const preferirUltralento = data.hipoglicemiasNoturnas && data.hipoglicemiasFrequentes;

  const options: InsulinOption[] = [
    {
      nome: "Insulina NPH",
      tipo: "basal",
      vantagens: ["Custo mais acessível", "Disponibilidade universal", "Experiência clínica ampla"],
      limitacoes: ["Maior risco de hipoglicemia noturna", "Necessita 2 administrações/dia em muitos casos", "Pico de ação menos previsível"],
      recomendado: !preferirAnalogos,
      justificacao: !preferirAnalogos ? "Opção adequada como primeira linha quando não há fatores de risco para hipoglicemia" : undefined,
    },
    {
      nome: "Glargina U100",
      tipo: "basal",
      vantagens: ["Perfil de ação mais estável", "1 administração/dia", "Menor risco de hipoglicemia noturna vs NPH"],
      limitacoes: ["Custo superior à NPH"],
      recomendado: preferirAnalogos && !preferirUltralento,
      justificacao: preferirAnalogos && !preferirUltralento ? "Recomendada pela presença de fatores de risco para hipoglicemia ou necessidade de simplificação" : undefined,
    },
    {
      nome: "Detemir",
      tipo: "basal",
      vantagens: ["Menor variabilidade intra-individual", "Menor ganho ponderal vs NPH", "Menor risco de hipoglicemia noturna"],
      limitacoes: ["Pode necessitar 2 administrações/dia", "Custo superior à NPH"],
      recomendado: false,
    },
    {
      nome: "Glargina U300",
      tipo: "basal",
      vantagens: ["Perfil ultralento e estável", "1 administração/dia", "Menor risco de hipoglicemia vs U100", "Maior flexibilidade horária"],
      limitacoes: ["Custo mais elevado", "Pode requerer doses ~10-15% superiores à U100"],
      recomendado: preferirUltralento,
      justificacao: preferirUltralento ? "Recomendada por hipoglicemias noturnas frequentes — perfil ultralento mais seguro" : undefined,
    },
    {
      nome: "Degludec",
      tipo: "basal",
      vantagens: ["Duração >42 horas", "Menor variabilidade dia-a-dia", "Flexibilidade horária", "Menor risco de hipoglicemia (sobretudo noturna)"],
      limitacoes: ["Custo mais elevado", "Ajustes de dose com intervalo maior (semanal)"],
      recomendado: false,
    },
  ];

  return options;
}

function getTabelaTitulacaoBasal(): TitrationRule[] {
  return [
    { faixa: "<80 mg/dL", glicemiaMin: 0, glicemiaMax: 79, acao: "Reduzir 4 U ou 10–20%" },
    { faixa: "80–130 mg/dL", glicemiaMin: 80, glicemiaMax: 130, acao: "Manter dose" },
    { faixa: "130–180 mg/dL", glicemiaMin: 131, glicemiaMax: 180, acao: "Aumentar 2 U ou 5%" },
    { faixa: ">180 mg/dL", glicemiaMin: 181, glicemiaMax: 9999, acao: "Aumentar 4 U ou 10%" },
  ];
}

function getTabelaTitulacaoRapida(): TitrationRule[] {
  return [
    { faixa: "<140 mg/dL", glicemiaMin: 0, glicemiaMax: 139, acao: "Reduzir 2–4 U ou 10–20%" },
    { faixa: "140–180 mg/dL", glicemiaMin: 140, glicemiaMax: 180, acao: "Manter dose" },
    { faixa: "180–200 mg/dL", glicemiaMin: 181, glicemiaMax: 200, acao: "Aumentar 2 U ou 5%" },
    { faixa: ">200 mg/dL", glicemiaMin: 201, glicemiaMax: 9999, acao: "Aumentar 4 U ou 10%" },
  ];
}

function getFrequenciaTitulacao(nomeInsulina: string): string {
  const lower = nomeInsulina.toLowerCase();
  if (lower.includes("degludec")) return "Semanal";
  if (lower.includes("u300") || lower.includes("glargina u300")) return "A cada 3–4 dias";
  return "A cada 2–3 dias";
}

function getEstrategiasIntensificacao(data: PatientData): IntensificationStrategy[] {
  const strategies: IntensificationStrategy[] = [];
  const doseBasal = data.doseBasalAtual || 0;
  const peso = data.peso || 70;

  // Check for pre-mix suitability
  const preMix = checkPreMistura(data);

  if (data.terapeuticaAtual === "basal" && data.tipoInsulina?.toLowerCase().includes("nph")) {
    strategies.push({
      nome: "NPH em 2 administrações/dia",
      descricao: "Dividir dose de NPH em 2/3 ao pequeno-almoço e 1/3 ao deitar",
      justificacao: "Opção se já usa NPH e tem hiperglicemias durante o dia",
      principal: false,
      exemplosInsulinas: ["Insulina NPH (Insulatard®, Humulin NPH®)"],
    });
  }

  const doseRapida = data.doseRapidaAtual || 4;
  const tipoRapida = data.tipoInsulinaRapida || "Lispro";

  strategies.push({
    nome: "Adicionar insulina rápida à refeição principal",
    descricao: data.terapeuticaAtual === "basal_rapida"
      ? `Atualmente faz ${tipoRapida} ${doseRapida} U/dia. Considerar ajuste de dose ou adicionar a outra refeição. Titular conforme tabela pós-prandial.`
      : `Dose inicial: 4 U ou 0,1 U/kg (${Math.round(peso * 0.1)} U) ou 10% da basal (${Math.round(doseBasal * 0.1)} U). Administrar na refeição com maior impacto glicémico.`,
    justificacao: data.terapeuticaAtual === "basal_rapida"
      ? `Já faz ${tipoRapida} — avaliar se dose atual (${doseRapida} U) é adequada e se deve estender a mais refeições`
      : "Estratégia basal-plus: permite controlo pós-prandial focado com menor complexidade",
    principal: !preMix.sugerir,
    exemplosInsulinas: [
      "Lispro (Humalog®)",
      "Aspart (NovoRapid®)",
      "Glulisina (Apidra®)",
    ],
  });

  if (preMix.sugerir) {
    strategies.push({
      nome: "Mudar para pré-mistura 2x/dia",
      descricao: "Iniciar pré-mistura ao pequeno-almoço e jantar. Ajustar conforme glicemias pré e pós-prandiais.",
      justificacao: preMix.motivos.join(". "),
      principal: true,
      exemplosInsulinas: [
        "Lispro/Lispro-protamina 25/75 (Humalog Mix 25®)",
        "Lispro/Lispro-protamina 50/50 (Humalog Mix 50®)",
        "Aspártico/Asp-protamina 30/70 (NovoMix 30®)",
        "NPH/Regular 30/70 (Mixtard 30®, Humulin M3®)",
      ],
    });
  }

  strategies.push({
    nome: "Basal-bólus completo",
    descricao: "Basal + insulina rápida a cada refeição principal. Maior flexibilidade mas maior complexidade.",
    justificacao: "Esquema mais intensivo, indicado quando basal-plus insuficiente ou HbA1c muito acima do alvo",
    principal: false,
    exemplosInsulinas: [
      "Basal: Glargina U100 (Lantus®), Degludec (Tresiba®)",
      "Rápida: Lispro (Humalog®), Aspártico (NovoRapid®), Glulisina (Apidra®)",
    ],
  });

  return strategies;
}

function checkOverbasalization(data: PatientData): { detected: boolean; motivos: string[] } {
  const motivos: string[] = [];

  if (data.doseBasalAtual && data.peso && data.doseBasalAtual / data.peso > 0.5) {
    motivos.push(`Dose basal >0,5 U/kg (${(data.doseBasalAtual / data.peso).toFixed(2)} U/kg)`);
  }
  if (data.glicemiaCeia && data.glicemiaJejum && Math.abs(data.glicemiaCeia - data.glicemiaJejum) > 30) {
    motivos.push(`Diferença >30 mg/dL entre glicemia à ceia (${data.glicemiaCeia}) e jejum (${data.glicemiaJejum})`);
  }
  if (data.hipoglicemiasFrequentes) {
    motivos.push("Hipoglicemias frequentes");
  }
  if (data.variabilidadeGlicemica) {
    motivos.push("Variabilidade glicémica elevada");
  }

  return { detected: motivos.length > 0, motivos };
}

function checkPreMistura(data: PatientData): { sugerir: boolean; motivos: string[]; evitar: string[] } {
  const motivos: string[] = [];
  const evitar: string[] = [];

  if (data.hiperglicemiasPosPrandiais2Refeicoes) motivos.push("Hiperglicemias pós-prandiais em ≥2 refeições");
  if (data.glicemiaJejum && data.glicemiaJejum > 130) motivos.push("Jejum também fora do alvo");
  if (data.regularidadeRefeicoes === "regular") motivos.push("Padrão alimentar estável/previsível");
  if (data.baixaLiteracia) motivos.push("Baixa literacia em saúde");
  if (data.esquecimentosFrequentes) motivos.push("Esquecimentos frequentes");
  if (!data.capacidadeTitulacao) motivos.push("Dificuldade com titulação autónoma");
  if (data.preferenciaEsquema === "simples") motivos.push("Preferência por esquema simples");
  if (data.recusaMultiplasInjecoes) motivos.push("Recusa/intolerância a múltiplas injeções");

  if (data.regularidadeRefeicoes === "irregular") evitar.push("Refeições irregulares");
  if (data.hipoglicemiasFrequentes) evitar.push("Risco elevado de hipoglicemia");
  if (data.obesidadeMarcada) evitar.push("Obesidade marcada");

  const sugerir = motivos.length >= 3 && evitar.length === 0;

  return { sugerir, motivos, evitar };
}

function getRecomendacoesHipoglicemia(data: PatientData): string[] {
  const recs: string[] = [];

  if (data.hipoglicemiasFrequentes || data.hipoglicemiasNoturnas) {
    recs.push("1.º Reduzir dose de insulina basal");
    recs.push("2.º Rever necessidade de insulina rápida");
  }
  if (data.regularidadeRefeicoes === "irregular") {
    recs.push("Refeições irregulares: evitar bólus fixos; considerar basal isolada");
    recs.push("Rápida apenas como correção pontual se pré-prandial ≥180 mg/dL");
  }
  recs.push("Reforçar educação terapêutica sobre hipoglicemia");
  recs.push("Considerar associação com agonista GLP-1 quando aplicável");

  return recs;
}

function getEducacaoTerapeutica(): string[] {
  return [
    "Utilizar agulhas 4–6 mm (preferir 4 mm em doentes magros)",
    "Garantir acesso a glucómetro, lancetas e diário glicémico",
    "Individualizar horários e frequência de pesquisas de glicemia",
    "Alvos glicémicos: pré-prandial 80–130 mg/dL; pós-prandial 2h <180 mg/dL",
    "Ensinar reconhecimento dos níveis de hipoglicemia (nível 1: 54–70 mg/dL; nível 2: <54 mg/dL; nível 3: alteração cognitiva/necessidade de ajuda)",
    "Tratamento da hipoglicemia: 15–20 g de glicose oral, reavaliar aos 15 min",
    "Considerar prescrição de glucagon se risco de hipoglicemia grave",
    "Envolver doente, família e/ou cuidador no plano terapêutico",
  ];
}

function getSeguimentoUSF(): string[] {
  return [
    "Reavaliação médica em 1–2 semanas após início ou alteração de insulina",
    "Consulta de enfermagem para reforço de técnica de injeção e autovigilância",
    "Reavaliação de HbA1c em 3 meses",
    "Monitorizar episódios de hipoglicemia em cada consulta",
    "Rever adesão terapêutica e barreiras à autogestão",
    "Avaliar necessidade de referenciação se alvos não atingidos após otimização",
  ];
}
