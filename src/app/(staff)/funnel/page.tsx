import Link from "next/link";
import { Sparkles } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth/staff";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  FUNNEL_STATUS_LABELS,
  FUNNEL_TRIGGER_LABELS,
} from "@/lib/funnel-labels";

export const dynamic = "force-dynamic";
export const metadata = { title: "Funnel loyalty" };

function statusTone(stato: string) {
  switch (stato) {
    case "ATTIVO":
      return "success" as const;
    case "BOZZA":
      return "neutral" as const;
    case "IN_PAUSA":
      return "warning" as const;
    default:
      return "neutral" as const;
  }
}

export default async function FunnelListPage() {
  const staff = await requireStaff();
  const funnels = await prisma.marketingFunnel.findMany({
    where: { groupId: staff.groupId },
    include: { _count: { select: { steps: true } } },
    orderBy: [{ stato: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            Funnel loyalty
          </h1>
          <p className="mt-1 text-sm text-muted">
            Automazioni multicanale con trigger, offerte e passaggio allo staff
          </p>
        </div>
        <Link href="/funnel/nuovo">
          <Button>Nuovo funnel</Button>
        </Link>
      </div>

      {funnels.length === 0 ? (
        <EmptyState
          title="Nessun funnel"
          description="Crea il primo funnel loyalty con trigger, step multicanale e offerte."
          actionLabel="Crea funnel"
          actionHref="/funnel/nuovo"
          icon={<Sparkles className="h-10 w-10" />}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {funnels.map((f) => (
            <Link
              key={f.id}
              href={`/funnel/${f.id}`}
              className="rounded-xl border border-border bg-card p-5 shadow-sm transition hover:border-accent/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{f.nome}</p>
                  <p className="mt-1 text-sm text-muted line-clamp-2">
                    {f.descrizione}
                  </p>
                </div>
                <Badge tone={statusTone(f.stato)}>
                  {FUNNEL_STATUS_LABELS[f.stato]}
                </Badge>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <Badge tone="accent">
                  {FUNNEL_TRIGGER_LABELS[f.triggerTipo]}
                </Badge>
                <Badge tone="neutral">{f._count.steps} step</Badge>
              </div>
              <p className="mt-3 text-xs text-muted line-clamp-2">
                KPI: {f.kpiTarget}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
