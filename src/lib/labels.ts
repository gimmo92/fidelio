import type {
  AppointmentStatus,
  PreferredChannel,
  ReminderStatus,
  ReminderType,
  ServiceType,
  StaffRole,
} from "@prisma/client";

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  TAGLIANDO: "Tagliando",
  REVISIONE: "Revisione",
  GOMME: "Gomme",
  RIPARAZIONE: "Riparazione",
  ALTRO: "Altro",
};

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  RICHIESTO: "Richiesto",
  CONFERMATO: "Confermato",
  COMPLETATO: "Completato",
  ANNULLATO: "Annullato",
};

export const REMINDER_TYPE_LABELS: Record<ReminderType, string> = {
  REVISIONE: "Revisione",
  TAGLIANDO: "Tagliando",
  GOMME_STAGIONALI: "Gomme stagionali",
  FINE_GARANZIA: "Fine garanzia",
  FINE_FINANZIAMENTO: "Fine finanziamento",
  COMPLEANNO: "Compleanno",
  ANNIVERSARIO_ACQUISTO: "Anniversario acquisto",
};

export const REMINDER_STATUS_LABELS: Record<ReminderStatus, string> = {
  PIANIFICATO: "Pianificato",
  INVIATO: "Inviato",
  CONVERTITO: "Convertito",
  IGNORATO: "Ignorato",
};

export const CHANNEL_LABELS: Record<PreferredChannel, string> = {
  EMAIL: "Email",
  SMS: "SMS",
  WHATSAPP: "WhatsApp",
};

export const STAFF_ROLE_LABELS: Record<StaffRole, string> = {
  OWNER: "Titolare",
  SALES: "Vendite",
  SERVICE: "Officina",
};

export const SERVICE_TYPES = Object.keys(SERVICE_TYPE_LABELS) as ServiceType[];
