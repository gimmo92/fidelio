import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth/staff";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";

export const dynamic = "force-dynamic";
export const metadata = { title: "Clienti" };

export default async function ClientiPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; sede?: string }>;
}) {
  const staff = await requireStaff();
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const page = Math.max(1, Number(params.page ?? "1") || 1);
  const pageSize = 20;
  const sede = params.sede ?? "";

  const locations = await prisma.location.findMany({
    where: { groupId: staff.groupId },
    orderBy: { nome: "asc" },
  });

  const where = {
    groupId: staff.groupId,
    AND: [
      q
        ? {
            OR: [
              { nome: { contains: q, mode: "insensitive" as const } },
              { cognome: { contains: q, mode: "insensitive" as const } },
              { telefono: { contains: q } },
              {
                vehicles: {
                  some: {
                    targa: { contains: q.toUpperCase(), mode: "insensitive" as const },
                  },
                },
              },
            ],
          }
        : {},
      sede
        ? {
            vehicles: {
              some: { acquistatoPressoLocationId: sede },
            },
          }
        : {},
    ],
  };

  const [total, customers] = await Promise.all([
    prisma.customer.count({ where }),
    prisma.customer.findMany({
      where,
      include: {
        vehicles: { select: { id: true, targa: true, marca: true, modello: true } },
      },
      orderBy: [{ cognome: "asc" }, { nome: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            Clienti
          </h1>
          <p className="mt-1 text-sm text-muted">
            Anagrafica del gruppo · {total} clienti
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/clienti/import">
            <Button variant="secondary">Import CSV</Button>
          </Link>
          <Link href="/clienti/nuovo">
            <Button>Nuovo cliente</Button>
          </Link>
        </div>
      </div>

      <form method="get" className="flex flex-wrap gap-2">
        {q && <input type="hidden" name="q" value={q} />}
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
        <Button type="submit" variant="secondary" size="sm">
          Filtra sede
        </Button>
      </form>

      <DataTable
        basePath="/clienti"
        searchValue={q}
        searchPlaceholder="Cerca per nome, targa o telefono…"
        page={page}
        pageSize={pageSize}
        total={total}
        rowKey={(c) => c.id}
        rows={customers}
        emptyTitle="Nessun cliente trovato"
        emptyDescription="Prova a cambiare i filtri o importa un CSV."
        columns={[
          {
            key: "nome",
            header: "Cliente",
            render: (c) => (
              <Link
                href={`/clienti/${c.id}`}
                className="font-medium text-accent hover:underline"
              >
                {c.cognome} {c.nome}
              </Link>
            ),
          },
          {
            key: "contatti",
            header: "Contatti",
            render: (c) => (
              <div className="text-sm">
                <div>{c.telefono}</div>
                <div className="text-muted">{c.email}</div>
              </div>
            ),
          },
          {
            key: "veicoli",
            header: "Veicoli",
            render: (c) =>
              c.vehicles.length === 0 ? (
                <span className="text-muted">—</span>
              ) : (
                <span>
                  {c.vehicles
                    .map((v) => `${v.targa} (${v.marca} ${v.modello})`)
                    .join(", ")}
                </span>
              ),
          },
        ]}
      />
    </div>
  );
}
