"use server";

import { revalidatePath } from "next/cache";
import { ReminderStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth/staff";
import type { ActionResult } from "@/lib/validation/schemas";
import { locationSchema } from "@/lib/validation/schemas";

export async function markReminderConverted(
  reminderId: string,
): Promise<void> {
  const staff = await requireStaff();
  const reminder = await prisma.reminder.findFirst({
    where: {
      id: reminderId,
      vehicle: { customer: { groupId: staff.groupId } },
    },
  });
  if (!reminder) {
    throw new Error("Promemoria non trovato");
  }

  await prisma.reminder.update({
    where: { id: reminderId },
    data: { stato: ReminderStatus.CONVERTITO },
  });
  revalidatePath("/promemoria");
  revalidatePath("/dashboard");
}

export async function markReminderIgnored(
  reminderId: string,
): Promise<void> {
  const staff = await requireStaff();
  const reminder = await prisma.reminder.findFirst({
    where: {
      id: reminderId,
      vehicle: { customer: { groupId: staff.groupId } },
    },
  });
  if (!reminder) {
    throw new Error("Promemoria non trovato");
  }

  await prisma.reminder.update({
    where: { id: reminderId },
    data: { stato: ReminderStatus.IGNORATO },
  });
  revalidatePath("/promemoria");
  revalidatePath("/dashboard");
}

export async function updateLocation(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const staff = await requireStaff();
  if (staff.ruolo !== "OWNER") {
    return {
      success: false,
      error: "Solo il titolare può modificare le sedi",
    };
  }

  const parsed = locationSchema.safeParse({
    id: formData.get("id"),
    nome: formData.get("nome"),
    indirizzo: formData.get("indirizzo"),
    citta: formData.get("citta"),
    telefono: formData.get("telefono"),
    brand: formData.get("brand"),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dati non validi",
    };
  }

  const location = await prisma.location.findFirst({
    where: { id: parsed.data.id, groupId: staff.groupId },
  });
  if (!location) {
    return { success: false, error: "Sede non trovata" };
  }

  const brands = parsed.data.brand
    .split(",")
    .map((b) => b.trim())
    .filter(Boolean);

  await prisma.location.update({
    where: { id: location.id },
    data: {
      nome: parsed.data.nome,
      indirizzo: parsed.data.indirizzo,
      citta: parsed.data.citta,
      telefono: parsed.data.telefono,
      brand: brands,
    },
  });

  revalidatePath("/impostazioni");
  return { success: true, message: "Sede aggiornata" };
}
