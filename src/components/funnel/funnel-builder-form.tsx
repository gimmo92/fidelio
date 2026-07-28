"use client";

import { useActionState, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Award,
  CalendarDays,
  Dices,
  Gift,
  GripVertical,
  Layers,
  Mail,
  MessageCircle,
  Phone,
  RefreshCw,
  Smartphone,
  Sparkles,
  Target,
  Trash2,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { createFunnel } from "@/app/actions/funnels";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import {
  FUNNEL_CHANNEL_LABELS,
  FUNNEL_MECHANIC_META,
  FUNNEL_STEP_KIND_LABELS,
  FUNNEL_TRIGGERS,
  FUNNEL_TRIGGER_LABELS,
} from "@/lib/funnel-labels";
import { cn } from "@/lib/utils";
import type { ActionResult } from "@/lib/validation/schemas";
import type { FunnelChannel, FunnelStepKind } from "@prisma/client";

type DraftStep = {
  id: string;
  timingLabel: string;
  giornoOffset: number;
  canale: FunnelChannel;
  tipo: FunnelStepKind;
  oggetto: string;
  corpo: string;
  offerta: string;
  condizione: string;
  kpiClienti: number | "";
  kpiConversione: number | "";
};

const CHANNELS: { value: FunnelChannel; label: string; icon: React.ReactNode }[] =
  [
    { value: "WHATSAPP", label: "WhatsApp", icon: <MessageCircle className="h-4 w-4" /> },
    { value: "EMAIL", label: "Email", icon: <Mail className="h-4 w-4" /> },
    { value: "SMS", label: "SMS", icon: <Smartphone className="h-4 w-4" /> },
    { value: "EVENTO", label: "Evento", icon: <CalendarDays className="h-4 w-4" /> },
    {
      value: "CHIAMATA_STAFF",
      label: "Chiamata staff",
      icon: <Phone className="h-4 w-4" />,
    },
  ];

const MECHANICS: {
  value: FunnelStepKind;
  label: string;
  icon: React.ReactNode;
}[] = [
  { value: "SWEEPSTAKE", label: "Sweepstake", icon: <Dices className="h-4 w-4" /> },
  { value: "CONTEST", label: "Contest", icon: <Trophy className="h-4 w-4" /> },
  {
    value: "CASHBACK_TRYBUY",
    label: "Cashback / Try&Buy",
    icon: <RefreshCw className="h-4 w-4" />,
  },
  {
    value: "SHORT_TIME_OFFER",
    label: "Short Time Offer",
    icon: <Zap className="h-4 w-4" />,
  },
  {
    value: "SHORT_TERM_COLLECTION",
    label: "Short Term Collection",
    icon: <Layers className="h-4 w-4" />,
  },
  {
    value: "LONG_TERM_COLLECTION",
    label: "Long Term Collection",
    icon: <Award className="h-4 w-4" />,
  },
  {
    value: "MEMBER_GET_MEMBER",
    label: "Member Get Member",
    icon: <Users className="h-4 w-4" />,
  },
  {
    value: "INSTANT_WIN",
    label: "Instant win",
    icon: <Sparkles className="h-4 w-4" />,
  },
  {
    value: "HANDOFF_STAFF",
    label: "Passaggio staff",
    icon: <Target className="h-4 w-4" />,
  },
];

function newId() {
  return `step-${Math.random().toString(36).slice(2, 10)}`;
}

function createStep(
  canale: FunnelChannel,
  tipo: FunnelStepKind,
  order: number,
): DraftStep {
  return {
    id: newId(),
    timingLabel: order === 0 ? "Giorno 0" : `Giorno ${order * 7}`,
    giornoOffset: order * 7,
    canale,
    tipo,
    oggetto: `${FUNNEL_STEP_KIND_LABELS[tipo]} · ${FUNNEL_CHANNEL_LABELS[canale]}`,
    corpo: "",
    offerta: "",
    condizione: "",
    kpiClienti: "",
    kpiConversione: "",
  };
}

export function FunnelBuilderForm() {
  const [steps, setSteps] = useState<DraftStep[]>([]);
  const [blockChannel, setBlockChannel] = useState<FunnelChannel>("WHATSAPP");
  const [blockMechanic, setBlockMechanic] =
    useState<FunnelStepKind>("SHORT_TIME_OFFER");
  const [draggingBlock, setDraggingBlock] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [state, formAction, pending] = useActionState<
    ActionResult | null,
    FormData
  >(createFunnel, null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const payloadSteps = useMemo(
    () =>
      steps.map(
        ({
          timingLabel,
          giornoOffset,
          canale,
          tipo,
          oggetto,
          corpo,
          offerta,
          condizione,
          kpiClienti,
          kpiConversione,
        }) => ({
          timingLabel,
          giornoOffset,
          canale,
          tipo,
          oggetto,
          corpo,
          offerta,
          condizione,
          kpiClienti: kpiClienti === "" ? null : kpiClienti,
          kpiConversione: kpiConversione === "" ? null : kpiConversione,
        }),
      ),
    [steps],
  );

  function appendStep(canale: FunnelChannel, tipo: FunnelStepKind) {
    const step = createStep(canale, tipo, steps.length);
    setSteps((prev) => [...prev, step]);
    setExpandedId(step.id);
  }

  function updateStep(id: string, patch: Partial<DraftStep>) {
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  function removeStep(id: string) {
    setSteps((prev) => prev.filter((s) => s.id !== id));
    if (expandedId === id) setExpandedId(null);
  }

  function onDragStart(event: DragStartEvent) {
    if (String(event.active.id) === "compose-block") {
      setDraggingBlock(true);
    }
  }

  function onDragEnd(event: DragEndEvent) {
    setDraggingBlock(false);
    const { active, over } = event;
    if (!over) return;

    // Drop composed block onto timeline
    if (String(active.id) === "compose-block") {
      const overId = String(over.id);
      if (overId === "funnel-canvas" || overId.startsWith("drop-") || overId.startsWith("step-")) {
        appendStep(blockChannel, blockMechanic);
      }
      return;
    }

    // Reorder steps
    if (String(active.id).startsWith("step-")) {
      const oldIndex = steps.findIndex((s) => s.id === active.id);
      const overRaw = String(over.id);
      const overStepId = overRaw.startsWith("drop-")
        ? overRaw.slice(5)
        : overRaw;
      const newIndex = steps.findIndex((s) => s.id === overStepId);
      if (oldIndex >= 0 && newIndex >= 0 && oldIndex !== newIndex) {
        setSteps((prev) => arrayMove(prev, oldIndex, newIndex));
      }
    }
  }

  return (
    <form action={formAction} className="space-y-8">
      <input type="hidden" name="stepsJson" value={JSON.stringify(payloadSteps)} />

      <section className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="font-semibold">Impostazioni funnel</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Nome"
            name="nome"
            required
            placeholder="Es. Riattivazione dormienti"
          />
          <Select
            label="Trigger"
            name="triggerTipo"
            defaultValue="DORMIENTE_OFFICINA"
            options={FUNNEL_TRIGGERS.map((t) => ({
              value: t,
              label: FUNNEL_TRIGGER_LABELS[t],
            }))}
          />
        </div>
        <Textarea
          label="Descrizione"
          name="descrizione"
          required
          rows={2}
          placeholder="Cosa fa questo funnel in una frase"
        />
        <Textarea
          label="Dettaglio trigger"
          name="triggerNota"
          required
          rows={2}
          placeholder="Quando entra un cliente in questo funnel"
        />
        <Textarea
          label="Meccanica complessiva"
          name="meccanica"
          required
          rows={2}
          placeholder="Urgenza, scarsità, lead magnet…"
        />
        <Textarea
          label="KPI target"
          name="kpiTarget"
          required
          rows={2}
          placeholder="Es. tasso riattivazione 8–15%"
        />
        <Textarea
          label="Nota compliance (opzionale)"
          name="notaCompliance"
          rows={2}
          placeholder="Es. DPR 430/2001 per concorsi a premi"
        />
        <Select
          label="Stato iniziale"
          name="stato"
          defaultValue="BOZZA"
          options={[
            { value: "BOZZA", label: "Bozza" },
            { value: "ATTIVO", label: "Attivo" },
            { value: "IN_PAUSA", label: "In pausa" },
          ]}
        />
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="font-semibold">Componi il funnel</h2>
          <p className="text-sm text-muted">
            Nel blocco scegli <strong>canale</strong> e <strong>meccanica</strong>,
            poi trascinalo sulla timeline. Riordina gli step trascinandoli.
          </p>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        >
          <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
            <ComposeBlock
              channel={blockChannel}
              mechanic={blockMechanic}
              onChannelChange={setBlockChannel}
              onMechanicChange={setBlockMechanic}
              onAdd={() => appendStep(blockChannel, blockMechanic)}
            />

            <FunnelCanvas count={steps.length}>
              {steps.length === 0 ? (
                <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-white/60 px-6 py-12 text-center">
                  <p className="font-medium">Timeline vuota</p>
                  <p className="mt-1 max-w-sm text-sm text-muted">
                    Configura canale + meccanica nel blocco a sinistra e
                    trascinalo qui.
                  </p>
                </div>
              ) : (
                <SortableContext
                  items={steps.map((s) => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <ol className="space-y-3">
                    {steps.map((step, index) => (
                      <SortableStepCard
                        key={step.id}
                        step={step}
                        index={index}
                        expanded={expandedId === step.id}
                        onToggle={() =>
                          setExpandedId((id) =>
                            id === step.id ? null : step.id,
                          )
                        }
                        onChange={(patch) => updateStep(step.id, patch)}
                        onRemove={() => removeStep(step.id)}
                      />
                    ))}
                  </ol>
                </SortableContext>
              )}
            </FunnelCanvas>
          </div>

          <DragOverlay>
            {draggingBlock ? (
              <div className="w-72 rounded-xl border border-accent bg-white p-4 shadow-xl">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Azione
                </p>
                <p className="mt-2 text-sm font-semibold">
                  {FUNNEL_CHANNEL_LABELS[blockChannel]} ·{" "}
                  {FUNNEL_STEP_KIND_LABELS[blockMechanic]}
                </p>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </section>

      {state && !state.success && (
        <p className="text-sm text-danger">{state.error}</p>
      )}

      <Button type="submit" disabled={pending || steps.length === 0} size="lg">
        {pending ? "Salvataggio…" : "Crea funnel"}
      </Button>
    </form>
  );
}

function ComposeBlock({
  channel,
  mechanic,
  onChannelChange,
  onMechanicChange,
  onAdd,
}: {
  channel: FunnelChannel;
  mechanic: FunnelStepKind;
  onChannelChange: (c: FunnelChannel) => void;
  onMechanicChange: (t: FunnelStepKind) => void;
  onAdd: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: "compose-block",
    data: {
      source: "compose",
      canale: channel,
      tipo: mechanic,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-xl border border-border bg-card p-4 shadow-sm lg:sticky lg:top-4 lg:self-start",
        isDragging && "opacity-40",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold">Blocco azione</p>
        <button
          type="button"
          className="cursor-grab touch-none rounded-md border border-border p-1.5 text-muted hover:bg-slate-50 active:cursor-grabbing"
          aria-label="Trascina sulla timeline"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </div>
      <p className="mt-1 text-xs text-muted">
        Seleziona canale e meccanica nello stesso blocco, poi trascina.
      </p>

      <div className="mt-4 space-y-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
            Canale
          </p>
          <div className="grid grid-cols-1 gap-1.5">
            {CHANNELS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => onChannelChange(c.value)}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition",
                  channel === c.value
                    ? "border-accent bg-accent-soft text-accent"
                    : "border-border bg-white hover:border-accent/40",
                )}
              >
                {c.icon}
                <span className="font-medium">{c.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
            Meccanica loyalty
          </p>
          <div className="grid max-h-72 grid-cols-1 gap-1.5 overflow-y-auto pr-1">
            {MECHANICS.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => onMechanicChange(m.value)}
                className={cn(
                  "flex items-start gap-2 rounded-lg border px-3 py-2 text-left text-sm transition",
                  mechanic === m.value
                    ? "border-accent bg-accent-soft text-accent"
                    : "border-border bg-white hover:border-accent/40",
                )}
              >
                <span className="mt-0.5 shrink-0">{m.icon}</span>
                <span>
                  <span className="block font-medium">{m.label}</span>
                  <span className="block text-[11px] opacity-75">
                    {FUNNEL_MECHANIC_META[m.value].stage}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-dashed border-accent/40 bg-accent-soft/50 px-3 py-3">
        <p className="text-xs text-muted">Anteprima blocco</p>
        <p className="mt-1 text-sm font-semibold text-accent">
          {FUNNEL_CHANNEL_LABELS[channel]} · {FUNNEL_STEP_KIND_LABELS[mechanic]}
        </p>
        <p className="mt-1 text-[11px] font-medium text-slate-600">
          {FUNNEL_MECHANIC_META[mechanic].subtitle}
        </p>
        <p className="mt-2 text-xs text-slate-600">
          {FUNNEL_MECHANIC_META[mechanic].description}
        </p>
        <p className="mt-2 text-[11px] text-muted">
          KPI: {FUNNEL_MECHANIC_META[mechanic].kpi.join(" · ")}
        </p>
        <p className="mt-3 text-xs text-muted">
          Trascina dalla maniglia in alto, oppure:
        </p>
        <Button type="button" size="sm" className="mt-2 w-full" onClick={onAdd}>
          Aggiungi alla timeline
        </Button>
      </div>
    </div>
  );
}

function FunnelCanvas({
  children,
  count,
}: {
  children: React.ReactNode;
  count: number;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: "funnel-canvas" });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-h-64 rounded-xl border border-border bg-slate-50/80 p-4 transition",
        isOver && "border-accent bg-accent-soft/40 ring-2 ring-accent/20",
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold">Timeline funnel</p>
        <p className="text-xs text-muted">{count} step</p>
      </div>
      {children}
    </div>
  );
}

function SortableStepCard({
  step,
  index,
  expanded,
  onToggle,
  onChange,
  onRemove,
}: {
  step: DraftStep;
  index: number;
  expanded: boolean;
  onToggle: () => void;
  onChange: (patch: Partial<DraftStep>) => void;
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: step.id });

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `drop-${step.id}`,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={(node) => {
        setNodeRef(node);
        setDropRef(node);
      }}
      style={style}
      className={cn(
        "rounded-xl border bg-white shadow-sm",
        isDragging && "opacity-60",
        isOver ? "border-accent ring-2 ring-accent/20" : "border-border",
      )}
    >
      <div className="flex items-start gap-2 p-3">
        <button
          type="button"
          className="mt-1 cursor-grab touch-none text-muted active:cursor-grabbing"
          aria-label="Trascina per riordinare"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onToggle}
          className="min-w-0 flex-1 text-left"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">
              Step {index + 1}
            </span>
            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium">
              {FUNNEL_CHANNEL_LABELS[step.canale]}
            </span>
            <span className="rounded-md bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent">
              {FUNNEL_STEP_KIND_LABELS[step.tipo]}
            </span>
            <span className="text-xs text-muted">{step.timingLabel}</span>
            {(step.kpiClienti !== "" || step.kpiConversione !== "") && (
              <span className="rounded-md border border-border bg-white px-2 py-0.5 text-xs tabular-nums text-slate-700">
                {step.kpiClienti !== "" && (
                  <span>{step.kpiClienti.toLocaleString("it-IT")} clienti</span>
                )}
                {step.kpiClienti !== "" && step.kpiConversione !== "" && " · "}
                {step.kpiConversione !== "" && (
                  <span className="text-accent">{step.kpiConversione}%</span>
                )}
              </span>
            )}
          </div>
          <p className="mt-1 truncate text-sm text-slate-600">
            {step.oggetto || step.corpo || "Clicca per compilare il contenuto…"}
          </p>
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="rounded-md p-1.5 text-muted hover:bg-red-50 hover:text-danger"
          aria-label="Rimuovi step"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {expanded && (
        <div className="space-y-3 border-t border-border px-4 py-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-slate-700">Canale</span>
              <select
                className="h-10 w-full rounded-lg border border-border px-3 text-sm"
                value={step.canale}
                onChange={(e) =>
                  onChange({ canale: e.target.value as FunnelChannel })
                }
              >
                {CHANNELS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-slate-700">Meccanica</span>
              <select
                className="h-10 w-full rounded-lg border border-border px-3 text-sm"
                value={step.tipo}
                onChange={(e) =>
                  onChange({ tipo: e.target.value as FunnelStepKind })
                }
              >
                {MECHANICS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-slate-700">Timing</span>
              <input
                className="h-10 w-full rounded-lg border border-border px-3 text-sm"
                value={step.timingLabel}
                onChange={(e) => onChange({ timingLabel: e.target.value })}
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-slate-700">Offset giorni</span>
              <input
                type="number"
                className="h-10 w-full rounded-lg border border-border px-3 text-sm"
                value={step.giornoOffset}
                onChange={(e) =>
                  onChange({ giornoOffset: Number(e.target.value) })
                }
              />
            </label>
          </div>
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-slate-700">Oggetto</span>
            <input
              className="h-10 w-full rounded-lg border border-border px-3 text-sm"
              value={step.oggetto}
              onChange={(e) => onChange({ oggetto: e.target.value })}
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="font-medium text-slate-700">Corpo messaggio</span>
            <textarea
              className="min-h-24 w-full rounded-lg border border-border px-3 py-2 text-sm"
              value={step.corpo}
              onChange={(e) => onChange({ corpo: e.target.value })}
              placeholder="Testo dell'azione…"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-slate-700">Offerta</span>
              <input
                className="h-10 w-full rounded-lg border border-border px-3 text-sm"
                value={step.offerta}
                onChange={(e) => onChange({ offerta: e.target.value })}
                placeholder="Es. Tagliando -20% entro il 15/09"
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-slate-700">Condizione</span>
              <input
                className="h-10 w-full rounded-lg border border-border px-3 text-sm"
                value={step.condizione}
                onChange={(e) => onChange({ condizione: e.target.value })}
                placeholder="Es. Solo se non ha risposto"
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-slate-700">KPI · n. clienti</span>
              <input
                type="number"
                min={0}
                className="h-10 w-full rounded-lg border border-border px-3 text-sm"
                value={step.kpiClienti}
                onChange={(e) =>
                  onChange({
                    kpiClienti:
                      e.target.value === "" ? "" : Number(e.target.value),
                  })
                }
                placeholder="Es. 420"
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="font-medium text-slate-700">KPI · % conversione</span>
              <input
                type="number"
                min={0}
                max={100}
                step={0.1}
                className="h-10 w-full rounded-lg border border-border px-3 text-sm"
                value={step.kpiConversione}
                onChange={(e) =>
                  onChange({
                    kpiConversione:
                      e.target.value === "" ? "" : Number(e.target.value),
                  })
                }
                placeholder="Es. 12.5"
              />
            </label>
          </div>
        </div>
      )}
    </li>
  );
}
