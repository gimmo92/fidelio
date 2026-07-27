import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth/staff";
import { LocationForm } from "@/components/staff/location-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Impostazioni" };

export default async function ImpostazioniPage() {
  const staff = await requireStaff();
  const locations = await prisma.location.findMany({
    where: { groupId: staff.groupId },
    orderBy: { nome: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Impostazioni
        </h1>
        <p className="mt-1 text-sm text-muted">
          Dati sedi del gruppo {staff.group.nome}
        </p>
      </div>

      {staff.ruolo !== "OWNER" && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-warning">
          Solo il titolare può modificare le sedi. Visualizzazione in sola
          lettura.
        </p>
      )}

      <div className="space-y-4">
        {locations.map((location) => (
          <section
            key={location.id}
            className="rounded-xl border border-border bg-card p-6 shadow-sm"
          >
            <h2 className="font-semibold">{location.nome}</h2>
            <p className="text-sm text-muted">
              {location.brand.join(" · ")}
            </p>
            {staff.ruolo === "OWNER" ? (
              <div className="mt-4">
                <LocationForm location={location} />
              </div>
            ) : (
              <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted">Indirizzo</dt>
                  <dd>
                    {location.indirizzo}, {location.citta}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted">Telefono</dt>
                  <dd>{location.telefono}</dd>
                </div>
              </dl>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
