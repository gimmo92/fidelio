import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth/staff";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  deleteFunnel,
  updateFunnelStatus,
} from "@/app/actions/funnels";
import {
  FUNNEL_CHANNEL_LABELS,
  FUNNEL_MECHANIC_META,
  FUNNEL_STATUS_LABELS,
  FUNNEL_STEP_KIND_LABELS,
  FUNNEL_TRIGGER_LABELS,
} from "@/lib/funnel-labels";
import { FunnelStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const funnel = await prisma.marketingFunnel.findUnique({ where: { id } });
  return { title: funnel?.nome ?? "Funnel" };
}

function channelTone(canale: string) {
  switch (canale) {
    case "WHATSAPP":
      return "success" as const;
    case "EMAIL":
      return "info" as const;
    case "SMS":
      return "warning" as const;
    case "CHIAMATA_STAFF":
      return "danger" as const;
    case "EVENTO":
      return "accent" as const;
    default:
      return "neutral" as const;
  }
}

export default async function FunnelDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const staff = await requireStaff();
  const { id } = await params;

  const funnel = await prisma.marketingFunnel.findFirst({
    where: { id, groupId: staff.groupId },
    include: { steps: { orderBy: { ordine: "asc" } } },
  });
  if (!funnel) notFound();

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Link href="/funnel" className="text-sm text-accent hover:underline">
            ← Funnel loyalty
          </Link>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">
            {funnel.nome}
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-muted">{funnel.descrizione}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge tone="accent">
              {FUNNEL_TRIGGER_LABELS[funnel.triggerTipo]}
            </Badge>
            <Badge
              tone={
                funnel.stato === "ATTIVO"
                  ? "success"
                  : funnel.stato === "IN_PAUSA"
                    ? "warning"
                    : "neutral"
              }
            >
              {FUNNEL_STATUS_LABELS[funnel.stato]}
            </Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {funnel.stato !== "ATTIVO" && (
            <form
              action={updateFunnelStatus.bind(null, funnel.id, FunnelStatus.ATTIVO)}
            >
              <Button type="submit" size="sm">
                Attiva
              </Button>
            </form>
          )}
          {funnel.stato === "ATTIVO" && (
            <form
              action={updateFunnelStatus.bind(
                null,
                funnel.id,
                FunnelStatus.IN_PAUSA,
              )}
            >
              <Button type="submit" size="sm" variant="secondary">
                Metti in pausa
              </Button>
            </form>
          )}
          <form action={deleteFunnel.bind(null, funnel.id)}>
            <Button type="submit" size="sm" variant="danger">
              Elimina
            </Button>
          </form>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <InfoCard title="Trigger" body={funnel.triggerNota} />
        <InfoCard title="Meccanica" body={funnel.meccanica} />
        <InfoCard title="KPI" body={funnel.kpiTarget} />
      </div>

      {funnel.notaCompliance && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-warning">
          <p className="font-semibold">Nota compliance</p>
          <p className="mt-1">{funnel.notaCompliance}</p>
        </div>
      )}

      <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-lg font-semibold">
          Timeline azioni ({funnel.steps.length})
        </h2>
        <ol className="mt-6 space-y-6">
          {funnel.steps.map((step, idx) => (
            <li key={step.id} className="relative flex gap-4">
              <div className="flex w-28 shrink-0 flex-col items-start">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Step {idx + 1}
                </span>
                <span className="mt-1 text-sm font-medium">{step.timingLabel}</span>
                <span className="text-xs text-muted">
                  offset {step.giornoOffset >= 0 ? "+" : ""}
                  {step.giornoOffset}g
                </span>
              </div>
              <div className="min-w-0 flex-1 rounded-lg border border-border bg-slate-50/80 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={channelTone(step.canale)}>
                    {FUNNEL_CHANNEL_LABELS[step.canale]}
                  </Badge>
                  <Badge tone="neutral">
                    {FUNNEL_STEP_KIND_LABELS[step.tipo]}
                  </Badge>
                  <span className="text-xs text-muted">
                    {FUNNEL_MECHANIC_META[step.tipo].stage}
                  </span>
                  {step.oggetto && (
                    <span className="text-sm font-semibold">{step.oggetto}</span>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted">
                  {FUNNEL_MECHANIC_META[step.tipo].subtitle} —{" "}
                  {FUNNEL_MECHANIC_META[step.tipo].description}
                </p>
                <p className="mt-3 text-sm text-slate-700 whitespace-pre-wrap">
                  {step.corpo}
                </p>
                {step.offerta && (
                  <p className="mt-3 rounded-md bg-accent-soft px-3 py-2 text-sm text-accent">
                    <span className="font-semibold">Offerta: </span>
                    {step.offerta}
                  </p>
                )}
                {step.condizione && (
                  <p className="mt-2 text-xs text-muted">
                    Condizione: {step.condizione}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function InfoCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
        {title}
      </p>
      <p className="mt-2 text-sm text-slate-700">{body}</p>
    </div>
  );
}
