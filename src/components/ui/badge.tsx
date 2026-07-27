import { cn } from "@/lib/utils";

const tones = {
  neutral: "bg-slate-100 text-slate-700",
  success: "bg-emerald-50 text-success",
  warning: "bg-amber-50 text-warning",
  danger: "bg-red-50 text-danger",
  info: "bg-blue-50 text-info",
  accent: "bg-accent-soft text-accent",
} as const;

type BadgeProps = {
  children: React.ReactNode;
  tone?: keyof typeof tones;
  className?: string;
};

export function Badge({ children, tone = "neutral", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function appointmentBadgeTone(
  stato: string,
): keyof typeof tones {
  switch (stato) {
    case "RICHIESTO":
      return "warning";
    case "CONFERMATO":
      return "info";
    case "COMPLETATO":
      return "success";
    case "ANNULLATO":
      return "neutral";
    default:
      return "neutral";
  }
}

export function reminderBadgeTone(stato: string): keyof typeof tones {
  switch (stato) {
    case "PIANIFICATO":
      return "info";
    case "INVIATO":
      return "warning";
    case "CONVERTITO":
      return "success";
    case "IGNORATO":
      return "neutral";
    default:
      return "neutral";
  }
}
