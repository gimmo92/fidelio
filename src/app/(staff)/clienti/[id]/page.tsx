import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth/staff";
import { formatCurrency, formatDate, formatDateTime, formatKm } from "@/lib/format";
import {
  APPOINTMENT_STATUS_LABELS,
  CHANNEL_LABELS,
  SERVICE_TYPE_LABELS,
} from "@/lib/labels";
import { Badge, appointmentBadgeTone } from "@/components/ui/badge";
import { CustomerForm } from "@/components/clienti/customer-form";
import { VehicleForm } from "@/components/clienti/vehicle-form";
import { deleteCustomer, deleteVehicle } from "@/app/actions/customers";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = await prisma.customer.findUnique({ where: { id } });
  return {
    title: customer ? `${customer.cognome} ${customer.nome}` : "Cliente",
  };
}

export default async function ClienteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const staff = await requireStaff();
  const { id } = await params;

  const customer = await prisma.customer.findFirst({
    where: { id, groupId: staff.groupId },
    include: {
      vehicles: {
        include: {
          serviceRecords: { include: { location: true }, orderBy: { data: "desc" } },
          appointments: { include: { location: true }, orderBy: { dataOra: "desc" } },
        },
        orderBy: { targa: "asc" },
      },
      communications: { orderBy: { inviatoIl: "desc" }, take: 50 },
    },
  });

  if (!customer) notFound();

  const locations = await prisma.location.findMany({
    where: { groupId: staff.groupId },
    orderBy: { nome: "asc" },
  });

  type TimelineItem = {
    id: string;
    date: Date;
    kind: "intervento" | "appuntamento" | "comunicazione";
    title: string;
    detail: string;
  };

  const timeline: TimelineItem[] = [];

  for (const v of customer.vehicles) {
    for (const s of v.serviceRecords) {
      timeline.push({
        id: `s-${s.id}`,
        date: s.data,
        kind: "intervento",
        title: `${SERVICE_TYPE_LABELS[s.tipo]} · ${v.targa}`,
        detail: `${s.descrizione} · ${formatCurrency(Number(s.importo))} · ${s.location.nome} · ${formatKm(s.kmAlMomento)}`,
      });
    }
    for (const a of v.appointments) {
      timeline.push({
        id: `a-${a.id}`,
        date: a.dataOra,
        kind: "appuntamento",
        title: `${SERVICE_TYPE_LABELS[a.tipo]} · ${v.targa}`,
        detail: `${formatDateTime(a.dataOra)} · ${APPOINTMENT_STATUS_LABELS[a.stato]} · ${a.location.nome}${a.note ? ` · ${a.note}` : ""}`,
      });
    }
  }

  for (const c of customer.communications) {
    timeline.push({
      id: `c-${c.id}`,
      date: c.inviatoIl,
      kind: "comunicazione",
      title: c.oggetto,
      detail: `${CHANNEL_LABELS[c.canale]} · ${c.esito} · ${c.corpo}`,
    });
  }

  timeline.sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href="/clienti" className="text-sm text-accent hover:underline">
            ← Clienti
          </Link>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">
            {customer.cognome} {customer.nome}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {customer.telefono} · {customer.email} · canale{" "}
            {CHANNEL_LABELS[customer.canalePreferito]}
          </p>
        </div>
        <form action={deleteCustomer.bind(null, customer.id)}>
          <Button type="submit" variant="danger" size="sm">
            Elimina cliente
          </Button>
        </form>
      </div>

      <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Dati anagrafici</h2>
        <div className="mt-4">
          <CustomerForm customer={customer} />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">
          Veicoli ({customer.vehicles.length})
        </h2>
        {customer.vehicles.map((v) => (
          <div
            key={v.id}
            className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">
                  {v.marca} {v.modello}{" "}
                  <span className="font-mono text-accent">{v.targa}</span>
                </p>
                <p className="text-sm text-muted">
                  {v.annoImmatricolazione} · {formatKm(v.kmAttuali)} · revisione{" "}
                  {formatDate(v.prossimaRevisione)} · tagliando{" "}
                  {formatDate(v.prossimoTagliandoData)}
                </p>
              </div>
              <form action={deleteVehicle.bind(null, v.id)}>
                <Button type="submit" variant="ghost" size="sm">
                  Elimina
                </Button>
              </form>
            </div>
            <VehicleForm
              customerId={customer.id}
              vehicle={v}
              locations={locations}
            />
          </div>
        ))}

        <div className="rounded-xl border border-dashed border-border bg-white/70 p-6">
          <h3 className="font-semibold">Aggiungi veicolo</h3>
          <div className="mt-4">
            <VehicleForm customerId={customer.id} locations={locations} />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Timeline</h2>
        {timeline.length === 0 ? (
          <p className="mt-4 text-sm text-muted">Nessun evento registrato.</p>
        ) : (
          <ol className="mt-4 space-y-4">
            {timeline.slice(0, 40).map((item) => (
              <li key={item.id} className="flex gap-4">
                <div className="w-24 shrink-0 text-xs text-muted tabular-nums">
                  {formatDate(item.date)}
                </div>
                <div className="min-w-0 flex-1 border-l border-border pl-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      tone={
                        item.kind === "intervento"
                          ? "success"
                          : item.kind === "appuntamento"
                            ? appointmentBadgeTone("RICHIESTO")
                            : "info"
                      }
                    >
                      {item.kind}
                    </Badge>
                    <p className="font-medium">{item.title}</p>
                  </div>
                  <p className="mt-1 text-sm text-muted line-clamp-3">
                    {item.detail}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
