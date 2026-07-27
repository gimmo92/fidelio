"use client";

import { useActionState, useMemo, useState } from "react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { requestAppointment } from "@/app/actions/appointments";
import { Button } from "@/components/ui/button";
import { Select, Textarea } from "@/components/ui/input";
import { SERVICE_TYPE_LABELS, SERVICE_TYPES } from "@/lib/labels";
import { getAvailableSlots, groupSlotsByDay } from "@/lib/slots";
import type { ActionResult } from "@/lib/validation/schemas";
import type { Location, Vehicle } from "@prisma/client";

type PrenotaFormProps = {
  vehicles: Vehicle[];
  locations: Location[];
  takenSlots: string[];
};

export function PrenotaForm({
  vehicles,
  locations,
  takenSlots,
}: PrenotaFormProps) {
  const [vehicleId, setVehicleId] = useState(vehicles[0]?.id ?? "");
  const [locationId, setLocationId] = useState(locations[0]?.id ?? "");
  const [tipo, setTipo] = useState<(typeof SERVICE_TYPES)[number]>("TAGLIANDO");
  const [selectedSlot, setSelectedSlot] = useState("");

  const [state, formAction, pending] = useActionState<
    ActionResult | null,
    FormData
  >(requestAppointment, null);

  const slots = useMemo(() => {
    const taken = takenSlots
      .filter((s) => s.startsWith(locationId))
      .map((s) => new Date(s.split("|")[1]!));
    return groupSlotsByDay(getAvailableSlots(new Date(), 14, taken)).slice(0, 7);
  }, [locationId, takenSlots]);

  if (vehicles.length === 0) {
    return (
      <p className="text-sm text-muted">
        Non hai veicoli associati. Contatta la concessionaria.
      </p>
    );
  }

  if (state?.success) {
    return (
      <div className="rounded-xl border border-accent/20 bg-accent-soft p-5 text-sm text-accent">
        <p className="font-semibold">Richiesta inviata</p>
        <p className="mt-1">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <Select
        label="Veicolo"
        name="vehicleId"
        value={vehicleId}
        onChange={(e) => setVehicleId(e.target.value)}
        options={vehicles.map((v) => ({
          value: v.id,
          label: `${v.marca} ${v.modello} · ${v.targa}`,
        }))}
      />

      <Select
        label="Sede"
        name="locationId"
        value={locationId}
        onChange={(e) => {
          setLocationId(e.target.value);
          setSelectedSlot("");
        }}
        options={locations.map((l) => ({
          value: l.id,
          label: `${l.nome} (${l.citta})`,
        }))}
      />

      <Select
        label="Tipo intervento"
        name="tipo"
        value={tipo}
        onChange={(e) =>
          setTipo(e.target.value as (typeof SERVICE_TYPES)[number])
        }
        options={SERVICE_TYPES.map((t) => ({
          value: t,
          label: SERVICE_TYPE_LABELS[t],
        }))}
      />

      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-700">Slot disponibile</p>
        <input type="hidden" name="dataOra" value={selectedSlot} />
        <div className="space-y-4">
          {slots.map((group) => (
            <div key={group.day}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                {format(new Date(group.day), "EEEE d MMMM", { locale: it })}
              </p>
              <div className="flex flex-wrap gap-2">
                {group.slots.map((slot) => {
                  const value = slot.toISOString();
                  const active = selectedSlot === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setSelectedSlot(value)}
                      className={`rounded-lg border px-3 py-1.5 text-sm ${
                        active
                          ? "border-accent bg-accent text-white"
                          : "border-border bg-white hover:border-accent/50"
                      }`}
                    >
                      {format(slot, "HH:mm")}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Textarea label="Note (opzionale)" name="note" rows={3} />

      {state && !state.success && (
        <p className="text-sm text-danger">{state.error}</p>
      )}

      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={pending || !selectedSlot}
      >
        {pending ? "Invio…" : "Invia richiesta"}
      </Button>
    </form>
  );
}
