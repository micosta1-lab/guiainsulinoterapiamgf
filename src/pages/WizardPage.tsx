import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, AlertTriangle } from "lucide-react";
import type { PatientData, FlowType } from "@/lib/types";
import { evaluatePatient } from "@/lib/clinicalEngine";
import DisclaimerBanner from "@/components/DisclaimerBanner";
import WizardProgress from "@/components/WizardProgress";
import { FieldGroup, SegmentedOption, NumberInput } from "@/components/WizardFields";
import logoUSF from "@/assets/logo-usf-marginal.png";
import logoULS from "@/assets/logo-uls-lisboa.png";

const STEPS_PRIMEIRA = [
  "Indicações",
  "Dados do doente",
  "Valores laboratoriais",
  "Terapêutica atual",
  "Perfil do doente",
  "Hipoglicemias",
  "Confirmação",
];

const STEPS_INTENSIFICAR = [
  "Indicações",
  "Dados do doente",
  "Valores laboratoriais",
  "Terapêutica atual",
  "Perfil do doente",
  "Hipoglicemias",
  "Padrão glicémico",
  "Confirmação",
];

const WizardPage = () => {
  const { flow } = useParams<{ flow: string }>();
  const navigate = useNavigate();
  const flowType = (flow === "intensificar" ? "intensificar" : "primeira") as FlowType;
  const steps = flowType === "primeira" ? STEPS_PRIMEIRA : STEPS_INTENSIFICAR;

  const [step, setStep] = useState(0);
  const [data, setData] = useState<PatientData>({ tipoDiabetes: "DM2" });

  const update = useCallback((partial: Partial<PatientData>) => {
    setData((prev) => ({ ...prev, ...partial }));
  }, []);

  const canNext = () => {
    if (step === 1) return data.idade !== undefined && data.peso !== undefined;
    if (step === 2) return data.hba1c !== undefined;
    return true;
  };

  const handleFinish = () => {
    const result = evaluatePatient(data, flowType);
    // Store result in sessionStorage and navigate
    sessionStorage.setItem("clinicalResult", JSON.stringify(result));
    sessionStorage.setItem("patientData", JSON.stringify(data));
    navigate("/resultado");
  };

  const isLast = step === steps.length - 1;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card no-print">
        <div className="container max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <img src={logoUSF} alt="USF Marginal" className="h-12 w-auto" />
          <span className="font-heading font-semibold text-foreground">
            {flowType === "primeira" ? "Primeira prescrição" : "Intensificar prescrição"}
          </span>
          <span className="text-xs text-muted-foreground ml-auto font-body flex items-center gap-3">
            Passo {step + 1} de {steps.length}
            <img src={logoULS} alt="ULS Lisboa Ocidental" className="h-6 w-auto hidden sm:block" />
          </span>
        </div>
      </header>

      <div className="flex-1 container max-w-6xl mx-auto px-4 py-8 flex gap-8 pb-20 mt-4">
        {/* Sidebar progress */}
        <aside className="hidden md:block w-56 shrink-0">
          <div className="sticky top-6">
            <WizardProgress steps={steps} currentStep={step} />
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 max-w-2xl">
          <div className="card-clinical space-y-6">
            <h2 className="font-heading text-xl font-bold text-foreground">{steps[step]}</h2>

            {/* DM type warning */}
            {data.tipoDiabetes && data.tipoDiabetes !== "DM2" && (
              <div className="alert-redflag flex items-start gap-2 text-sm">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>Esta ferramenta foi concebida para DM2. Para {data.tipoDiabetes === "outro" ? (data.outroTipoDiabetes || "outros tipos") : data.tipoDiabetes}, os resultados podem não ser adequados. Considere referenciação especializada.</span>
              </div>
            )}

            <StepContent step={step} data={data} update={update} flow={flowType} totalSteps={steps.length} />
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6 no-print">
            <button
              onClick={() => step > 0 ? setStep(step - 1) : navigate("/")}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground font-heading font-medium"
            >
              <ArrowLeft className="w-4 h-4" /> Voltar
            </button>
            <button
              onClick={() => isLast ? handleFinish() : setStep(step + 1)}
              disabled={!canNext()}
              className="btn-primary-large text-sm px-6 py-2.5 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLast ? "Ver resultado" : "Seguinte"} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </main>
      </div>

      <DisclaimerBanner />
    </div>
  );
};

interface StepContentProps {
  step: number;
  data: PatientData;
  update: (p: Partial<PatientData>) => void;
  flow: FlowType;
  totalSteps: number;
}

