import {
  type PreferredChannel,
  type ReminderType,
  ReminderStatus,
} from "@prisma/client";
import { addDays, addYears, isBefore, startOfDay } from "date-fns";
import { prisma } from "@/lib/db";
import { getMessageProvider } from "@/lib/messaging/console-provider";
import { reminderBody, reminderSubject } from "@/lib/messaging/templates";
import { formatDate } from "@/lib/format";

const WINDOW_DAYS: Partial<Record<ReminderType, number>> = {
  REVISIONE: 30,
  TAGLIANDO: 30,
  GOMME_STAGIONALI: 30,
  FINE_GARANZIA: 60,
  FINE_FINANZIAMENTO: 60,
  COMPLEANNO: 7,
  ANNIVERSARIO_ACQUISTO: 14,
};

function dateOnly(d: Date): Date {
  return startOfDay(d);
}

export async function generateUpcomingReminders() {
  const today = dateOnly(new Date());
  const horizon = addDays(today, 365);
  const vehicles = await prisma.vehicle.findMany({
    include: {
      customer: true,
      reminders: {
        where: {
          dataPrevista: { gte: today },
          stato: { in: [ReminderStatus.PIANIFICATO, ReminderStatus.INVIATO] },
        },
      },
    },
  });

  let created = 0;

  for (const vehicle of vehicles) {
    const candidates: { tipo: ReminderType; data: Date }[] = [];

    if (vehicle.prossimaRevisione) {
      candidates.push({ tipo: "REVISIONE", data: dateOnly(vehicle.prossimaRevisione) });
    }
    if (vehicle.prossimoTagliandoData) {
      candidates.push({ tipo: "TAGLIANDO", data: dateOnly(vehicle.prossimoTagliandoData) });
    }
    if (vehicle.fineGaranzia) {
      candidates.push({ tipo: "FINE_GARANZIA", data: dateOnly(vehicle.fineGaranzia) });
    }
    if (vehicle.fineFinanziamento) {
      candidates.push({
        tipo: "FINE_FINANZIAMENTO",
        data: dateOnly(vehicle.fineFinanziamento),
      });
    }
    if (vehicle.dataAcquisto) {
      const anniversary = addYears(
        dateOnly(vehicle.dataAcquisto),
        new Date().getFullYear() - vehicle.dataAcquisto.getFullYear(),
      );
      if (isBefore(anniversary, today)) {
        candidates.push({
          tipo: "ANNIVERSARIO_ACQUISTO",
          data: addYears(anniversary, 1),
        });
      } else {
        candidates.push({ tipo: "ANNIVERSARIO_ACQUISTO", data: anniversary });
      }
    }
    if (vehicle.customer.dataNascita) {
      const birthday = new Date(
        today.getFullYear(),
        vehicle.customer.dataNascita.getMonth(),
        vehicle.customer.dataNascita.getDate(),
      );
      if (isBefore(birthday, today)) {
        candidates.push({ tipo: "COMPLEANNO", data: addYears(birthday, 1) });
      } else {
        candidates.push({ tipo: "COMPLEANNO", data: birthday });
      }
    }

    // Gomme stagionali: 15 marzo e 15 ottobre
    for (const month of [2, 9]) {
      let seasonal = new Date(today.getFullYear(), month, 15);
      if (isBefore(seasonal, today)) seasonal = addYears(seasonal, 1);
      candidates.push({ tipo: "GOMME_STAGIONALI", data: seasonal });
    }

    for (const candidate of candidates) {
      if (isBefore(candidate.data, today) || candidate.data > horizon) continue;

      const exists = vehicle.reminders.some(
        (r) =>
          r.tipo === candidate.tipo &&
          dateOnly(r.dataPrevista).getTime() === candidate.data.getTime(),
      );
      if (exists) continue;

      try {
        await prisma.reminder.create({
          data: {
            vehicleId: vehicle.id,
            tipo: candidate.tipo,
            dataPrevista: candidate.data,
            stato: ReminderStatus.PIANIFICATO,
          },
        });
        created++;
      } catch {
        // unique constraint — già presente
      }
    }
  }

  return { created };
}

export async function dispatchDueReminders() {
  const today = dateOnly(new Date());
  const reminders = await prisma.reminder.findMany({
    where: {
      stato: ReminderStatus.PIANIFICATO,
      dataPrevista: { gte: today },
    },
    include: {
      vehicle: { include: { customer: true } },
    },
  });

  const provider = getMessageProvider();
  let sent = 0;

  for (const reminder of reminders) {
    const window = WINDOW_DAYS[reminder.tipo] ?? 30;
    const sendFrom = addDays(dateOnly(reminder.dataPrevista), -window);
    if (today < sendFrom) continue;

    const customer = reminder.vehicle.customer;
    const subject = reminderSubject(reminder.tipo);
    const body = reminderBody(reminder.tipo, {
      nome: customer.nome,
      modello: `${reminder.vehicle.marca} ${reminder.vehicle.modello}`,
      targa: reminder.vehicle.targa,
      dataPrevista: formatDate(reminder.dataPrevista),
    });

    const channel = customer.canalePreferito as PreferredChannel;
    const to =
      channel === "EMAIL" ? customer.email : customer.telefono;

    await provider.send({
      to,
      channel,
      subject,
      body,
    });

    await prisma.$transaction([
      prisma.communicationLog.create({
        data: {
          customerId: customer.id,
          reminderId: reminder.id,
          canale: channel,
          oggetto: subject,
          corpo: body,
          esito: "SIMULATO",
        },
      }),
      prisma.reminder.update({
        where: { id: reminder.id },
        data: {
          stato: ReminderStatus.INVIATO,
          inviatoIl: new Date(),
        },
      }),
    ]);

    sent++;
  }

  return { sent };
}

export async function runReminderJob() {
  const generated = await generateUpcomingReminders();
  const dispatched = await dispatchDueReminders();
  return { ...generated, ...dispatched };
}
