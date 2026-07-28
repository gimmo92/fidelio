"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { FunnelStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth/staff";
import type { ActionResult } from "@/lib/validation/schemas";

const funnelSchema = z.object({
  nome: z.string().trim().min(1, "Nome obbligatorio"),
  descrizione: z.string().trim().min(1, "Descrizione obbligatoria"),
  triggerTipo: z.enum([
    "DORMIENTE_OFFICINA",
    "FINESTRA_RIACQUISTO",
    "PROFILO_INCOMPLETO",
    "STAGIONALE_GOMME",
    "CUSTOM",
  ]),
  triggerNota: z.string().trim().min(1, "Descrivi il trigger"),
  meccanica: z.string().trim().min(1, "Descrivi la meccanica"),
  kpiTarget: z.string().trim().min(1, "Indica i KPI"),
  notaCompliance: z.string().optional().nullable(),
  stato: z.enum(["BOZZA", "ATTIVO", "IN_PAUSA", "ARCHIVIATO"]).default("BOZZA"),
});

const stepSchema = z.object({
  timingLabel: z.string().trim().min(1),
  giornoOffset: z.coerce.number().int(),
  canale: z.enum(["EMAIL", "SMS", "WHATSAPP", "CHIAMATA_STAFF", "EVENTO"]),
  tipo: z.enum([
    "SWEEPSTAKE",
    "CONTEST",
    "CASHBACK_TRYBUY",
    "SHORT_TIME_OFFER",
    "SHORT_TERM_COLLECTION",
    "LONG_TERM_COLLECTION",
    "MEMBER_GET_MEMBER",
    "INSTANT_WIN",
    "HANDOFF_STAFF",
  ]),
  oggetto: z.string().optional().nullable(),
  corpo: z.string().trim().min(1, "Corpo messaggio obbligatorio"),
  offerta: z.string().optional().nullable(),
  condizione: z.string().optional().nullable(),
});

export async function createFunnel(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const staff = await requireStaff();

  const parsed = funnelSchema.safeParse({
    nome: formData.get("nome"),
    descrizione: formData.get("descrizione"),
    triggerTipo: formData.get("triggerTipo"),
    triggerNota: formData.get("triggerNota"),
    meccanica: formData.get("meccanica"),
    kpiTarget: formData.get("kpiTarget"),
    notaCompliance: formData.get("notaCompliance") || null,
    stato: formData.get("stato") || "BOZZA",
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dati non validi",
    };
  }

  const stepsRaw = formData.get("stepsJson");
  let steps: z.infer<typeof stepSchema>[] = [];
  if (typeof stepsRaw === "string" && stepsRaw.trim()) {
    try {
      const arr = JSON.parse(stepsRaw) as unknown[];
      steps = arr.map((item, idx) => {
        const r = stepSchema.safeParse(item);
        if (!r.success) {
          throw new Error(`Step ${idx + 1}: ${r.error.issues[0]?.message}`);
        }
        return r.data;
      });
    } catch (e) {
      return {
        success: false,
        error: e instanceof Error ? e.message : "Step non validi",
      };
    }
  }

  if (steps.length === 0) {
    return {
      success: false,
      error: "Aggiungi almeno uno step con canale e messaggio",
    };
  }

  let funnelId: string;
  try {
    const funnel = await prisma.marketingFunnel.create({
      data: {
        groupId: staff.groupId,
        ...parsed.data,
        notaCompliance: parsed.data.notaCompliance || null,
        steps: {
          create: steps.map((s, i) => ({
            ordine: i + 1,
            giornoOffset: s.giornoOffset,
            timingLabel: s.timingLabel,
            canale: s.canale,
            tipo: s.tipo,
            oggetto: s.oggetto || null,
            corpo: s.corpo,
            offerta: s.offerta || null,
            condizione: s.condizione || null,
          })),
        },
      },
    });
    funnelId = funnel.id;
  } catch (e) {
    console.error(e);
    return { success: false, error: "Impossibile salvare il funnel" };
  }

  revalidatePath("/funnel");
  redirect(`/funnel/${funnelId}`);
}

export async function updateFunnelStatus(
  funnelId: string,
  stato: FunnelStatus,
): Promise<void> {
  const staff = await requireStaff();
  const funnel = await prisma.marketingFunnel.findFirst({
    where: { id: funnelId, groupId: staff.groupId },
  });
  if (!funnel) throw new Error("Funnel non trovato");

  await prisma.marketingFunnel.update({
    where: { id: funnelId },
    data: { stato },
  });
  revalidatePath("/funnel");
  revalidatePath(`/funnel/${funnelId}`);
}

export async function deleteFunnel(funnelId: string): Promise<void> {
  const staff = await requireStaff();
  const funnel = await prisma.marketingFunnel.findFirst({
    where: { id: funnelId, groupId: staff.groupId },
  });
  if (!funnel) throw new Error("Funnel non trovato");

  await prisma.marketingFunnel.delete({ where: { id: funnelId } });
  revalidatePath("/funnel");
  redirect("/funnel");
}
