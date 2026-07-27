import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth/staff";
import { formatDate, formatDateTime } from "@/lib/format";
import {
  CHANNEL_LABELS,
  REMINDER_STATUS_LABELS,
  REMINDER_TYPE_LABELS,
} from "@/lib/labels";
import { Badge, reminderBadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  markReminderConverted,
  markReminderIgnored,
} from "@/app/actions/reminders";

export const dynamic = "force-dynamic";
export const metadata = { title: "Promemoria" };

export default async function PromemoriaPage() {
  const staff = await requireStaff();

  const [queue, history, communications] = await Promise.all([
    prisma.reminder.findMany({
      where: {
        stato: { in: ["PIANIFICATO", "INVIATO"] },
        vehicle: { customer: { groupId: staff.groupId } },
      },
      include: {
        vehicle: { include: { customer: true } },
        communications: { orderBy: { inviatoIl: "desc" }, take: 1 },
      },
      orderBy: [{ stato: "desc" }, { dataPrevista: "asc" }],
      take: 50,
    }),
    prisma.reminder.findMany({
      where: {
        stato: { in: ["CONVERTITO", "IGNORATO"] },
        vehicle: { customer: { groupId: staff.groupId } },
      },
      include: {
        vehicle: { include: { customer: true } },
      },
      orderBy: { dataPrevista: "desc" },
      take: 30,
    }),
    prisma.communicationLog.findMany({
      where: { customer: { groupId: staff.groupId } },
      include: { customer: true, reminder: true },
      orderBy: { inviatoIl: "desc" },
      take: 30,
    }),
  ]);

  const outgoing = queue.filter((r) => r.stato === "INVIATO");
  const planned = queue.filter((r) => r.stato === "PIANIFICATO");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Promemoria
        </h1>
        <p className="mt-1 text-sm text-muted">
          Coda in uscita (simulata) e storico comunicazioni
        </p>
      </div>

      <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-lg font-semibold">In uscita</h2>
        <p className="text-sm text-muted">
          Messaggi già scritti in CommunicationLog tramite ConsoleProvider
        </p>
        <ul className="mt-4 divide-y divide-border">
          {outgoing.length === 0 && (
            <li className="py-6 text-sm text-muted">
              Nessun messaggio in coda. Il cron giornaliero popolerà questa
              sezione.
            </li>
          )}
          {outgoing.map((r) => (
            <li key={r.id} className="space-y-3 py-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-medium">
                    {REMINDER_TYPE_LABELS[r.tipo]} ·{" "}
                    <Link
                      href={`/clienti/${r.vehicle.customerId}`}
                      className="text-accent hover:underline"
                    >
                      {r.vehicle.customer.nome} {r.vehicle.customer.cognome}
                    </Link>
                  </p>
                  <p className="text-sm text-muted">
                    {r.vehicle.marca} {r.vehicle.modello} · {r.vehicle.targa} ·
                    prevista {formatDate(r.dataPrevista)}
                  </p>
                  <Badge tone={reminderBadgeTone(r.stato)} className="mt-2">
                    {REMINDER_STATUS_LABELS[r.stato]}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <form action={markReminderConverted.bind(null, r.id)}>
                    <Button type="submit" size="sm">
                      Convertito
                    </Button>
                  </form>
                  <form action={markReminderIgnored.bind(null, r.id)}>
                    <Button type="submit" size="sm" variant="secondary">
                      Ignora
                    </Button>
                  </form>
                </div>
              </div>
              {r.communications[0] && (
                <div className="rounded-lg bg-slate-50 p-3 text-sm">
                  <p className="font-medium">{r.communications[0].oggetto}</p>
                  <p className="mt-1 text-slate-600">
                    {r.communications[0].corpo}
                  </p>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Pianificati</h2>
        <ul className="mt-4 divide-y divide-border">
          {planned.length === 0 && (
            <li className="py-4 text-sm text-muted">Nessun promemoria pianificato.</li>
          )}
          {planned.map((r) => (
            <li key={r.id} className="flex justify-between gap-3 py-3 text-sm">
              <span>
                {REMINDER_TYPE_LABELS[r.tipo]} · {r.vehicle.targa} ·{" "}
                {r.vehicle.customer.cognome}
              </span>
              <span className="text-muted">{formatDate(r.dataPrevista)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Storico comunicazioni</h2>
        <ul className="mt-4 divide-y divide-border">
          {communications.map((c) => (
            <li key={c.id} className="py-3">
              <p className="font-medium">
                {c.oggetto}{" "}
                <span className="text-sm font-normal text-muted">
                  · {CHANNEL_LABELS[c.canale]} · {formatDateTime(c.inviatoIl)}
                </span>
              </p>
              <p className="text-sm text-muted">
                {c.customer.nome} {c.customer.cognome} · esito {c.esito}
              </p>
              <p className="mt-1 line-clamp-2 text-sm text-slate-600">{c.corpo}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Storico promemoria</h2>
        <ul className="mt-4 divide-y divide-border text-sm">
          {history.map((r) => (
            <li key={r.id} className="flex justify-between gap-3 py-3">
              <span>
                {REMINDER_TYPE_LABELS[r.tipo]} · {r.vehicle.targa}
              </span>
              <Badge tone={reminderBadgeTone(r.stato)}>
                {REMINDER_STATUS_LABELS[r.stato]}
              </Badge>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
