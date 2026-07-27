"use client";

import { useActionState } from "react";
import { updateLocation } from "@/app/actions/reminders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ActionResult } from "@/lib/validation/schemas";
import type { Location } from "@prisma/client";

export function LocationForm({ location }: { location: Location }) {
  const [state, formAction, pending] = useActionState<
    ActionResult | null,
    FormData
  >(updateLocation, null);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="id" value={location.id} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Nome sede" name="nome" required defaultValue={location.nome} />
        <Input label="Città" name="citta" required defaultValue={location.citta} />
        <Input
          label="Indirizzo"
          name="indirizzo"
          required
          defaultValue={location.indirizzo}
          className="sm:col-span-2"
        />
        <Input
          label="Telefono"
          name="telefono"
          required
          defaultValue={location.telefono}
        />
        <Input
          label="Brand (separati da virgola)"
          name="brand"
          required
          defaultValue={location.brand.join(", ")}
        />
      </div>
      {state && !state.success && (
        <p className="text-sm text-danger">{state.error}</p>
      )}
      {state && state.success && state.message && (
        <p className="text-sm text-success">{state.message}</p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? "Salvataggio…" : "Salva sede"}
      </Button>
    </form>
  );
}
