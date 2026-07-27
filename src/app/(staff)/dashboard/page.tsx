import Link from "next/link";
import {
  addMonths,
  addDays,
  startOfWeek,
  endOfWeek,
  subMonths,
} from "date-fns";
import {
  AlertTriangle,
  Bell,
  CalendarClock,
  Car,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth/staff";
import { formatDate, formatDateTime } from "@/lib/format";
import {
  APPOINTMENT_STATUS_LABELS,
  REMINDER_TYPE_LABELS,
  SERVICE_TYPE_LABELS,
} from "@/lib/labels";
import { Badge, appointmentBadgeTone, reminderBadgeTone } from "@/components/ui/badge";
import { confirmAppointment } from "@/app/actions/appointments";
import { markReminderConverted } from "@/app/actions/reminders";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard" };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const staff = await requireStaff();
  const { view } = await searchParams;
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const twelveMonthsAgo = subMonths(now, 12);
  const inSixMonths = addMonths(now, 6);
  const fourYearsAgoYear = now.getFullYear() - 4;

  const locationFilter = staff.locationId
    ? { locationId: staff.locationId }
    : { location: { groupId: staff.groupId } };

  const [
    pendingAppointments,
    outgoingReminders,
    atRiskCount,
    repurchaseCount,
    pendingList,
    reminderList,
    atRiskCustomers,
    repurchaseVehicles,
  ] = await Promise.all([
    prisma.appointment.count({
      where: { ...locationFilter, stato: "RICHIESTO" },
    }),
    prisma.reminder.count({
      where: {
        stato: "INVIATO",
        inviatoIl: { gte: weekStart, lte: addDays(weekEnd, 1) },
        vehicle: { customer: { groupId: staff.groupId } },
      },
    }),
    prisma.customer.count({
      where: {
        groupId: staff.groupId,
        vehicles: {
          some: {
            AND: [
              { serviceRecords: { none: { data: { gte: twelveMonthsAgo } } } },
              { serviceRecords: { some: {} } },
            ],
          },
        },
      },
    }),
    prisma.vehicle.count({
      where: {
        customer: { groupId: staff.groupId },
        OR: [
          { annoImmatricolazione: { lte: fourYearsAgoYear } },
          {
            fineFinanziamento: {
              gte: now,
              lte: inSixMonths,
            },
          },
        ],
      },
    }),
    prisma.appointment.findMany({
      where: { ...locationFilter, stato: "RICHIESTO" },
      include: {
        vehicle: { include: { customer: true } },
        location: true,
      },
      orderBy: { dataOra: "asc" },
      take: 20,
    }),
    prisma.reminder.findMany({
      where: {
        stato: "INVIATO",
        inviatoIl: { gte: weekStart, lte: addDays(weekEnd, 1) },
        vehicle: { customer: { groupId: staff.groupId } },
      },
      include: {
        vehicle: { include: { customer: true } },
        communications: { orderBy: { inviatoIl: "desc" }, take: 1 },
      },
      orderBy: { inviatoIl: "desc" },
      take: 20,
    }),
    prisma.customer.findMany({
      where: {
        groupId: staff.groupId,
        vehicles: {
          some: {
            AND: [
              { serviceRecords: { none: { data: { gte: twelveMonthsAgo } } } },
              { serviceRecords: { some: {} } },
            ],
          },
        },
      },
      include: {
        vehicles: {
          include: {
            serviceRecords: { orderBy: { data: "desc" }, take: 1 },
          },
        },
      },
      take: 20,
    }),
    prisma.vehicle.findMany({
      where: {
        customer: { groupId: staff.groupId },
        OR: [
          { annoImmatricolazione: { lte: fourYearsAgoYear } },
          {
            fineFinanziamento: {
              gte: now,
              lte: inSixMonths,
            },
          },
        ],
      },
      include: { customer: true },
      take: 20,
    }),
  ]);

  const cards = [
    {
      key: "appuntamenti",
      title: "Da confermare",
      value: pendingAppointments,
      hint: "Appuntamenti in attesa",
      icon: CalendarClock,
      href: "/dashboard?view=appuntamenti",
    },
    {
      key: "promemoria",
      title: "In uscita",
      value: outgoingReminders,
      hint: "Promemoria questa settimana",
      icon: Bell,
      href: "/dashboard?view=promemoria",
    },
    {
      key: "rischio",
      title: "A rischio",
      value: atRiskCount,
      hint: "Nessun intervento da 12+ mesi",
      icon: AlertTriangle,
      href: "/dashboard?view=rischio",
    },
    {
      key: "riacquisto",
      title: "Riacquisto",
      value: repurchaseCount,
      hint: "Età ≥ 4 anni o fine finanziamento",
      icon: Car,
      href: "/dashboard?view=riacquisto",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Buongiorno, {staff.nome.split(" ")[0]}
        </h1>
        <p className="mt-1 text-muted">
          Panoramica operativa · {staff.group.nome}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          const active = view === card.key;
          return (
            <Link
              key={card.key}
              href={card.href}
              className={`rounded-xl border bg-card p-5 shadow-sm transition hover:border-accent/40 ${
                active ? "border-accent ring-2 ring-accent/20" : "border-border"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted">{card.title}</p>
                  <p className="mt-2 text-3xl font-semibold tabular-nums">
                    {card.value}
                  </p>
                  <p className="mt-1 text-xs text-muted">{card.hint}</p>
                </div>
                <div className="rounded-lg bg-accent-soft p-2 text-accent">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {view === "appuntamenti" && (
        <Section title="Appuntamenti da confermare">
          {pendingList.length === 0 ? (
            <p className="text-sm text-muted">Nessuna richiesta in coda.</p>
          ) : (
            <ul className="divide-y divide-border">
              {pendingList.map((a) => (
                <li
                  key={a.id}
                  className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium">
                      {a.vehicle.customer.nome} {a.vehicle.customer.cognome} ·{" "}
                      {a.vehicle.targa}
                    </p>
                    <p className="text-sm text-muted">
                      {formatDateTime(a.dataOra)} ·{" "}
                      {SERVICE_TYPE_LABELS[a.tipo]} · {a.location.nome}
                    </p>
                    <Badge tone={appointmentBadgeTone(a.stato)} className="mt-2">
                      {APPOINTMENT_STATUS_LABELS[a.stato]}
                    </Badge>
                  </div>
                  <form action={confirmAppointment.bind(null, a.id)}>
                    <Button type="submit" size="sm">
                      Conferma
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </Section>
      )}

      {view === "promemoria" && (
        <Section title="Promemoria in uscita questa settimana">
          {reminderList.length === 0 ? (
            <p className="text-sm text-muted">Nessun promemoria inviato.</p>
          ) : (
            <ul className="divide-y divide-border">
              {reminderList.map((r) => (
                <li
                  key={r.id}
                  className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-medium">
                      {r.vehicle.customer.nome} {r.vehicle.customer.cognome} ·{" "}
                      {REMINDER_TYPE_LABELS[r.tipo]}
                    </p>
                    <p className="text-sm text-muted">
                      {r.vehicle.marca} {r.vehicle.modello} · {r.vehicle.targa} ·
                      scadenza {formatDate(r.dataPrevista)}
                    </p>
                    {r.communications[0] && (
                      <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                        {r.communications[0].corpo}
                      </p>
                    )}
                    <Badge tone={reminderBadgeTone(r.stato)} className="mt-2">
                      {r.stato}
                    </Badge>
                  </div>
                  <form action={markReminderConverted.bind(null, r.id)}>
                    <Button type="submit" size="sm" variant="secondary">
                      Segna convertito
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/promemoria"
            className="mt-4 inline-block text-sm text-accent hover:underline"
          >
            Vai alla coda completa →
          </Link>
        </Section>
      )}

      {view === "rischio" && (
        <Section title='Clienti "a rischio"'>
          {atRiskCustomers.length === 0 ? (
            <p className="text-sm text-muted">Nessun cliente a rischio.</p>
          ) : (
            <ul className="divide-y divide-border">
              {atRiskCustomers.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <div>
                    <p className="font-medium">
                      {c.nome} {c.cognome}
                    </p>
                    <p className="text-sm text-muted">
                      Ultimo intervento:{" "}
                      {formatDate(
                        c.vehicles.flatMap((v) => v.serviceRecords)[0]?.data,
                      )}
                    </p>
                  </div>
                  <Link href={`/clienti/${c.id}`}>
                    <Button size="sm" variant="secondary">
                      Apri scheda
                    </Button>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Section>
      )}

      {view === "riacquisto" && (
        <Section title="Veicoli in finestra riacquisto">
          {repurchaseVehicles.length === 0 ? (
            <p className="text-sm text-muted">Nessun veicolo in finestra.</p>
          ) : (
            <ul className="divide-y divide-border">
              {repurchaseVehicles.map((v) => (
                <li
                  key={v.id}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <div>
                    <p className="font-medium">
                      {v.marca} {v.modello} · {v.targa}
                    </p>
                    <p className="text-sm text-muted">
                      {v.customer.nome} {v.customer.cognome} · immat.{" "}
                      {v.annoImmatricolazione}
                      {v.fineFinanziamento
                        ? ` · fine fin. ${formatDate(v.fineFinanziamento)}`
                        : ""}
                    </p>
                  </div>
                  <Link href={`/clienti/${v.customerId}`}>
                    <Button size="sm" variant="secondary">
                      Apri scheda
                    </Button>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Section>
      )}

      {!view && (
        <Section title="Azioni rapide">
          <div className="flex flex-wrap gap-3">
            <Link href="/clienti/nuovo">
              <Button>Nuovo cliente</Button>
            </Link>
            <Link href="/clienti/import">
              <Button variant="secondary">Import CSV</Button>
            </Link>
            <Link href="/appuntamenti">
              <Button variant="secondary">Calendario appuntamenti</Button>
            </Link>
          </div>
        </Section>
      )}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}
