"use client";

import { useActionState } from "react";
import { createVehicle, updateVehicle } from "@/app/actions/customers";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import type { ActionResult } from "@/lib/validation/schemas";
import type { Location, Vehicle } from "@prisma/client";

type VehicleFormProps = {
  customerId: string;
  vehicle?: Vehicle;
  locations: Location[];
};

export function VehicleForm({
  customerId,
  vehicle,
  locations,
}: VehicleFormProps) {
  const action = vehicle
    ? updateVehicle.bind(null, vehicle.id)
    : createVehicle;

  const [state, formAction, pending] = useActionState<
    ActionResult | null,
    FormData
  >(action, null);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="customerId" value={customerId} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Input
          label="Targa"
          name="targa"
          required
          placeholder="GA123BC"
          defaultValue={vehicle?.targa}
        />
        <Input label="VIN" name="vin" defaultValue={vehicle?.vin ?? ""} />
        <Input
          label="Marca"
          name="marca"
          required
          defaultValue={vehicle?.marca}
        />
        <Input
          label="Modello"
          name="modello"
          required
          defaultValue={vehicle?.modello}
        />
        <Input
          label="Allestimento"
          name="allestimento"
          defaultValue={vehicle?.allestimento ?? ""}
        />
        <Input
          label="Anno immatricolazione"
          name="annoImmatricolazione"
          type="number"
          required
          defaultValue={vehicle?.annoImmatricolazione ?? new Date().getFullYear()}
        />
        <Input
          label="Km attuali"
          name="kmAttuali"
          type="number"
          required
          defaultValue={vehicle?.kmAttuali ?? 0}
        />
        <Input
          label="Data acquisto"
          name="dataAcquisto"
          type="date"
          defaultValue={isoDate(vehicle?.dataAcquisto)}
        />
        <Select
          label="Acquistato presso"
          name="acquistatoPressoLocationId"
          defaultValue={vehicle?.acquistatoPressoLocationId ?? ""}
          options={[
            { value: "", label: "—" },
            ...locations.map((l) => ({ value: l.id, label: l.nome })),
          ]}
        />
        <Input
          label="Fine garanzia"
          name="fineGaranzia"
          type="date"
          defaultValue={isoDate(vehicle?.fineGaranzia)}
        />
        <Input
          label="Fine finanziamento"
          name="fineFinanziamento"
          type="date"
          defaultValue={isoDate(vehicle?.fineFinanziamento)}
        />
        <Input
          label="Prossima revisione"
          name="prossimaRevisione"
          type="date"
          defaultValue={isoDate(vehicle?.prossimaRevisione)}
        />
        <Input
          label="Prossimo tagliando (data)"
          name="prossimoTagliandoData"
          type="date"
          defaultValue={isoDate(vehicle?.prossimoTagliandoData)}
        />
        <Input
          label="Prossimo tagliando (km)"
          name="prossimoTagliandoKm"
          type="number"
          defaultValue={vehicle?.prossimoTagliandoKm ?? ""}
        />
      </div>

      {state && !state.success && (
        <p className="text-sm text-danger">{state.error}</p>
      )}
      {state && state.success && state.message && (
        <p className="text-sm text-success">{state.message}</p>
      )}

      <Button type="submit" disabled={pending}>
        {pending
          ? "Salvataggio…"
          : vehicle
            ? "Salva veicolo"
            : "Aggiungi veicolo"}
      </Button>
    </form>
  );
}

function isoDate(d?: Date | null) {
  return d ? d.toISOString().slice(0, 10) : "";
}
