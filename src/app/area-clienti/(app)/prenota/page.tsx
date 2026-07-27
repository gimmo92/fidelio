import { requireCustomer } from "@/lib/auth/customer";
import { prisma } from "@/lib/db";
import { PrenotaForm } from "@/components/clienti/prenota-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Prenota intervento" };

export default async function PrenotaPage() {
  const customer = await requireCustomer();

  const [vehicles, locations, taken] = await Promise.all([
    prisma.vehicle.findMany({
      where: { customerId: customer.id },
      orderBy: { targa: "asc" },
    }),
    prisma.location.findMany({
      where: { groupId: customer.groupId },
      orderBy: { nome: "asc" },
    }),
    prisma.appointment.findMany({
      where: {
        location: { groupId: customer.groupId },
        stato: { in: ["RICHIESTO", "CONFERMATO"] },
        dataOra: { gte: new Date() },
      },
      select: { locationId: true, dataOra: true },
    }),
  ]);

  const takenSlots = taken.map(
    (t) => `${t.locationId}|${t.dataOra.toISOString()}`,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Prenota intervento
        </h1>
        <p className="mt-1 text-sm text-muted">
          Scegli sede, tipo e uno slot disponibile. La richiesta arriverà in
          stato &quot;Richiesto&quot;.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <PrenotaForm
          vehicles={vehicles}
          locations={locations}
          takenSlots={takenSlots}
        />
      </div>
    </div>
  );
}
