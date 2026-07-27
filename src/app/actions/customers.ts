"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth/staff";
import {
  customerSchema,
  parseOptionalDate,
  vehicleSchema,
  type ActionResult,
} from "@/lib/validation/schemas";
import { normalizeTarga } from "@/lib/validation/targa";

export async function createCustomer(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const staff = await requireStaff();

  const parsed = customerSchema.safeParse({
    nome: formData.get("nome"),
    cognome: formData.get("cognome"),
    email: formData.get("email"),
    telefono: formData.get("telefono"),
    dataNascita: formData.get("dataNascita") || null,
    consensoMarketing: formData.get("consensoMarketing") === "on",
    canalePreferito: formData.get("canalePreferito") || "EMAIL",
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dati non validi",
    };
  }

  let customerId: string;
  try {
    const customer = await prisma.customer.create({
      data: {
        groupId: staff.groupId,
        ...parsed.data,
        dataNascita: parseOptionalDate(parsed.data.dataNascita),
      },
    });
    customerId = customer.id;
  } catch (e) {
    console.error(e);
    return {
      success: false,
      error: "Impossibile creare il cliente. Email già presente?",
    };
  }

  revalidatePath("/clienti");
  redirect(`/clienti/${customerId}`);
}

export async function updateCustomer(
  customerId: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const staff = await requireStaff();

  const existing = await prisma.customer.findFirst({
    where: { id: customerId, groupId: staff.groupId },
  });
  if (!existing) {
    return { success: false, error: "Cliente non trovato" };
  }

  const parsed = customerSchema.safeParse({
    nome: formData.get("nome"),
    cognome: formData.get("cognome"),
    email: formData.get("email"),
    telefono: formData.get("telefono"),
    dataNascita: formData.get("dataNascita") || null,
    consensoMarketing: formData.get("consensoMarketing") === "on",
    canalePreferito: formData.get("canalePreferito") || "EMAIL",
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dati non validi",
    };
  }

  try {
    await prisma.customer.update({
      where: { id: customerId },
      data: {
        ...parsed.data,
        dataNascita: parseOptionalDate(parsed.data.dataNascita),
      },
    });
    revalidatePath(`/clienti/${customerId}`);
    revalidatePath("/clienti");
    return { success: true, message: "Cliente aggiornato" };
  } catch {
    return { success: false, error: "Errore durante l'aggiornamento" };
  }
}

export async function deleteCustomer(customerId: string): Promise<void> {
  const staff = await requireStaff();
  const existing = await prisma.customer.findFirst({
    where: { id: customerId, groupId: staff.groupId },
  });
  if (!existing) {
    throw new Error("Cliente non trovato");
  }

  await prisma.customer.delete({ where: { id: customerId } });
  revalidatePath("/clienti");
  redirect("/clienti");
}

export async function createVehicle(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const staff = await requireStaff();

  const parsed = vehicleSchema.safeParse({
    customerId: formData.get("customerId"),
    targa: formData.get("targa"),
    vin: formData.get("vin") || null,
    marca: formData.get("marca"),
    modello: formData.get("modello"),
    allestimento: formData.get("allestimento") || null,
    annoImmatricolazione: formData.get("annoImmatricolazione"),
    kmAttuali: formData.get("kmAttuali"),
    dataAcquisto: formData.get("dataAcquisto") || null,
    acquistatoPressoLocationId:
      formData.get("acquistatoPressoLocationId") || null,
    fineGaranzia: formData.get("fineGaranzia") || null,
    fineFinanziamento: formData.get("fineFinanziamento") || null,
    prossimaRevisione: formData.get("prossimaRevisione") || null,
    prossimoTagliandoData: formData.get("prossimoTagliandoData") || null,
    prossimoTagliandoKm: formData.get("prossimoTagliandoKm") || null,
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dati veicolo non validi",
    };
  }

  const customer = await prisma.customer.findFirst({
    where: { id: parsed.data.customerId, groupId: staff.groupId },
  });
  if (!customer) {
    return { success: false, error: "Cliente non trovato" };
  }

  try {
    await prisma.vehicle.create({
      data: {
        customerId: parsed.data.customerId,
        targa: parsed.data.targa,
        vin: parsed.data.vin || null,
        marca: parsed.data.marca,
        modello: parsed.data.modello,
        allestimento: parsed.data.allestimento || null,
        annoImmatricolazione: parsed.data.annoImmatricolazione,
        kmAttuali: parsed.data.kmAttuali,
        kmAggiornatiIl: new Date(),
        dataAcquisto: parseOptionalDate(parsed.data.dataAcquisto),
        acquistatoPressoLocationId:
          parsed.data.acquistatoPressoLocationId || null,
        fineGaranzia: parseOptionalDate(parsed.data.fineGaranzia),
        fineFinanziamento: parseOptionalDate(parsed.data.fineFinanziamento),
        prossimaRevisione: parseOptionalDate(parsed.data.prossimaRevisione),
        prossimoTagliandoData: parseOptionalDate(
          parsed.data.prossimoTagliandoData,
        ),
        prossimoTagliandoKm: parsed.data.prossimoTagliandoKm || null,
      },
    });
    revalidatePath(`/clienti/${parsed.data.customerId}`);
    return { success: true, message: "Veicolo aggiunto" };
  } catch {
    return {
      success: false,
      error: "Impossibile salvare il veicolo. Targa già presente?",
    };
  }
}

