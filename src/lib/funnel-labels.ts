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
  SWEEPSTAKE: "Sweepstake",
  CONTEST: "Contest",
  CASHBACK_TRYBUY: "Cashback / Try&Buy",
  SHORT_TIME_OFFER: "Short Time Offer",
  SHORT_TERM_COLLECTION: "Short Term Collection",
  LONG_TERM_COLLECTION: "Long Term Collection",
  MEMBER_GET_MEMBER: "Member Get Member",
  INSTANT_WIN: "Instant win",
  HANDOFF_STAFF: "Passaggio staff",
};

/** Stage journey + descrizione + KPI dal playbook loyalty */
export const FUNNEL_MECHANIC_META: Record<
  FunnelStepKind,
  {
    stage: string;
    subtitle: string;
    description: string;
    kpi: string[];
  }
> = {
  SWEEPSTAKE: {
    stage: "01 · Awareness / Lead generation",
    subtitle: "Concorso a sorte",
    description:
      "Barriera minima e premio alto: massimizza il volume di contatti. Raccolta anagrafica e consensi, con profilazione progressiva.",
    kpi: ["N. lead", "Costo per lead", "% opt-in marketing", "Completezza profilo"],
  },
  CONTEST: {
    stage: "02 · Awareness / Advocacy",
    subtitle: "Concorso a skill, UGC",
    description:
      "Barriera alta: pochi partecipanti ma molto coinvolti. Reach organica, contenuti riutilizzabili e prova sociale.",
    kpi: ["Reach organica", "N. contenuti generati", "Engagement rate", "Share"],
  },
  CASHBACK_TRYBUY: {
    stage: "03 · Considerazione / Trial",
    subtitle: "Cashback, try&buy, soddisfatti o rimborsati",
    description:
      "Abbatte il rischio percepito. Si usa quando la barriera è il prezzo o l’incertezza sulla qualità, non la notorietà.",
    kpi: ["Tasso di prova", "% redemption", "Conversione post-prova"],
  },
  SHORT_TIME_OFFER: {
    stage: "04 · Conversione / Riconversione",
    subtitle: "STO · scarsità temporale",
    description:
      "Comprime il ciclo decisionale e forza chi è già in valutazione a decidere ora. Efficace su preventivi aperti e carrelli abbandonati.",
    kpi: ["Tasso di chiusura", "Time-to-close", "Margine per transazione"],
  },
  SHORT_TERM_COLLECTION: {
    stage: "05 · Retention / Frequenza",
    subtitle: "STC · 6–16 settimane",
    description:
      "Crea un investimento del cliente: chi ha 3 bollini su 5 torna per non perderli. Alza frequenza e scontrino medio nella finestra.",
    kpi: ["Frequenza visite", "Scontrino medio", "% completamento raccolta"],
  },
  LONG_TERM_COLLECTION: {
    stage: "06 · Retention strutturale",
    subtitle: "Tier / status",
    description:
      "Costruisce switching cost nel lungo periodo e legittima il premio di prezzo. Effetto lento: non per obiettivi trimestrali.",
    kpi: ["Retention rate 12/24 mesi", "Quota di spesa", "LTV"],
  },
  MEMBER_GET_MEMBER: {
    stage: "07 · Advocacy",
    subtitle: "Referral",
    description:
      "Trasforma la base clienti in canale di acquisizione. Funziona solo su clienti già soddisfatti.",
    kpi: ["N. referral attivi", "Conversione invitati", "CAC da referral"],
  },
  INSTANT_WIN: {
    stage: "08 · Win-back",
    subtitle: "Instant win + offerta personalizzata",
    description:
      "Il gioco riapre il contatto, l’offerta chiude. Ponte tra acquisizione e retention; efficace sui dormienti profondi. Formalmente è uno sweepstake a esito immediato.",
    kpi: ["Tasso di riattivazione", "Apertura / redemption", "Valore del riattivato"],
  },
  HANDOFF_STAFF: {
    stage: "Operativo",
    subtitle: "Lista chiamate / handoff",
    description:
      "Chiude l’automazione e passa allo staff i casi che meritano una telefonata, con contesto in scheda.",
    kpi: ["Chiamate effettuate", "% ricontatto", "Conversioni post-chiamata"],
  },
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
