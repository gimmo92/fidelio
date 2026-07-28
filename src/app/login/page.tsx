import { redirect } from "next/navigation";
import { isDemoMode } from "@/lib/demo";
import { MagicLinkForm } from "@/components/auth/magic-link-form";

export const metadata = { title: "Accesso staff" };

export default function LoginPage() {
  if (isDemoMode()) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <MagicLinkForm
        title="Accesso concessionaria"
        subtitle="Inserisci la tua email aziendale: ti invieremo un link di accesso sicuro."
        redirectTo="/dashboard"
        footerHref="/area-clienti"
        footerLabel="Sei un cliente? Accedi all'area clienti"
      />
    </div>
  );
}
