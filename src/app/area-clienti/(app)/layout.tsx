import Link from "next/link";
import { redirect } from "next/navigation";
import { requireCustomer } from "@/lib/auth/customer";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AreaClientiAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const customer = await requireCustomer();

  return (
    <div className="min-h-screen pb-20">
      <header className="sticky top-0 z-20 border-b border-border bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <div>
            <p className="font-display text-xl font-semibold text-sidebar">
              Fidelio
            </p>
            <p className="text-xs text-muted">
              Ciao, {customer.nome}
            </p>
          </div>
          <form
            action={async () => {
              "use server";
              const supabase = await createClient();
              await supabase.auth.signOut();
              redirect("/area-clienti");
            }}
          >
            <button
              type="submit"
              className="text-sm text-muted hover:text-foreground"
            >
              Esci
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-6">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 border-t border-border bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-lg">
          <Link
            href="/area-clienti/dashboard"
            className="flex-1 py-3 text-center text-sm font-medium text-foreground"
          >
            I miei veicoli
          </Link>
          <Link
            href="/area-clienti/prenota"
            className="flex-1 py-3 text-center text-sm font-medium text-accent"
          >
            Prenota
          </Link>
        </div>
      </nav>
    </div>
  );
}
