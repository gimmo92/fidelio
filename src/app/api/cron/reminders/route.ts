import { NextResponse } from "next/server";
import { runReminderJob } from "@/lib/reminders/engine";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  try {
    const result = await runReminderJob();
    return NextResponse.json({
      ok: true,
      ...result,
      at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[cron/reminders]", error);
    return NextResponse.json(
      { ok: false, error: "Errore durante l'elaborazione dei promemoria" },
      { status: 500 },
    );
  }
}