export async function updateVehicle(
  vehicleId: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const staff = await requireStaff();

  const vehicle = await prisma.vehicle.findFirst({
    where: { id: vehicleId, customer: { groupId: staff.groupId } },
  });
  if (!vehicle) {
    return { success: false, error: "Veicolo non trovato" };
  }

  const parsed = vehicleSchema.safeParse({
    customerId: vehicle.customerId,
    targa: formData.get("targa"),
    vin: formData.get("vin") || null,
    marca: formData.get("marca"),
    modello: formData.get("modello"),
    allestimento: formData.get("allestimento") || null,
    annoImmatricolazione: formData.get("annoImmatricolazione"),
    kmAttuali: formData.get("kmAttuali"),
    dataAcquisto: formData.get("dataAcquisto") || null,
    acquistatoPressoLocationId:
      formData.get("acquistatoPressoLocationId") || null,
    fineGaranzia: formData.get("fineGaranzia") || null,
    fineFinanziamento: formData.get("fineFinanziamento") || null,
    prossimaRevisione: formData.get("prossimaRevisione") || null,
    prossimoTagliandoData: formData.get("prossimoTagliandoData") || null,
    prossimoTagliandoKm: formData.get("prossimoTagliandoKm") || null,
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dati non validi",
    };
  }

  try {
    await prisma.vehicle.update({
      where: { id: vehicleId },
      data: {
        targa: parsed.data.targa,
        vin: parsed.data.vin || null,
        marca: parsed.data.marca,
        modello: parsed.data.modello,
        allestimento: parsed.data.allestimento || null,
        annoImmatricolazione: parsed.data.annoImmatricolazione,
        kmAttuali: parsed.data.kmAttuali,
        kmAggiornatiIl: new Date(),
        dataAcquisto: parseOptionalDate(parsed.data.dataAcquisto),
        acquistatoPressoLocationId:
          parsed.data.acquistatoPressoLocationId || null,
        fineGaranzia: parseOptionalDate(parsed.data.fineGaranzia),
        fineFinanziamento: parseOptionalDate(parsed.data.fineFinanziamento),
        prossimaRevisione: parseOptionalDate(parsed.data.prossimaRevisione),
        prossimoTagliandoData: parseOptionalDate(
          parsed.data.prossimoTagliandoData,
        ),
        prossimoTagliandoKm: parsed.data.prossimoTagliandoKm || null,
      },
    });
    revalidatePath(`/clienti/${vehicle.customerId}`);
    return { success: true, message: "Veicolo aggiornato" };
  } catch {
    return { success: false, error: "Errore durante il salvataggio" };
  }
}

export async function deleteVehicle(vehicleId: string): Promise<void> {
  const staff = await requireStaff();
  const vehicle = await prisma.vehicle.findFirst({
    where: { id: vehicleId, customer: { groupId: staff.groupId } },
  });
  if (!vehicle) {
    throw new Error("Veicolo non trovato");
  }

  await prisma.vehicle.delete({ where: { id: vehicleId } });
  revalidatePath(`/clienti/${vehicle.customerId}`);
}

export type CsvImportRowError = { row: number; message: string };

export async function importCustomersCsv(
  csvText: string,
  mapping: Record<string, string>,
): Promise<
  ActionResult<{ imported: number; errors: CsvImportRowError[] }>
