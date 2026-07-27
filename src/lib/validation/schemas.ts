import { z } from "zod";
import { targaSchema } from "@/lib/validation/targa";

export const customerSchema = z.object({
  nome: z.string().trim().min(1, "Il nome è obbligatorio"),
  cognome: z.string().trim().min(1, "Il cognome è obbligatorio"),
  email: z.string().trim().email("Email non valida"),
  telefono: z
    .string()
    .trim()
    .min(6, "Telefono non valido")
    .regex(/^[0-9+\s]+$/, "Usa solo numeri e +"),
  dataNascita: z.string().optional().nullable(),
  consensoMarketing: z.coerce.boolean().default(false),
  canalePreferito: z.enum(["EMAIL", "SMS", "WHATSAPP"]).default("EMAIL"),
});

export const vehicleSchema = z.object({
  customerId: z.string().min(1),
  targa: targaSchema,
  vin: z.string().trim().optional().nullable(),
  marca: z.string().trim().min(1, "La marca è obbligatoria"),
  modello: z.string().trim().min(1, "Il modello è obbligatorio"),
  allestimento: z.string().trim().optional().nullable(),
  annoImmatricolazione: z.coerce
    .number()
    .int()
    .min(1980, "Anno non valido")
    .max(new Date().getFullYear() + 1),
  kmAttuali: z.coerce.number().int().min(0, "Km non validi"),
  dataAcquisto: z.string().optional().nullable(),
  acquistatoPressoLocationId: z.string().optional().nullable(),
  fineGaranzia: z.string().optional().nullable(),
  fineFinanziamento: z.string().optional().nullable(),
  prossimaRevisione: z.string().optional().nullable(),
  prossimoTagliandoData: z.string().optional().nullable(),
  prossimoTagliandoKm: z.coerce.number().int().optional().nullable(),
});

export const locationSchema = z.object({
  id: z.string().min(1),
  nome: z.string().trim().min(1, "Nome obbligatorio"),
  indirizzo: z.string().trim().min(1, "Indirizzo obbligatorio"),
  citta: z.string().trim().min(1, "Città obbligatoria"),
  telefono: z.string().trim().min(6, "Telefono non valido"),
  brand: z.string().trim().min(1, "Indica almeno un brand"),
});

export const appointmentRequestSchema = z.object({
  vehicleId: z.string().min(1),
  locationId: z.string().min(1),
  tipo: z.enum(["TAGLIANDO", "REVISIONE", "GOMME", "RIPARAZIONE", "ALTRO"]),
  dataOra: z.string().min(1, "Seleziona uno slot"),
  note: z.string().optional().nullable(),
});

export function parseOptionalDate(value: string | null | undefined): Date | null {
  if (!value || value.trim() === "") return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

export type ActionResult<T = undefined> =
  | { success: true; data?: T; message?: string }
  | { success: false; error: string };
