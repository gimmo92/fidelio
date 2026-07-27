"use server";

import { revalidatePath } from "next/cache";
import { AppointmentStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth/staff";
import { requireCustomer } from "@/lib/auth/customer";
import {
  appointmentRequestSchema,
  type ActionResult,
} from "@/lib/validation/schemas";

export async function confirmAppointment(
  appointmentId: string,
): Promise<void> {
  const staff = await requireStaff();
  const appointment = await prisma.appointment.findFirst({
    where: {
      id: appointmentId,
      location: { groupId: staff.groupId },
    },
  });
  if (!appointment) {
    throw new Error("Appuntamento non trovato");
  }

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: { stato: AppointmentStatus.CONFERMATO },
  });
  revalidatePath("/appuntamenti");
  revalidatePath("/dashboard");
}

export async function cancelAppointment(
  appointmentId: string,
): Promise<void> {
  const staff = await requireStaff();
  const appointment = await prisma.appointment.findFirst({
    where: {
      id: appointmentId,
      location: { groupId: staff.groupId },
    },
  });
  if (!appointment) {
    throw new Error("Appuntamento non trovato");
  }

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: { stato: AppointmentStatus.ANNULLATO },
  });
  revalidatePath("/appuntamenti");
  revalidatePath("/dashboard");
}

export async function requestAppointment(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const customer = await requireCustomer();

  const parsed = appointmentRequestSchema.safeParse({
    vehicleId: formData.get("vehicleId"),
    locationId: formData.get("locationId"),
    tipo: formData.get("tipo"),
    dataOra: formData.get("dataOra"),
    note: formData.get("note") || null,
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dati non validi",
    };
  }

  const vehicle = customer.vehicles.find((v) => v.id === parsed.data.vehicleId);
  if (!vehicle) {
    return { success: false, error: "Veicolo non valido" };
  }

  const location = await prisma.location.findFirst({
    where: { id: parsed.data.locationId, groupId: customer.groupId },
  });
  if (!location) {
    return { success: false, error: "Sede non valida" };
  }

  const dataOra = new Date(parsed.data.dataOra);
  if (Number.isNaN(dataOra.getTime())) {
    return { success: false, error: "Slot non valido" };
  }

  const clash = await prisma.appointment.findFirst({
    where: {
      locationId: location.id,
      dataOra,
      stato: { in: ["RICHIESTO", "CONFERMATO"] },
    },
  });
  if (clash) {
    return {
      success: false,
      error: "Lo slot selezionato non è più disponibile",
    };
  }

  await prisma.appointment.create({
    data: {
      vehicleId: vehicle.id,
      locationId: location.id,
      dataOra,
      tipo: parsed.data.tipo,
      stato: AppointmentStatus.RICHIESTO,
      note: parsed.data.note || "Richiesta da area clienti",
    },
  });

  revalidatePath("/area-clienti/dashboard");
  revalidatePath("/appuntamenti");
  revalidatePath("/dashboard");
  return {
    success: true,
    message: "Richiesta inviata. La concessionaria la confermerà a breve.",
  };
}
