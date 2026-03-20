import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Syringe, AlertTriangle, CheckCircle, Printer, RotateCcw,
  ShieldAlert, TrendingUp, BookOpen, Heart, ClipboardList, Copy, Check, Download
} from "lucide-react";
import type { ClinicalResult, PatientData } from "@/lib/types";
import DisclaimerBanner from "@/components/DisclaimerBanner";
import DarkModeToggle from "@/components/DarkModeToggle";
import logoUSF from "@/assets/logo-usf-marginal.png";
import logoULS from "@/assets/logo-uls-lisboa.png";

function buildClinicalText(result: ClinicalResult, patientData: PatientData | null): string {
  const lines: string[] = [];
  lines.push("=== PLANO DE INSULINOTERAPIA ===");
  lines.push("");

  if (patientData) {
    lines.push(`Idade: ${patientData.idade ?? "—"} anos | Peso: ${patientData.peso ?? "—"} kg | HbA1c: ${patientData.hba1c ?? "—"}%`);
    lines.push(`Tipo de diabetes: ${patientData.tipoDiabetes === "outro" ? (patientData.outroTipoDiabetes || "Outro") : patientData.tipoDiabetes ?? "—"}`);
    lines.push("");
  }

  if (result.flow === "primeira" && result.insulinaRecomendada) {
    lines.push(`ESQUEMA: ${result.insulinaRecomendada.nome}`);
    if (result.insulinaRecomendada.justificacao) lines.push(`Justificação: ${result.insulinaRecomendada.justificacao}`);
    lines.push(`DOSE INICIAL: ${result.doseInicialEscolhida} U/dia`);
    if (result.doseInicialPorPeso) lines.push(`Por peso: ${result.doseInicialPorPeso}`);
    lines.push("");
  }

  lines.push("TITULAÇÃO BASAL (alvo jejum 80-130 mg/dL):");
  lines.push(`Frequência: ${result.frequenciaTitulacao}`);
  result.tabelaTitulacaoBasal.forEach(r => lines.push(`  ${r.faixa}: ${r.acao}`));
  lines.push("");

  if (result.estrategiasIntensificacao && result.estrategiasIntensificacao.length > 0) {
    lines.push("ESTRATÉGIAS DE INTENSIFICAÇÃO:");
    result.estrategiasIntensificacao.forEach(s => {
      lines.push(`  ${s.principal ? "[RECOMENDADA] " : ""}${s.nome}`);
      lines.push(`  ${s.descricao}`);
    });
    lines.push("");
  }

  if (result.tabelaTitulacaoRapida) {
    lines.push("TITULAÇÃO RÁPIDA (alvo pós-prandial <180 mg/dL):");
    result.tabelaTitulacaoRapida.forEach(r => lines.push(`  ${r.faixa}: ${r.acao}`));
    lines.push("");
  }

  lines.push("SEGUIMENTO:");
  result.seguimentoUSF.forEach(s => lines.push(`  • ${s}`));
  lines.push("");

  if (result.recomendacoesHipoglicemia.length > 0) {
    lines.push("HIPOGLICEMIA:");
    result.recomendacoesHipoglicemia.forEach(r => lines.push(`  • ${r}`));
    lines.push("");
  }

  if (result.necessitaReferenciacao) {
    lines.push(`⚠ REFERENCIAÇÃO: ${result.motivoReferenciacao}`);
  }

  return lines.join("\n");
}

