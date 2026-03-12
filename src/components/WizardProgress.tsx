import { Check } from "lucide-react";

interface WizardProgressProps {
  steps: string[];
  currentStep: number;
}

const WizardProgress = ({ steps, currentStep }: WizardProgressProps) => (
  <nav className="space-y-1">
    {steps.map((step, idx) => {
      const isDone = idx < currentStep;
      const isActive = idx === currentStep;
      const stepClass = isDone
        ? "progress-step progress-step-done"
        : isActive
          ? "progress-step progress-step-active"
          : "progress-step progress-step-pending";

      return (
        <div key={idx} className={stepClass}>
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-heading font-semibold shrink-0 ${
              isDone
                ? "bg-primary/20 text-primary"
                : isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
            }`}
          >
            {isDone ? <Check className="w-4 h-4" /> : idx + 1}
          </div>
          <span className="truncate">{step}</span>
        </div>
      );
    })}
  </nav>
);

export default WizardProgress;