const StepContent = ({ step, data, update, flow, totalSteps }: StepContentProps) => {
  // Step 0: Indicações para insulinoterapia
  if (step === 0) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Assinale as indicações aplicáveis ao doente. Estes critérios ajudam a fundamentar a decisão de insulinoterapia.</p>
        {([
          { key: "valoresLaboratoriaisAlterados" as const, label: "Valores laboratoriais alterados (glicemia jejum > 250 mg/dL, glicemia ocasional > 300 mg/dL, HbA1c > 10%)" },
          { key: "sintomasCatabolicos" as const, label: "Sintomatologia espoliativa franca (poliúria, polidipsia, polifagia) e perda ponderal" },
          { key: "cetonuriaPositiva" as const, label: "Cetonúria positiva" },
          { key: "patologiaAguda" as const, label: "Descompensação metabólica devido a patologia médica aguda intercorrente" },
          { key: "insuficienciaRenalHepatica" as const, label: "Insuficiência renal ou hepática que contraindique ADO" },
          { key: "reacoesAdversasADO" as const, label: "Reações adversas / intolerâncias / contraindicações a ADO" },
          { key: "terapeuticaOtimizadaHba1cAcima" as const, label: "Terapêutica farmacológica não insulínica otimizada e HbA1c acima do alvo" },
          { key: "internamentoCirurgia" as const, label: "Internamento e/ou cirurgia" },
          { key: "gravidez" as const, label: "Gravidez" },
        ]).map(({ key, label }) => (
          <label key={key} className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={!!data[key]}
              onChange={(e) => update({ [key]: e.target.checked })}
              className="w-5 h-5 rounded border-input text-primary focus:ring-ring accent-primary"
            />
            <span className="text-sm font-body text-foreground">{label}</span>
          </label>
        ))}
      </div>
    );
  }

  // Step 1: Demographics
  if (step === 1) {
    return (
      <div className="space-y-5">
        <FieldGroup label="Idade" required>
          <NumberInput value={data.idade} onChange={(v) => update({ idade: v })} placeholder="Ex: 65" unit="anos" min={18} max={120} />
        </FieldGroup>
        <FieldGroup label="Peso" required>
          <NumberInput value={data.peso} onChange={(v) => update({ peso: v })} placeholder="Ex: 78" unit="kg" min={30} max={250} />
        </FieldGroup>
        <FieldGroup label="Tipo de diabetes" required tooltip="Esta ferramenta é otimizada para DM2. Se suspeita de DM1, referenciar.">
          <div className="grid grid-cols-3 gap-2">
            {(["DM2", "DM1", "outro"] as const).map((t) => (
              <SegmentedOption key={t} label={t === "outro" ? "Outro" : t} selected={data.tipoDiabetes === t} onClick={() => update({ tipoDiabetes: t, ...(t !== "outro" ? { outroTipoDiabetes: undefined } : {}) })} />
            ))}
          </div>
          {data.tipoDiabetes === "outro" && (
            <div className="mt-2">
              <input
                type="text"
                value={data.outroTipoDiabetes ?? ""}
                onChange={(e) => update({ outroTipoDiabetes: e.target.value })}
                placeholder="Especifique (ex: MODY, LADA, gestacional)"
                className="w-full px-3 py-2.5 rounded-lg border border-input bg-card text-foreground text-sm font-body focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          )}
        </FieldGroup>
      </div>
    );
  }

  // Step 2: Lab values
  if (step === 2) {
    return (
      <div className="space-y-5">
        <FieldGroup label="HbA1c" required tooltip="Última HbA1c disponível">
          <NumberInput value={data.hba1c} onChange={(v) => update({ hba1c: v })} placeholder="Ex: 8.5" unit="%" min={4} max={20} />
        </FieldGroup>
        <FieldGroup label="Glicemia em jejum habitual" tooltip="Média das últimas determinações">
          <NumberInput value={data.glicemiaJejum} onChange={(v) => update({ glicemiaJejum: v })} placeholder="Ex: 180" unit="mg/dL" />
        </FieldGroup>
        <FieldGroup label="Glicemia pós-prandial habitual" tooltip="2h após refeição principal">
          <NumberInput value={data.glicemiaPosPrandial} onChange={(v) => update({ glicemiaPosPrandial: v })} placeholder="Ex: 220" unit="mg/dL" />
        </FieldGroup>
        <FieldGroup label="Glicemia ocasional" tooltip="Se disponível, registar valor mais recente">
          <NumberInput value={data.glicemiaOcasional} onChange={(v) => update({ glicemiaOcasional: v })} placeholder="Opcional" unit="mg/dL" />
        </FieldGroup>
        {flow === "intensificar" && (
          <FieldGroup label="Glicemia à ceia" tooltip="Para cálculo de overbasalization">
            <NumberInput value={data.glicemiaCeia} onChange={(v) => update({ glicemiaCeia: v })} placeholder="Opcional" unit="mg/dL" />
          </FieldGroup>
        )}
      </div>
    );
  }

  // Step 3: Current therapy
  if (step === 3) {
    return (
      <div className="space-y-5">
        <FieldGroup label="Terapêutica atual" required>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {([
              { value: "sem_insulina", label: "Sem medicação", sub: "Não faz nenhuma medicação" },
              { value: "basal", label: "Insulina basal", sub: "Uma vez/dia" },
              { value: "basal_rapida", label: "Basal + rápida", sub: "Basal-bólus" },
              { value: "pre_mistura", label: "Pré-mistura", sub: "Insulina bifásica" },
              { value: "outros_ado", label: "ADO otimizados", sub: "Sem insulina" },
            ] as const).map(({ value, label, sub }) => (
              <SegmentedOption
                key={value}
                label={label}
                sublabel={sub}
                selected={data.terapeuticaAtual === value}
                onClick={() => update({ terapeuticaAtual: value })}
              />
            ))}
          </div>
        </FieldGroup>

        {(data.terapeuticaAtual === "basal" || data.terapeuticaAtual === "basal_rapida") && (
          <>
            <FieldGroup label="Dose atual de insulina basal" tooltip="Dose total diária de basal em unidades">
              <NumberInput value={data.doseBasalAtual} onChange={(v) => update({ doseBasalAtual: v })} placeholder="Ex: 24" unit="U/dia" />
            </FieldGroup>
            <FieldGroup label="Tipo de insulina basal atual">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {["NPH", "Glargina U100", "Detemir", "Glargina U300", "Degludec"].map((t) => (
                  <SegmentedOption key={t} label={t} selected={data.tipoInsulina === t} onClick={() => update({ tipoInsulina: t })} />
                ))}
              </div>
            </FieldGroup>
          </>
        )}

        {data.terapeuticaAtual === "basal_rapida" && (
          <>
            <FieldGroup label="Tipo de insulina rápida atual">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {["Lispro", "Aspart", "Glulisina", "Regular/Humana"].map((t) => (
                  <SegmentedOption key={t} label={t} selected={data.tipoInsulinaRapida === t} onClick={() => update({ tipoInsulinaRapida: t })} />
                ))}
              </div>
            </FieldGroup>
            <FieldGroup label="Em que refeições faz insulina rápida?">
              <div className="space-y-3">
                {([
                  { key: "pequenoAlmoco" as const, label: "Pequeno-almoço" },
                  { key: "almoco" as const, label: "Almoço" },
                  { key: "jantar" as const, label: "Jantar" },
                ]).map(({ key, label }) => {
                  const refeicoes = data.rapidaRefeicoes || {};
                  const isChecked = !!refeicoes[key];
                  return (
                    <div key={key} className="space-y-1.5">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const updated = { ...refeicoes };
                            if (e.target.checked) {
                              updated[key] = { dose: undefined };
                            } else {
                              delete updated[key];
                            }
                            update({ rapidaRefeicoes: updated });
                          }}
                          className="w-5 h-5 rounded border-input text-primary focus:ring-ring accent-primary"
                        />
                        <span className="text-sm font-body text-foreground">{label}</span>
                      </label>
                      {isChecked && (
                        <div className="ml-8">
                          <NumberInput
                            value={refeicoes[key]?.dose}
                            onChange={(v) => {
                              const updated = { ...refeicoes, [key]: { dose: v } };
                              update({ rapidaRefeicoes: updated });
                            }}
                            placeholder="Dose"
                            unit="U"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </FieldGroup>
          </>
        )}
      </div>
    );
  }

  // Step 4: Patient profile
  if (step === 4) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Características que influenciam a escolha do esquema.</p>
        <FieldGroup label="Regularidade das refeições">
          <div className="grid grid-cols-2 gap-2">
            <SegmentedOption label="Regular" sublabel="Horários previsíveis" selected={data.regularidadeRefeicoes === "regular"} onClick={() => update({ regularidadeRefeicoes: "regular" })} />
            <SegmentedOption label="Irregular" sublabel="Horários variáveis" selected={data.regularidadeRefeicoes === "irregular"} onClick={() => update({ regularidadeRefeicoes: "irregular" })} />
          </div>
        </FieldGroup>
        <FieldGroup label="Preferência de esquema">
          <div className="grid grid-cols-2 gap-2">
            <SegmentedOption label="Simples" sublabel="Menos injeções" selected={data.preferenciaEsquema === "simples"} onClick={() => update({ preferenciaEsquema: "simples" })} />
            <SegmentedOption label="Flexível" sublabel="Mais controlo" selected={data.preferenciaEsquema === "flexivel"} onClick={() => update({ preferenciaEsquema: "flexivel" })} />
          </div>
        </FieldGroup>
        {([
          { key: "capacidadeTitulacao", label: "Capacidade de titulação autónoma" },
          { key: "necessidadeCuidador", label: "Necessidade de cuidador" },
          { key: "idadeAvancada", label: "Idade avançada / fragilidade" },
          { key: "cardiopatiaIsquemica", label: "Cardiopatia isquémica" },
          { key: "obesidadeMarcada", label: "Obesidade marcada" },
          { key: "recusaMultiplasInjecoes", label: "Recusa/intolerância a múltiplas injeções" },
          { key: "baixaLiteracia", label: "Baixa literacia em saúde" },
          { key: "esquecimentosFrequentes", label: "Esquecimentos frequentes" },
        ] as const).map(({ key, label }) => (
          <label key={key} className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={!!data[key]}
              onChange={(e) => update({ [key]: e.target.checked })}
              className="w-5 h-5 rounded border-input text-primary focus:ring-ring accent-primary"
            />
            <span className="text-sm font-body text-foreground">{label}</span>
          </label>
        ))}
      </div>
    );
  }

  // Step 5: Hypoglycemia
  if (step === 5) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Assinale os padrões de hipoglicemia aplicáveis.</p>
        {([
          { key: "hipoglicemiasFrequentes", label: "Hipoglicemias frequentes" },
          { key: "hipoglicemiasNoturnas", label: "Hipoglicemias noturnas" },
          { key: "hipoglicemiasJejum", label: "Hipoglicemias em jejum" },
          { key: "hipoglicemiasEntreRefeicoes", label: "Hipoglicemias entre refeições" },
          { key: "hipoglicemiasPosPrandiais", label: "Hipoglicemias pós-prandiais" },
          { key: "variabilidadeGlicemica", label: "Variabilidade glicémica elevada" },
        ] as const).map(({ key, label }) => (
          <label key={key} className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={!!data[key]}
              onChange={(e) => update({ [key]: e.target.checked })}
              className="w-5 h-5 rounded border-input text-primary focus:ring-ring accent-primary"
            />
            <span className="text-sm font-body text-foreground">{label}</span>
          </label>
        ))}
      </div>
    );
  }

  // Step 6 (intensificar only): Glycemic pattern
  if (flow === "intensificar" && step === 6) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Padrão glicémico para orientar intensificação.</p>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={!!data.hiperglicemiasPosPrandiais2Refeicoes}
            onChange={(e) => update({ hiperglicemiasPosPrandiais2Refeicoes: e.target.checked })}
            className="w-5 h-5 rounded border-input text-primary focus:ring-ring accent-primary"
          />
          <span className="text-sm font-body text-foreground">Hiperglicemias pós-prandiais em ≥2 refeições</span>
        </label>
      </div>
    );
  }

  // Confirmation step (last step)
  const lastStep = totalSteps - 1;
  if (step === lastStep) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground font-body">
          Reveja os dados introduzidos. Ao prosseguir, será gerado o resumo de apoio à decisão clínica.
        </p>
        <div className="bg-muted rounded-lg p-4 text-sm font-body space-y-1">
          <div><strong>Idade:</strong> {data.idade ?? "—"} anos</div>
          <div><strong>Peso:</strong> {data.peso ?? "—"} kg</div>
          <div><strong>HbA1c:</strong> {data.hba1c ?? "—"}%</div>
          <div><strong>Glicemia jejum:</strong> {data.glicemiaJejum ?? "—"} mg/dL</div>
          <div><strong>Terapêutica:</strong> {data.terapeuticaAtual?.replace(/_/g, " ") ?? "—"}</div>
          {data.doseBasalAtual && <div><strong>Dose basal:</strong> {data.doseBasalAtual} U/dia</div>}
          {data.tipoInsulinaRapida && <div><strong>Insulina rápida:</strong> {data.tipoInsulinaRapida}</div>}
          {data.rapidaRefeicoes && Object.entries(data.rapidaRefeicoes).filter(([, v]) => !!v).length > 0 && (
            <div><strong>Rápida por refeição:</strong> {Object.entries(data.rapidaRefeicoes).filter(([, v]) => !!v).map(([k, v]) => {
              const labels: Record<string, string> = { pequenoAlmoco: "Peq-almoço", almoco: "Almoço", jantar: "Jantar" };
              return `${labels[k] || k}: ${v?.dose || "?"} U`;
            }).join(", ")}</div>
          )}
        </div>
        {data.gravidez && (
          <div className="alert-redflag text-sm flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            Gravidez assinalada — referenciação obrigatória.
          </div>
        )}
        {data.cetonuriaPositiva && (
          <div className="alert-redflag text-sm flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            Cetonúria positiva — excluir cetoacidose / DM1.
          </div>
        )}
      </div>
    );
  }

  return null;
};

export default WizardPage;
