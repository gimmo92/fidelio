import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth/staff";
import { formatDateTime } from "@/lib/format";
import {
  APPOINTMENT_STATUS_LABELS,
  SERVICE_TYPE_LABELS,
} from "@/lib/labels";
import { Badge, appointmentBadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  cancelAppointment,
  confirmAppointment,
} from "@/app/actions/appointments";
import { CalendarDays } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "Appuntamenti" };

export default async function AppuntamentiPage({
  searchParams,
}: {
  searchParams: Promise<{ sede?: string; stato?: string }>;
}) {
  const staff = await requireStaff();
  const params = await searchParams;
  const sede = params.sede ?? "";
  const stato = params.stato ?? "";

  const locations = await prisma.location.findMany({
    where: { groupId: staff.groupId },
    orderBy: { nome: "asc" },
  });

  const appointments = await prisma.appointment.findMany({
    where: {
      location: {
        groupId: staff.groupId,
        ...(staff.locationId ? { id: staff.locationId } : {}),
        ...(sede ? { id: sede } : {}),
      },
      ...(stato
        ? { stato: stato as "RICHIESTO" | "CONFERMATO" | "COMPLETATO" | "ANNULLATO" }
        : {}),
    },
    include: {
      vehicle: { include: { customer: true } },
      location: true,
    },
    orderBy: { dataOra: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Appuntamenti
        </h1>
        <p className="mt-1 text-sm text-muted">
          Richieste dall&apos;area clienti e calendario officina
        </p>
      </div>

      <form method="get" className="flex flex-wrap gap-2">
        <select
          name="sede"
          defaultValue={sede}
          className="h-10 rounded-lg border border-border bg-white px-3 text-sm"
        >
          <option value="">Tutte le sedi</option>
          {locations.map((l) => (
            <option key={l.id} value={l.id}>
              {l.nome}
            </option>
          ))}
        </select>
        <select
          name="stato"
          defaultValue={stato}
          className="h-10 rounded-lg border border-border bg-white px-3 text-sm"
        >
          <option value="">Tutti gli stati</option>
          {Object.entries(APPOINTMENT_STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <Button type="submit" variant="secondary">
          Filtra
        </Button>
      </form>

      {appointments.length === 0 ? (
        <EmptyState
          title="Nessun appuntamento"
          description="Quando i clienti prenotano dall'area clienti, le richieste compaiono qui."
          icon={<CalendarDays className="h-10 w-10" />}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <ul className="divide-y divide-border">
            {appointments.map((a) => (
              <li
                key={a.id}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium">
                    {formatDateTime(a.dataOra)} · {SERVICE_TYPE_LABELS[a.tipo]}
                  </p>
                  <p className="text-sm text-muted">
                    <Link
                      href={`/clienti/${a.vehicle.customerId}`}
                      className="text-accent hover:underline"
                    >
                      {a.vehicle.customer.nome} {a.vehicle.customer.cognome}
                    </Link>{" "}
                    · {a.vehicle.targa} · {a.location.nome}
                  </p>
                  {a.note && (
                    <p className="mt-1 text-sm text-slate-600">{a.note}</p>
                  )}
                  <Badge tone={appointmentBadgeTone(a.stato)} className="mt-2">
                    {APPOINTMENT_STATUS_LABELS[a.stato]}
                  </Badge>
                </div>
                {a.stato === "RICHIESTO" && (
                  <div className="flex gap-2">
                    <form action={confirmAppointment.bind(null, a.id)}>
                      <Button type="submit" size="sm">
                        Conferma
                      </Button>
                    </form>
                    <form action={cancelAppointment.bind(null, a.id)}>
                      <Button type="submit" size="sm" variant="secondary">
                        Annulla
                      </Button>
                    </form>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
