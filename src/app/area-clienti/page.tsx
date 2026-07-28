import { redirect } from "next/navigation";
import { isDemoMode } from "@/lib/demo";
import { MagicLinkForm } from "@/components/auth/magic-link-form";

export const metadata = { title: "Area clienti" };

export default function AreaClientiLoginPage() {
  if (isDemoMode()) {
    redirect("/area-clienti/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border bg-white/80 px-4 py-4 backdrop-blur">
        <p className="font-display text-xl font-semibold text-sidebar">Fidelio</p>
        <p className="text-xs text-muted">Area clienti</p>
      </header>
      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <MagicLinkForm
          title="Accedi alla tua area"
          subtitle="Riceverai un link via email per vedere veicoli, scadenze e prenotare l'officina."
          redirectTo="/area-clienti/dashboard"
          footerHref="/login"
          footerLabel="Personale concessionaria? Accedi qui"
        />
      </div>
    </div>
  );
}
