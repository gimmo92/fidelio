import Link from "next/link";
import { CustomerForm } from "@/components/clienti/customer-form";
import { requireStaff } from "@/lib/auth/staff";

export const metadata = { title: "Nuovo cliente" };

export default async function NuovoClientePage() {
  await requireStaff();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/clienti" className="text-sm text-accent hover:underline">
          ← Torna ai clienti
        </Link>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">
          Nuovo cliente
        </h1>
      </div>
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <CustomerForm />
      </div>
    </div>
  );
}
