# Fidelio

Piattaforma B2B di fidelizzazione clienti per concessionarie auto italiane.

Stack: **Next.js 15** · **TypeScript** · **Tailwind CSS** · **Supabase** (Postgres + Auth) · **Prisma** · deploy su **Vercel**.

## Prerequisiti

- Node.js 20+
- Account [Supabase](https://supabase.com)
- (Opzionale) CLI Vercel per i cron

## Setup Supabase

1. Crea un nuovo progetto Supabase (region consigliata: `eu-central-1`).
2. In **Project Settings → Database** copia:
   - **Connection string** in modalità *Transaction* (porta `6543`) → `DATABASE_URL`
   - **Direct connection** (porta `5432`) → `DIRECT_URL`
3. In **Project Settings → API** copia `URL` e `anon` key.
4. Abilita **Email** auth (magic link) in **Authentication → Providers**.

## Variabili ambiente

Copia `.env.example` in `.env.local` e compila i valori:

```bash
cp .env.example .env.local
```

| Variabile | Descrizione |
|-----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL progetto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chiave anon (client) |
| `DATABASE_URL` | Connection string pooled (Prisma runtime) |
| `DIRECT_URL` | Connection string diretta (migrazioni) |
| `CRON_SECRET` | Secret per proteggere `/api/cron/reminders` |

## Comandi Prisma

```bash
# Genera il client TypeScript
npm run db:generate

# Applica lo schema al database (dev / primo setup)
npm run db:push

# Oppure crea una migrazione versionata
npm run db:migrate

# Apri Prisma Studio
npm run db:studio

# Carica dati demo
npm run db:seed
```

Dopo `db:push` o `db:migrate`, esegui le policy RLS:

1. Apri **Supabase → SQL Editor**
2. Incolla e lancia il contenuto di `supabase/rls.sql`

> Le Server Actions usano Prisma con `DATABASE_URL` (bypass RLS).  
> Le policy proteggono l’accesso diretto via Supabase client (area clienti / client-side).

## Seed demo

```bash
npm run db:seed
```

Crea:

| Entità | Quantità |
|--------|----------|
| Gruppo | 1 — *Gruppo AutoBasso* |
| Sedi | 2 — Torino Centro (FCA), Moncalieri (VW/Audi) |
| Staff | 3 — OWNER / SALES / SERVICE |
| Clienti | 25 |
| Veicoli | 35 (targhe italiane, scadenze su 12 mesi) |
| Interventi | storico realistico (inclusi “a rischio” 12+ mesi) |
| Appuntamenti / promemoria | mix RICHIESTO / CONFERMATO / in coda |

Account staff (collegare a Supabase Auth dopo il setup auth):

- `titolare@autobasso.it` — OWNER, tutte le sedi
- `vendite.torino@autobasso.it` — SALES, Torino
- `officina.moncalieri@autobasso.it` — SERVICE, Moncalieri

## Sviluppo locale

```bash
npm install
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

Apri [http://localhost:3000](http://localhost:3000).

## Modello multi-tenant

```
DealerGroup
  ├── Location (sede, multi-brand)
  ├── StaffUser (location_id null = tutte le sedi)
  └── Customer (appartiene al gruppo)
        └── Vehicle
              ├── ServiceRecord  → Location
              ├── Appointment    → Location
              └── Reminder
                    └── CommunicationLog
```

Isolamento tenant: `group_id` su JWT (`app_metadata`) + RLS in `supabase/rls.sql`.

## Cosa NON è nell’MVP

- Programma punti / livelli fedeltà
- Invio reale email/SMS/WhatsApp (solo provider simulato)
- Integrazione DMS
- Pagamenti