const ResultsPage = () => {
  const navigate = useNavigate();
  const [result, setResult] = useState<ClinicalResult | null>(null);
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [followUp, setFollowUp] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const r = sessionStorage.getItem("clinicalResult");
    const p = sessionStorage.getItem("patientData");
    if (r) setResult(JSON.parse(r));
    if (p) setPatientData(JSON.parse(p));
  }, []);

  if (!result) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Nenhum resultado disponível.</p>
          <button onClick={() => navigate("/")} className="btn-primary-large text-sm px-6 py-2">
            Voltar ao início
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card no-print">
        <div className="container max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoUSF} alt="USF Marginal" className="h-12 w-auto" />
            <span className="font-heading font-semibold text-foreground">Resumo de apoio à prescrição</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (result) {
                  const text = buildClinicalText(result, patientData);
                  navigator.clipboard.writeText(text).then(() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  });
                }
              }}
              className="px-4 py-2 text-sm font-heading font-medium text-muted-foreground border border-border rounded-lg hover:bg-muted flex items-center gap-2"
            >
              {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copiado!" : "Copiar texto"}
            </button>
            <button
              onClick={() => {
                if (result) {
                  const text = buildClinicalText(result, patientData);
                  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "plano-insulinoterapia.txt";
                  a.click();
                  URL.revokeObjectURL(url);
                }
              }}
              className="px-4 py-2 text-sm font-heading font-medium text-muted-foreground border border-border rounded-lg hover:bg-muted flex items-center gap-2"
            >
              <Download className="w-4 h-4" /> Guardar .txt
            </button>
            <button onClick={() => window.print()} className="btn-primary-large text-sm px-4 py-2 flex items-center gap-2">
              <Printer className="w-4 h-4" /> Imprimir / PDF
            </button>
            <button
              onClick={() => { sessionStorage.clear(); navigate("/"); }}
              className="px-4 py-2 text-sm font-heading font-medium text-muted-foreground border border-border rounded-lg hover:bg-muted"
            >
              <RotateCcw className="w-4 h-4 inline mr-1" /> Novo doente
            </button>
            <DarkModeToggle />
            <img src={logoULS} alt="ULS Lisboa Ocidental" className="h-6 w-auto hidden sm:block" />
          </div>
        </div>
      </header>

      <main className="container max-w-5xl mx-auto px-4 py-6 pb-20 space-y-6">
        {/* Referral banner */}
        {result.necessitaReferenciacao && (
          <div className="alert-redflag flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 mt-0.5 shrink-0" />
            <div>
              <p className="font-heading font-bold text-sm">Referenciação recomendada</p>
              <p className="text-sm mt-1">{result.motivoReferenciacao}</p>
            </div>
          </div>
        )}

        {/* Overbasalization */}
        {result.overbasalization && (
          <div className="alert-warning flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
            <div>
              <p className="font-heading font-bold text-sm">Suspeita de overbasalization</p>
              <p className="text-sm mt-1">Considerar intensificação ou revisão da estratégia em vez de continuar a subir basal.</p>
              <ul className="text-xs mt-2 space-y-0.5 list-disc list-inside">
                {result.overbasalizationMotivos.map((m, i) => <li key={i}>{m}</li>)}
              </ul>
            </div>
          </div>
        )}

        {/* Red flags */}
        {result.redFlags.length > 0 && (
          <div className="space-y-2">
            {result.redFlags.map((rf) => (
              <div key={rf.id} className={rf.severity === "urgent" ? "alert-redflag" : "alert-warning"}>
                <div className="flex items-start gap-2 text-sm">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{rf.message}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Grid layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Esquema recomendado — apenas para primeira prescrição */}
          {result.flow === "primeira" && (
            <div className="card-clinical space-y-3">
              <div className="flex items-center gap-2 text-primary">
                <Syringe className="w-5 h-5" />
                <h3 className="font-heading font-bold">Esquema recomendado</h3>
              </div>
              {result.insulinaRecomendada && (
                <div className="space-y-2">
                  <div className="bg-primary/5 rounded-lg p-3 border border-primary/20">
                    <p className="font-heading font-bold text-foreground">{result.insulinaRecomendada.nome}</p>
                    {result.insulinaRecomendada.justificacao && (
                      <p className="text-xs text-muted-foreground mt-1">{result.insulinaRecomendada.justificacao}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="font-semibold text-foreground mb-1">Vantagens</p>
                      <ul className="space-y-0.5 text-muted-foreground">
                        {result.insulinaRecomendada.vantagens.map((v, i) => (
                          <li key={i} className="flex items-start gap-1"><CheckCircle className="w-3 h-3 text-success mt-0.5 shrink-0" />{v}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground mb-1">Limitações</p>
                      <ul className="space-y-0.5 text-muted-foreground">
                        {result.insulinaRecomendada.limitacoes.map((l, i) => (
                          <li key={i} className="flex items-start gap-1"><AlertTriangle className="w-3 h-3 text-warning mt-0.5 shrink-0" />{l}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Other options */}
              <details className="text-xs">
                <summary className="cursor-pointer text-primary font-medium">Ver outras opções de insulina</summary>
                <div className="mt-2 space-y-2">
                  {result.opcoesInsulina.filter(o => !o.recomendado).map((o, i) => (
                    <div key={i} className="bg-muted rounded-lg p-2">
                      <p className="font-semibold text-foreground">{o.nome}</p>
                      <p className="text-muted-foreground">{o.vantagens[0]} · {o.limitacoes[0]}</p>
                    </div>
                  ))}
                </div>
              </details>
            </div>
          )}

          {/* Dose inicial — apenas para primeira prescrição */}
          {result.flow === "primeira" && (
            <div className="card-clinical space-y-3">
              <div className="flex items-center gap-2 text-primary">
                <TrendingUp className="w-5 h-5" />
                <h3 className="font-heading font-bold">Dose inicial sugerida</h3>
              </div>
              <div className="space-y-2">
                <div className="bg-primary/5 rounded-lg p-3 border border-primary/20 text-center">
                  <p className="text-3xl font-heading font-extrabold text-primary">{result.doseInicialEscolhida} U/dia</p>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>• Dose fixa: <strong>10 U/dia</strong></p>
                  {result.doseInicialPorPeso && <p>• Por peso: <strong>{result.doseInicialPorPeso}</strong></p>}
                  <p className="text-primary/80 font-medium">Dose escolhida: {result.doseInicialEscolhida === 10 ? "dose fixa 10 U" : "baseada no peso"}</p>
                </div>
              </div>
            </div>
          )}

          {/* Titração basal */}
          <div className="card-clinical space-y-3">
            <div className="flex items-center gap-2 text-primary">
              <ClipboardList className="w-5 h-5" />
              <h3 className="font-heading font-bold">Tabela de titulação da basal</h3>
            </div>
            <p className="text-xs text-muted-foreground">Alvo glicemia em jejum: 80–130 mg/dL · Frequência: {result.frequenciaTitulacao}</p>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 font-heading font-semibold text-foreground">Glicemia jejum</th>
                  <th className="text-left py-2 font-heading font-semibold text-foreground">Ação</th>
                </tr>
              </thead>
              <tbody>
                {result.tabelaTitulacaoBasal.map((r, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="py-2 font-body text-foreground">{r.faixa}</td>
                    <td className="py-2 font-body text-muted-foreground">{r.acao}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Intensification strategies */}
          {result.estrategiasIntensificacao && result.estrategiasIntensificacao.length > 0 && (
            <div className="card-clinical space-y-3">
              <div className="flex items-center gap-2 text-primary">
                <TrendingUp className="w-5 h-5" />
                <h3 className="font-heading font-bold">Estratégias de intensificação</h3>
              </div>
              <div className="space-y-2">
                {result.estrategiasIntensificacao.map((s, i) => (
                  <div key={i} className={`rounded-lg p-3 text-sm ${s.principal ? "bg-primary/5 border border-primary/20" : "bg-muted"}`}>
                    <div className="flex items-center gap-2">
                      <p className="font-heading font-semibold text-foreground">{s.nome}</p>
                      {s.principal && <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded font-heading font-semibold">RECOMENDADA</span>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{s.descricao}</p>
                    <p className="text-xs text-primary/80 mt-1 italic">{s.justificacao}</p>
                    {s.exemplosInsulinas && s.exemplosInsulinas.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {s.exemplosInsulinas.map((ex, j) => (
                          <span key={j} className="text-[11px] bg-accent/50 text-accent-foreground px-2 py-0.5 rounded-md font-body">
                            {ex}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rapid titration */}
          {result.tabelaTitulacaoRapida && (
            <div className="card-clinical space-y-3">
              <div className="flex items-center gap-2 text-primary">
                <ClipboardList className="w-5 h-5" />
                <h3 className="font-heading font-bold">Ajuste da rápida/prandial</h3>
              </div>
              <p className="text-xs text-muted-foreground">Alvo: glicemia pós-prandial 2h &lt;180 mg/dL</p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 font-heading font-semibold text-foreground">Glicemia 2h pp</th>
                    <th className="text-left py-2 font-heading font-semibold text-foreground">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {result.tabelaTitulacaoRapida.map((r, i) => (
                    <tr key={i} className="border-b border-border/50">
                      <td className="py-2 font-body text-foreground">{r.faixa}</td>
                      <td className="py-2 font-body text-muted-foreground">{r.acao}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Base da recomendação */}
          <div className="card-clinical space-y-3">
            <div className="flex items-center gap-2 text-primary">
              <BookOpen className="w-5 h-5" />
              <h3 className="font-heading font-bold">Base da recomendação</h3>
            </div>
            {result.indicacoesInsulinizacao.length > 0 ? (
              <ul className="text-sm space-y-1 text-foreground font-body">
                {result.indicacoesInsulinizacao.map((ind, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    {ind}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Sem indicações formais ativadas com os dados fornecidos.</p>
            )}
          </div>

          {/* Education */}
          <div className="card-clinical space-y-3">
            <div className="flex items-center gap-2 text-primary">
              <Heart className="w-5 h-5" />
              <h3 className="font-heading font-bold">Educação terapêutica</h3>
            </div>
            <ul className="text-xs space-y-1.5 text-muted-foreground font-body">
              {result.educacaoTerapeutica.map((e, i) => <li key={i}>• {e}</li>)}
            </ul>
          </div>

          {/* Hypoglycemia management */}
          {result.recomendacoesHipoglicemia.length > 0 && (
            <div className="card-clinical space-y-3">
              <div className="flex items-center gap-2 text-warning">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-heading font-bold text-foreground">Maneio de hipoglicemia</h3>
              </div>
              <ul className="text-xs space-y-1.5 text-muted-foreground font-body">
                {result.recomendacoesHipoglicemia.map((r, i) => <li key={i}>• {r}</li>)}
              </ul>
            </div>
          )}

          {/* Follow-up */}
          <div className="card-clinical space-y-3">
            <div className="flex items-center gap-2 text-primary">
              <ClipboardList className="w-5 h-5" />
              <h3 className="font-heading font-bold">Seguimento na USF</h3>
            </div>
            <ul className="text-xs space-y-1.5 text-muted-foreground font-body">
              {result.seguimentoUSF.map((s, i) => <li key={i}>• {s}</li>)}
            </ul>
            <div className="mt-3">
              <label className="text-xs font-heading font-medium text-foreground block mb-1">Plano de follow-up (opcional)</label>
              <textarea
                value={followUp}
                onChange={(e) => setFollowUp(e.target.value)}
                placeholder="Notas personalizadas de seguimento..."
                className="w-full px-3 py-2 rounded-lg border border-input bg-card text-foreground text-xs font-body focus:outline-none focus:ring-2 focus:ring-ring resize-y min-h-[60px]"
              />
            </div>
          </div>
        </div>
      </main>

      <DisclaimerBanner />
    </div>
  );
};

export default ResultsPage;
