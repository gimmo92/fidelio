"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type MagicLinkFormProps = {
  title: string;
  subtitle: string;
  redirectTo: string;
  footerHref?: string;
  footerLabel?: string;
};

export function MagicLinkForm({
  title,
  subtitle,
  redirectTo,
  footerHref,
  footerLabel,
}: MagicLinkFormProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const origin = window.location.origin;
    const { error: authError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
      },
    });

    setLoading(false);
    if (authError) {
      setError(
        authError.message.includes("Invalid")
          ? "Indirizzo email non valido."
          : "Impossibile inviare il link. Riprova tra poco.",
      );
      return;
    }
    setSent(true);
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-border bg-white p-8 shadow-sm">
      <p className="font-display text-3xl font-semibold tracking-tight text-sidebar">
        Fidelio
      </p>
      <h1 className="mt-4 text-xl font-semibold text-foreground">{title}</h1>
      <p className="mt-2 text-sm text-muted">{subtitle}</p>

      {sent ? (
        <div className="mt-8 rounded-lg border border-accent/20 bg-accent-soft p-4 text-sm text-accent">
          Ti abbiamo inviato un magic link a <strong>{email}</strong>. Apri
          l&apos;email e clicca il link per accedere.
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <Input
            label="Email"
            type="email"
            name="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nome@concessionaria.it"
          />
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Invio in corso…" : "Invia magic link"}
          </Button>
        </form>
      )}

      {footerHref && footerLabel && (
        <p className="mt-6 text-center text-sm text-muted">
          <Link href={footerHref} className="text-accent hover:underline">
            {footerLabel}
          </Link>
        </p>
      )}
    </div>
  );
}