> {
  const staff = await requireStaff();
  const lines = csvText
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((l) => l.trim().length > 0);

  if (lines.length < 2) {
    return {
      success: false,
      error: "Il file CSV deve contenere intestazione e almeno una riga",
    };
  }

  const headers = splitCsvLine(lines[0]!);
  const errors: CsvImportRowError[] = [];
  let imported = 0;

  const locations = await prisma.location.findMany({
    where: { groupId: staff.groupId },
  });
  const defaultLocationId = locations[0]?.id ?? null;

  for (let i = 1; i < lines.length; i++) {
    const rowNum = i + 1;
    const cols = splitCsvLine(lines[i]!);
    const get = (field: string) => {
      const colName = mapping[field];
      if (!colName) return "";
      const idx = headers.findIndex(
        (h) => h.trim().toLowerCase() === colName.trim().toLowerCase(),
      );
      return idx >= 0 ? (cols[idx] ?? "").trim() : "";
    };

    try {
      const customerParsed = customerSchema.safeParse({
        nome: get("nome"),
        cognome: get("cognome"),
        email: get("email"),
        telefono: get("telefono"),
        dataNascita: get("dataNascita") || null,
        consensoMarketing: ["1", "true", "si", "sì", "yes"].includes(
          get("consensoMarketing").toLowerCase(),
        ),
        canalePreferito: (get("canalePreferito") || "EMAIL").toUpperCase(),
      });

      if (!customerParsed.success) {
        errors.push({
          row: rowNum,
          message: customerParsed.error.issues[0]?.message ?? "Cliente non valido",
        });
        continue;
      }

      let customer = await prisma.customer.findFirst({
        where: {
          groupId: staff.groupId,
          email: {
            equals: customerParsed.data.email,
            mode: "insensitive",
          },
        },
      });

      if (!customer) {
        customer = await prisma.customer.create({
          data: {
            groupId: staff.groupId,
            ...customerParsed.data,
            dataNascita: parseOptionalDate(customerParsed.data.dataNascita),
          },
        });
      }

      const targaRaw = get("targa");
      if (targaRaw) {
        const targa = normalizeTarga(targaRaw);
        const vehicleParsed = vehicleSchema.safeParse({
          customerId: customer.id,
          targa,
          vin: get("vin") || null,
          marca: get("marca"),
          modello: get("modello"),
          allestimento: get("allestimento") || null,
          annoImmatricolazione:
            get("annoImmatricolazione") || new Date().getFullYear(),
          kmAttuali: get("kmAttuali") || 0,
          dataAcquisto: get("dataAcquisto") || null,
          acquistatoPressoLocationId: defaultLocationId,
          fineGaranzia: get("fineGaranzia") || null,
          fineFinanziamento: get("fineFinanziamento") || null,
          prossimaRevisione: get("prossimaRevisione") || null,
          prossimoTagliandoData: get("prossimoTagliandoData") || null,
          prossimoTagliandoKm: get("prossimoTagliandoKm") || null,
        });

        if (!vehicleParsed.success) {
          errors.push({
            row: rowNum,
            message:
              vehicleParsed.error.issues[0]?.message ?? "Veicolo non valido",
          });
          continue;
        }

        const existingVehicle = await prisma.vehicle.findUnique({
          where: { targa: vehicleParsed.data.targa },
        });
        if (existingVehicle) {
          errors.push({
            row: rowNum,
            message: `Targa ${vehicleParsed.data.targa} già presente`,
          });
          continue;
        }

        await prisma.vehicle.create({
          data: {
            customerId: customer.id,
            targa: vehicleParsed.data.targa,
            vin: vehicleParsed.data.vin || null,
            marca: vehicleParsed.data.marca,
            modello: vehicleParsed.data.modello,
            allestimento: vehicleParsed.data.allestimento || null,
            annoImmatricolazione: vehicleParsed.data.annoImmatricolazione,
            kmAttuali: vehicleParsed.data.kmAttuali,
            dataAcquisto: parseOptionalDate(vehicleParsed.data.dataAcquisto),
            acquistatoPressoLocationId: defaultLocationId,
            fineGaranzia: parseOptionalDate(vehicleParsed.data.fineGaranzia),
            fineFinanziamento: parseOptionalDate(
              vehicleParsed.data.fineFinanziamento,
            ),
            prossimaRevisione: parseOptionalDate(
              vehicleParsed.data.prossimaRevisione,
            ),
            prossimoTagliandoData: parseOptionalDate(
              vehicleParsed.data.prossimoTagliandoData,
            ),
            prossimoTagliandoKm: vehicleParsed.data.prossimoTagliandoKm || null,
          },
        });
      }

      imported++;
    } catch (e) {
      errors.push({
        row: rowNum,
        message: e instanceof Error ? e.message : "Errore imprevisto",
      });
    }
  }

  revalidatePath("/clienti");
  return {
    success: true,
    data: { imported, errors },
    message: `Importati ${imported} record${errors.length ? `, ${errors.length} errori` : ""}`,
  };
}

function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if ((ch === "," || ch === ";") && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result.map((s) => s.trim());
}
