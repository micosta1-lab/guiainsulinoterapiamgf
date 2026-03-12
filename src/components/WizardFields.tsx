import { ReactNode } from "react";
import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SegmentedOptionProps {
  label: string;
  selected: boolean;
  onClick: () => void;
  sublabel?: string;
}

export const SegmentedOption = ({ label, selected, onClick, sublabel }: SegmentedOptionProps) => (
  <button
    type="button"
    onClick={onClick}
    className={`segmented-option text-left ${selected ? "segmented-option-selected" : ""}`}
  >
    <div className="font-medium text-foreground">{label}</div>
    {sublabel && <div className="text-xs text-muted-foreground mt-0.5">{sublabel}</div>}
  </button>
);

interface FieldGroupProps {
  label: string;
  required?: boolean;
  tooltip?: string;
  children: ReactNode;
}

export const FieldGroup = ({ label, required, tooltip, children }: FieldGroupProps) => (
  <div className="space-y-2">
    <label className="flex items-center gap-1.5 text-sm font-heading font-medium text-foreground">
      {label}
      {required && <span className="text-destructive">*</span>}
      {tooltip && (
        <Tooltip>
          <TooltipTrigger asChild>
            <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
          </TooltipTrigger>
          <TooltipContent className="max-w-xs text-xs font-body">
            {tooltip}
          </TooltipContent>
        </Tooltip>
      )}
    </label>
    {children}
  </div>
);

interface NumberInputProps {
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  placeholder?: string;
  unit?: string;
  min?: number;
  max?: number;
}

export const NumberInput = ({ value, onChange, placeholder, unit, min, max }: NumberInputProps) => (
  <div className="flex items-center gap-2">
    <input
      type="number"
      value={value ?? ""}
      onChange={(e) => {
        const v = e.target.value === "" ? undefined : Number(e.target.value);
        onChange(v);
      }}
      placeholder={placeholder}
      min={min}
      max={max}
      className="w-32 px-3 py-2.5 rounded-lg border border-input bg-card text-foreground text-sm font-body focus:outline-none focus:ring-2 focus:ring-ring"
    />
    {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
  </div>
);
