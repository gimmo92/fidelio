import Link from "next/link";
import { requireStaff } from "@/lib/auth/staff";
import { FunnelBuilderForm } from "@/components/funnel/funnel-builder-form";

export const metadata = { title: "Nuovo funnel" };

export default async function NuovoFunnelPage() {
  await requireStaff();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link href="/funnel" className="text-sm text-accent hover:underline">
          ← Funnel loyalty
        </Link>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">
          Nuovo funnel
        </h1>
        <p className="mt-1 text-sm text-muted">
          Definisci trigger, meccanica e una sequenza di azioni multicanale con
          offerte.
        </p>
      </div>
      <FunnelBuilderForm />
    </div>
  );
}
