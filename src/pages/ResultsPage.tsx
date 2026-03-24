import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Syringe, AlertTriangle, CheckCircle, Printer, RotateCcw,
  ShieldAlert, TrendingUp, BookOpen, Heart, ClipboardList, Copy, Check, Download, Clock, Activity, Pill
} from "lucide-react";
import type { ClinicalResult, PatientData, InsulinOption } from "@/lib/types";
import DisclaimerBanner from "@/components/DisclaimerBanner";
import DarkModeToggle from "@/components/DarkModeToggle";
import logoUSF from "@/assets/logo-usf-marginal.png";
import logoULS from "@/assets/logo-uls-lisboa.png";

function buildClinicalText(result: ClinicalResult, patientData: PatientData | null): string {
  const lines: string[] = [];
  const flow = result.flow;

  // 1. Esquema de insulina
  if (flow === "primeira" && result.insulinaRecomendada) {
    const dose = result.doseInicialEscolhida ?? 10;
    const nome = result.insulinaRecomendada.nome;
    const horario = nome.toLowerCase().includes("nph") ? "ao deitar" : "1x/dia (horário fixo)";
    lines.push(`- Inicia esquema de insulinoterapia: ${nome} ${dose}U ${horario}`);
  } else if (flow === "intensificar") {
    const principal = result.estrategiasIntensificacao?.find(s => s.principal);
    if (principal) {
      lines.push(`- Intensifica esquema de insulinoterapia: ${principal.nome}`);
      lines.push(`  ${principal.descricao}`);
    } else if (result.estrategiasIntensificacao && result.estrategiasIntensificacao.length > 0) {
      lines.push(`- Intensifica esquema de insulinoterapia: ${result.estrategiasIntensificacao[0].nome}`);
    }
  }
  lines.push("- Definidos alvos glicémicos individualizados:");
  lines.push("  Jejum: 80–130 mg/dL");
  lines.push("  Pós-prandial: <180 mg/dL");
  lines.push("  (ajustar conforme idade, comorbilidades e risco de hipoglicemia)");
  lines.push(`- Estabelecido plano de titulação da insulina (frequência: ${result.frequenciaTitulacao || "a cada 2–3 dias"}):`);
  result.tabelaTitulacaoBasal.forEach(r => lines.push(`  ${r.faixa}: ${r.acao}`));
  if (result.tabelaTitulacaoRapida) {
    lines.push("  Titulação prandial:");
    result.tabelaTitulacaoRapida.forEach(r => lines.push(`  ${r.faixa}: ${r.acao}`));
  }
  lines.push("- Reforçada técnica de administração de insulina: rotação de locais, correta utilização de caneta/agulhas e conservação da insulina");
  lines.push("- Reforçada autovigilância glicémica");
  lines.push("- Explicado plano de atuação em hipoglicemia (reconhecimento de sinais e sintomas, regra dos 15g HC e sinais/sintomas que motivam ida à urgência)");
  lines.push("- Explicadas regras em doença aguda: não suspender insulina basal, reforço de hidratação, vigilância glicémica mais frequente e sinais de alarme para observação urgente");
  lines.push("- Reforçada educação alimentar adaptada à insulinoterapia");
  lines.push("- Avaliado risco de hipoglicemia (idade, função renal, contexto social)");
  lines.push("- Monitorizar em cada consulta: episódios de hipoglicemia, adesão terapêutica, técnica de administração e registos glicémicos");
  lines.push("- Marcada consulta de reavaliação em 1–2 semanas");
  lines.push("- Reavaliação de HbA1c em 3 meses");
  if (result.necessitaReferenciacao) {
    lines.push(`- ⚠ Referenciação: ${result.motivoReferenciacao}`);
  } else {
    lines.push("- Avaliar necessidade de referenciação a Endocrinologia/Consulta de Diabetes se alvos não atingidos após otimização");
  }
  lines.push("- Explicados sinais e sintomas que motivam reavaliação urgente");
  lines.push("");
  lines.push("MEDIDAS NÃO FARMACOLÓGICAS:");
  lines.push("- Mantenha um peso adequado");
  lines.push("- Cessação tabágica, se necessário");
  lines.push("- Vigilância de TA — deve ser inferior a 140/90 mmHg");
  lines.push("- Promoção de exercício físico: exercício aeróbico moderado (caminhadas com passo vigoroso), pelo menos 45–60 minutos, 4–5x/semana");
  lines.push("- Conselhos para evitar hipoglicemias com exercício: realizar exercício 1–3h depois de comer; ter sempre açúcar no bolso; se exercício intenso ou >1h, medir glicemia capilar no início e no fim; se glicemia >300 mg/dL, não fazer exercício; se exercício >1h, tomar lanche a cada hora; preferir abdómen como local de injeção antes do exercício");
  lines.push("- Dieta equilibrada, polifracionada e diversificada. Se usa insulina ou doses altas de antidiabéticos, comer antes de dormir. Em cada refeição: alimentos farináceos em quantidade moderada (pão, cereais, massa, arroz, batatas cozidas, legumes 2–3x/semana); diariamente fruta e vegetais. Evitar: açúcar, mel, doces, chocolate, fritos, sumos industriais e açucarados. Optar por produtos com pouca gordura. Evitar manteiga, toucinho, enchidos, patés, carnes gordas, batatas fritas, aperitivos e fritos industriais. Reduzir consumo de carnes vermelhas");

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
                <summary className="cursor-pointer text-primary font-medium">Ver outras opções de insulina basal</summary>
                <div className="mt-2 space-y-2">
                  {result.opcoesInsulina.filter(o => !o.recomendado && o.tipo === "basal").map((o, i) => (
                    <div key={i} className="bg-muted rounded-lg p-2">
                      <p className="font-semibold text-foreground">{o.nome}</p>
                      <p className="text-muted-foreground">{o.vantagens[0]} · {o.limitacoes[0]}</p>
                    </div>
                  ))}
                </div>
              </details>
            </div>
          )}

          {/* Pharmacokinetic reference — collapsible */}
          <div className="md:col-span-2">
            <details className="card-clinical">
              <summary className="flex items-center gap-2 text-primary cursor-pointer">
                <Activity className="w-5 h-5" />
                <span className="font-heading font-bold">Perfil farmacológico das insulinas</span>
                <span className="text-xs text-muted-foreground ml-auto font-body">clique para expandir</span>
              </summary>
              <div className="mt-4 space-y-4">
                <p className="text-xs text-muted-foreground">Dados farmacocinéticos de referência — fonte: ALAD/SDNU/SWME 2015</p>

                {/* Basal insulins */}
                <div>
                  <p className="text-xs font-heading font-semibold text-foreground mb-2 flex items-center gap-1.5">
                    <Syringe className="w-3.5 h-3.5 text-primary" /> Insulinas basais
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border bg-muted/50">
                          <th className="text-left py-2 px-2 font-heading font-semibold text-foreground">Insulina</th>
                          <th className="text-left py-2 px-2 font-heading font-semibold text-foreground">Início</th>
                          <th className="text-left py-2 px-2 font-heading font-semibold text-foreground">Pico</th>
                          <th className="text-left py-2 px-2 font-heading font-semibold text-foreground">Duração</th>
                          <th className="text-left py-2 px-2 font-heading font-semibold text-foreground hidden sm:table-cell">Nomes comerciais</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.opcoesInsulina.filter(o => o.tipo === "basal").map((o, i) => (
                          <tr key={i} className={`border-b border-border/50 ${o.recomendado ? "bg-primary/5" : ""}`}>
                            <td className="py-2 px-2 font-body font-medium text-foreground">
                              {o.nome}
                              {o.recomendado && <span className="ml-1 text-[9px] bg-primary text-primary-foreground px-1 py-0.5 rounded">REC</span>}
                            </td>
                            <td className="py-2 px-2 font-body text-muted-foreground">{o.inicioAcao || "—"}</td>
                            <td className="py-2 px-2 font-body text-muted-foreground">{o.picoAcao || "—"}</td>
                            <td className="py-2 px-2 font-body text-muted-foreground">{o.duracaoAcao || "—"}</td>
                            <td className="py-2 px-2 font-body text-muted-foreground hidden sm:table-cell">{o.nomesComerciais?.join(", ") || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Prandial insulins */}
                <div>
                  <p className="text-xs font-heading font-semibold text-foreground mb-2 flex items-center gap-1.5">
                    <Pill className="w-3.5 h-3.5 text-primary" /> Insulinas prandiais (rápidas/ultrarrápidas)
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border bg-muted/50">
                          <th className="text-left py-2 px-2 font-heading font-semibold text-foreground">Insulina</th>
                          <th className="text-left py-2 px-2 font-heading font-semibold text-foreground">Início</th>
                          <th className="text-left py-2 px-2 font-heading font-semibold text-foreground">Pico</th>
                          <th className="text-left py-2 px-2 font-heading font-semibold text-foreground">Duração</th>
                          <th className="text-left py-2 px-2 font-heading font-semibold text-foreground hidden sm:table-cell">Nomes comerciais</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.opcoesInsulina.filter(o => o.tipo === "prandial").map((o, i) => (
                          <tr key={i} className="border-b border-border/50">
                            <td className="py-2 px-2 font-body font-medium text-foreground">{o.nome}</td>
                            <td className="py-2 px-2 font-body text-muted-foreground">{o.inicioAcao || "—"}</td>
                            <td className="py-2 px-2 font-body text-muted-foreground">{o.picoAcao || "—"}</td>
                            <td className="py-2 px-2 font-body text-muted-foreground">{o.duracaoAcao || "—"}</td>
                            <td className="py-2 px-2 font-body text-muted-foreground hidden sm:table-cell">{o.nomesComerciais?.join(", ") || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1 italic">Equivalência entre insulina regular e análogos rápidos: 1 U = 1 U. Aspart aprovada para uso na gravidez.</p>
                </div>

                {/* Pre-mix insulins */}
                <div>
                  <p className="text-xs font-heading font-semibold text-foreground mb-2 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-primary" /> Insulinas pré-misturadas (bifásicas)
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border bg-muted/50">
                          <th className="text-left py-2 px-2 font-heading font-semibold text-foreground">Insulina</th>
                          <th className="text-left py-2 px-2 font-heading font-semibold text-foreground">Início</th>
                          <th className="text-left py-2 px-2 font-heading font-semibold text-foreground">Pico</th>
                          <th className="text-left py-2 px-2 font-heading font-semibold text-foreground">Duração</th>
                          <th className="text-left py-2 px-2 font-heading font-semibold text-foreground hidden sm:table-cell">Nomes comerciais</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.opcoesInsulina.filter(o => o.tipo === "pre_mistura").map((o, i) => (
                          <tr key={i} className="border-b border-border/50">
                            <td className="py-2 px-2 font-body font-medium text-foreground">{o.nome}</td>
                            <td className="py-2 px-2 font-body text-muted-foreground">{o.inicioAcao || "—"}</td>
                            <td className="py-2 px-2 font-body text-muted-foreground">{o.picoAcao || "—"}</td>
                            <td className="py-2 px-2 font-body text-muted-foreground">{o.duracaoAcao || "—"}</td>
                            <td className="py-2 px-2 font-body text-muted-foreground hidden sm:table-cell">{o.nomesComerciais?.join(", ") || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1 italic">Pré-misturas: regime mais simples mas menos flexível — impossibilidade de ajustar componentes separadamente.</p>
                </div>
              </div>
            </details>
          </div>

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
          <div className="card-clinical space-y-3 md:col-span-2">
            <div className="flex items-center gap-2 text-primary">
              <Heart className="w-5 h-5" />
              <h3 className="font-heading font-bold">Educação terapêutica</h3>
            </div>
            <div className="space-y-4">
              {(() => {
                const sections: { title: string; items: string[] }[] = [];
                let current: { title: string; items: string[] } | null = null;
                result.educacaoTerapeutica.forEach((e) => {
                  const match = e.match(/^§(.+?)§$/);
                  if (match) {
                    current = { title: match[1], items: [] };
                    sections.push(current);
                  } else if (current) {
                    current.items.push(e);
                  } else {
                    if (!sections.length) sections.push({ title: "", items: [] });
                    sections[0].items.push(e);
                  }
                });
                return sections.map((sec, si) => (
                  <div key={si}>
                    {sec.title && (
                      <p className="text-xs font-heading font-semibold text-foreground mb-1.5 uppercase tracking-wide text-primary/80">{sec.title}</p>
                    )}
                    <ul className="text-xs space-y-1 text-muted-foreground font-body pl-1">
                      {sec.items.map((item, ii) => (
                        <li key={ii} className="flex items-start gap-1.5">
                          <span className="text-primary mt-0.5 shrink-0">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ));
              })()}
            </div>
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
