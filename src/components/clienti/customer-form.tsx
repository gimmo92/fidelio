"use client";

import { useActionState } from "react";
import { createCustomer, updateCustomer } from "@/app/actions/customers";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import type { ActionResult } from "@/lib/validation/schemas";
import type { Customer } from "@prisma/client";

type CustomerFormProps = {
  customer?: Customer;
};

export function CustomerForm({ customer }: CustomerFormProps) {
  const action = customer
    ? updateCustomer.bind(null, customer.id)
    : createCustomer;

  const [state, formAction, pending] = useActionState<
    ActionResult | null,
    FormData
  >(action, null);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Nome"
          name="nome"
          required
          defaultValue={customer?.nome}
        />
        <Input
          label="Cognome"
          name="cognome"
          required
          defaultValue={customer?.cognome}
        />
        <Input
          label="Email"
          name="email"
          type="email"
          required
          defaultValue={customer?.email}
        />
        <Input
          label="Telefono"
          name="telefono"
          required
          defaultValue={customer?.telefono}
        />
        <Input
          label="Data di nascita"
          name="dataNascita"
          type="date"
          defaultValue={
            customer?.dataNascita
              ? customer.dataNascita.toISOString().slice(0, 10)
              : ""
          }
        />
        <Select
          label="Canale preferito"
          name="canalePreferito"
          defaultValue={customer?.canalePreferito ?? "EMAIL"}
          options={[
            { value: "EMAIL", label: "Email" },
            { value: "SMS", label: "SMS" },
            { value: "WHATSAPP", label: "WhatsApp" },
          ]}
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="consensoMarketing"
          defaultChecked={customer?.consensoMarketing ?? false}
          className="rounded border-border"
        />
        Consenso marketing
      </label>

      {state && !state.success && (
        <p className="text-sm text-danger">{state.error}</p>
      )}
      {state && state.success && state.message && (
        <p className="text-sm text-success">{state.message}</p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Salvataggio…" : customer ? "Salva modifiche" : "Crea cliente"}
      </Button>
    </form>
  );
}
