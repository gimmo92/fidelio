import { z } from "zod";

/** Targa italiana post-1994: AA000AA */
export const TARGA_REGEX = /^[A-Z]{2}[0-9]{3}[A-Z]{2}$/;

export function normalizeTarga(value: string): string {
  return value.replace(/[\s-]/g, "").toUpperCase();
}

export const targaSchema = z
  .string()
  .trim()
  .transform(normalizeTarga)
  .refine((v) => TARGA_REGEX.test(v), {
    message: "Targa non valida. Formato atteso: AA000AA (es. GA123BC)",
  });
