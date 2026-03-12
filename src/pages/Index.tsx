import { Syringe, TrendingUp, Shield, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DisclaimerBanner from "@/components/DisclaimerBanner";
import logoUSF from "@/assets/logo-usf-marginal.png";
import logoULS from "@/assets/logo-uls-lisboa.png";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoUSF} alt="USF Marginal" className="h-14 w-auto" />
            <div>
              <h1 className="font-heading text-lg font-bold text-foreground leading-tight">
                Apoio à Insulinoterapia na USF
              </h1>
              <p className="text-xs text-muted-foreground">Algoritmo clínico para DM2</p>
            </div>
          </div>
          <img src={logoULS} alt="ULS Lisboa Ocidental" className="h-8 w-auto hidden sm:block" />
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-4 pb-16 mt-8">
        <div className="max-w-2xl w-full text-center space-y-8">
          <div className="space-y-3">
            <h2 className="font-heading text-3xl md:text-4xl font-extrabold text-foreground leading-tight">
              Apoio à Insulinoterapia na USF
            </h2>
            <p className="text-lg text-muted-foreground font-body max-w-lg mx-auto">
              Algoritmo clínico prático para início e intensificação de insulina em Diabetes Mellitus tipo 2
            </p>
          </div>

          {/* Main action buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
            <button
              onClick={() => navigate("/wizard/primeira")}
              className="btn-primary-large flex flex-col items-center gap-2 py-6"
            >
              <Syringe className="w-7 h-7" />
              <span>Primeira prescrição</span>
              <span className="text-xs font-body font-normal opacity-80">Iniciar insulinoterapia</span>
            </button>
            <button
              onClick={() => navigate("/wizard/intensificar")}
              className="btn-primary-large flex flex-col items-center gap-2 py-6 bg-foreground hover:opacity-90"
            >
              <TrendingUp className="w-7 h-7" />
              <span>Intensificar prescrição</span>
              <span className="text-xs font-body font-normal opacity-80">Ajustar esquema atual</span>
            </button>
          </div>

          {/* Info section */}
          <div className="card-clinical text-left max-w-lg mx-auto">
            <div className="flex items-start gap-3">
              <BookOpen className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div className="space-y-2 text-sm text-muted-foreground font-body">
                <p>
                  Ferramenta concebida para utilização em <strong className="text-foreground">contexto de consulta e seguimento em Cuidados de Saúde Primários</strong> (USF/UCSP).
                </p>
                <p>
                  Baseada em algoritmos clínicos atualizados para apoio à decisão na insulinoterapia em DM2. Os dados introduzidos são processados localmente e não são armazenados.
                </p>
              </div>
            </div>
          </div>

          {/* Safety note */}
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Shield className="w-4 h-4" />
            <span>Dados processados apenas localmente · Sem armazenamento</span>
          </div>
        </div>
      </main>

      <DisclaimerBanner />
    </div>
  );
};

export default Index;
