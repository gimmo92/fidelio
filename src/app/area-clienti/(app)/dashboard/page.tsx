import Link from "next/link";
import { requireCustomer } from "@/lib/auth/customer";
import { formatDate, formatKm } from "@/lib/format";
import { SERVICE_TYPE_LABELS } from "@/lib/labels";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "I miei veicoli" };

export default async function AreaClientiDashboardPage() {
  const customer = await requireCustomer();

  const vehicles = await prisma.vehicle.findMany({
    where: { customerId: customer.id },
    include: {
      serviceRecords: {
        orderBy: { data: "desc" },
        take: 5,
        include: { location: true },
      },
      reminders: {
        where: {
          stato: { in: ["PIANIFICATO", "INVIATO"] },
          dataPrevista: { gte: new Date() },
        },
        orderBy: { dataPrevista: "asc" },
        take: 5,
      },
    },
    orderBy: { targa: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          I tuoi veicoli
        </h1>
        <p className="mt-1 text-sm text-muted">
          Scadenze, storico e prenotazioni per {customer.group.nome}
        </p>
      </div>

      <Link href="/area-clienti/prenota">
        <Button className="w-full" size="lg">
          Prenota intervento
        </Button>
      </Link>

      {vehicles.length === 0 && (
        <p className="rounded-xl border border-dashed border-border bg-white p-6 text-center text-sm text-muted">
          Nessun veicolo associato al tuo account. Contatta la concessionaria.
        </p>
      )}

      {vehicles.map((v) => (
        <section
          key={v.id}
          className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4"
        >
          <div>
            <p className="text-lg font-semibold">
              {v.marca} {v.modello}
            </p>
            <p className="font-mono text-accent">{v.targa}</p>
            <p className="mt-1 text-sm text-muted">
              {v.annoImmatricolazione} · {formatKm(v.kmAttuali)}
            </p>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-slate-700">
              Prossime scadenze
            </h2>
            <ul className="mt-2 space-y-2 text-sm">
              {v.prossimaRevisione && (
                <li className="flex justify-between">
                  <span>Revisione</span>
                  <span>{formatDate(v.prossimaRevisione)}</span>
                </li>
              )}
              {v.prossimoTagliandoData && (
                <li className="flex justify-between">
                  <span>Tagliando</span>
                  <span>{formatDate(v.prossimoTagliandoData)}</span>
                </li>
              )}
              {v.fineGaranzia && (
                <li className="flex justify-between">
                  <span>Fine garanzia</span>
                  <span>{formatDate(v.fineGaranzia)}</span>
                </li>
              )}
              {v.reminders.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-2">
                  <Badge tone="warning">{r.tipo.replaceAll("_", " ")}</Badge>
                  <span>{formatDate(r.dataPrevista)}</span>
                </li>
              ))}
              {!v.prossimaRevisione &&
                !v.prossimoTagliandoData &&
                v.reminders.length === 0 && (
                  <li className="text-muted">Nessuna scadenza imminente</li>
                )}
            </ul>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-slate-700">
              Storico interventi
            </h2>
            <ul className="mt-2 space-y-2 text-sm">
              {v.serviceRecords.length === 0 && (
                <li className="text-muted">Nessun intervento registrato</li>
              )}
              {v.serviceRecords.map((s) => (
                <li key={s.id} className="rounded-lg bg-slate-50 px-3 py-2">
                  <p className="font-medium">
                    {SERVICE_TYPE_LABELS[s.tipo]} · {formatDate(s.data)}
                  </p>
                  <p className="text-muted">
                    {s.location.nome} · {s.descrizione}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ))}
    </div>
  );
}
