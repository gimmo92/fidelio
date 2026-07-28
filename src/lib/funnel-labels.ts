import type {
  FunnelChannel,
  FunnelStatus,
  FunnelStepKind,
  FunnelTriggerType,
} from "@prisma/client";

export const FUNNEL_STATUS_LABELS: Record<FunnelStatus, string> = {
  BOZZA: "Bozza",
  ATTIVO: "Attivo",
  IN_PAUSA: "In pausa",
  ARCHIVIATO: "Archiviato",
};

export const FUNNEL_TRIGGER_LABELS: Record<FunnelTriggerType, string> = {
  DORMIENTE_OFFICINA: "Cliente dormiente officina",
  FINESTRA_RIACQUISTO: "Finestra riacquisto / permuta",
  PROFILO_INCOMPLETO: "Profilo incompleto",
  STAGIONALE_GOMME: "Stagionale gomme",
  CUSTOM: "Personalizzato",
};

export const FUNNEL_CHANNEL_LABELS: Record<FunnelChannel, string> = {
  EMAIL: "Email",
  SMS: "SMS",
  WHATSAPP: "WhatsApp",
  CHIAMATA_STAFF: "Chiamata staff",
  EVENTO: "Evento",
};

export const FUNNEL_STEP_KIND_LABELS: Record<FunnelStepKind, string> = {
  MESSAGGIO: "Messaggio",
  OFFERTA: "Offerta",
  EVENTO: "Evento",
  HANDOFF_STAFF: "Passaggio allo staff",
};

export const FUNNEL_TRIGGERS = Object.keys(
  FUNNEL_TRIGGER_LABELS,
) as FunnelTriggerType[];

export const FUNNEL_CHANNELS = Object.keys(
  FUNNEL_CHANNEL_LABELS,
) as FunnelChannel[];

export const FUNNEL_STEP_KINDS = Object.keys(
  FUNNEL_STEP_KIND_LABELS,
) as FunnelStepKind[];
