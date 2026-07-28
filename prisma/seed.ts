import {
  AppointmentStatus,
  PreferredChannel,
  PrismaClient,
  ReminderStatus,
  ReminderType,
  ServiceType,
  StaffRole,
} from "@prisma/client";
import { DEMO_FUNNELS } from "./funnel-seed-data";

const prisma = new PrismaClient();

/** Genera una targa italiana plausibile: AA000AA */
function targa(seq: number): string {
  const letters = "ABCDEFGHJKLMNPRSTVWXYZ";
  const n = seq % 1000;
  const a = Math.floor(seq / 1000);
  const l1 = letters[a % letters.length];
  const l2 = letters[Math.floor(a / letters.length) % letters.length];
  const l3 = letters[(a + 3) % letters.length];
  const l4 = letters[(a + 7) % letters.length];
  return `${l1}${l2}${String(n).padStart(3, "0")}${l3}${l4}`;
}

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d;
}

function yearsAgo(years: number, month = 6, day = 15): Date {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years, month - 1, day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

const NOMI = [
  "Marco", "Giulia", "Luca", "Francesca", "Andrea", "Chiara", "Matteo", "Elena",
  "Alessandro", "Valentina", "Davide", "Sara", "Simone", "Martina", "Federico",
  "Alessia", "Riccardo", "Giorgia", "Stefano", "Laura", "Paolo", "Silvia",
  "Giuseppe", "Anna", "Roberto",
];

const COGNOMI = [
  "Rossi", "Bianchi", "Ferrari", "Esposito", "Romano", "Colombo", "Ricci",
  "Marino", "Greco", "Bruno", "Gallo", "Conti", "De Luca", "Mancini", "Costa",
  "Giordano", "Rizzo", "Lombardi", "Moretti", "Barbieri", "Fontana", "Santoro",
  "Mariani", "Rinaldi", "Caruso",
];

const VEICOLI = [
  { marca: "Fiat", modello: "500X", allestimento: "Cross" },
  { marca: "Fiat", modello: "Panda", allestimento: "City Cross" },
  { marca: "Fiat", modello: "Tipo", allestimento: "Life" },
  { marca: "Alfa Romeo", modello: "Giulia", allestimento: "Super" },
  { marca: "Alfa Romeo", modello: "Stelvio", allestimento: "Sprint" },
  { marca: "Jeep", modello: "Renegade", allestimento: "Limited" },
  { marca: "Jeep", modello: "Compass", allestimento: "Longitude" },
  { marca: "Lancia", modello: "Ypsilon", allestimento: "Gold" },
  { marca: "Volkswagen", modello: "Golf", allestimento: "Style" },
  { marca: "Volkswagen", modello: "T-Roc", allestimento: "Life" },
  { marca: "Volkswagen", modello: "Tiguan", allestimento: "Elegance" },
  { marca: "Audi", modello: "A3", allestimento: "Sportback" },
  { marca: "Audi", modello: "Q3", allestimento: "S line" },
  { marca: "BMW", modello: "Serie 1", allestimento: "Sport" },
  { marca: "BMW", modello: "X1", allestimento: "xLine" },
  { marca: "Mercedes-Benz", modello: "Classe A", allestimento: "Progressive" },
  { marca: "Toyota", modello: "Yaris", allestimento: "Hybrid Active" },
  { marca: "Toyota", modello: "Corolla", allestimento: "Hybrid Style" },
  { marca: "Peugeot", modello: "208", allestimento: "Allure" },
  { marca: "Peugeot", modello: "3008", allestimento: "GT" },
];

const TELEFONI_PREFIX = ["333", "340", "347", "348", "349", "380", "389", "392"];

async function main() {
  console.log("🧹 Pulizia dati esistenti…");
  await prisma.funnelStep.deleteMany();
  await prisma.marketingFunnel.deleteMany();
  await prisma.communicationLog.deleteMany();
  await prisma.reminder.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.serviceRecord.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.staffUser.deleteMany();
  await prisma.location.deleteMany();
  await prisma.dealerGroup.deleteMany();

  console.log("🏢 Creazione gruppo e sedi…");
  const group = await prisma.dealerGroup.create({
    data: {
      nome: "Gruppo AutoBasso",
      logoUrl: null,
    },
  });

  const sedeTorino = await prisma.location.create({
    data: {
      groupId: group.id,
      nome: "AutoBasso Torino Centro",
      indirizzo: "Corso Vittorio Emanuele II 142",
      citta: "Torino",
      telefono: "0111234567",
      brand: ["Fiat", "Alfa Romeo", "Jeep", "Lancia"],
    },
  });

  const sedeMoncalieri = await prisma.location.create({
    data: {
      groupId: group.id,
      nome: "AutoBasso Moncalieri",
      indirizzo: "Via Torino 88",
      citta: "Moncalieri",
      telefono: "0117654321",
      brand: ["Volkswagen", "Audi"],
    },
  });

  const locations = [sedeTorino, sedeMoncalieri];

  console.log("👤 Creazione utenti staff…");
  await prisma.staffUser.createMany({
    data: [
      {
        groupId: group.id,
        locationId: null,
        ruolo: StaffRole.OWNER,
        email: "titolare@autobasso.it",
        nome: "Gianmarco Basso",
      },
      {
        groupId: group.id,
        locationId: sedeTorino.id,
        ruolo: StaffRole.SALES,
        email: "vendite.torino@autobasso.it",
        nome: "Elena Martini",
      },
      {
        groupId: group.id,
        locationId: sedeMoncalieri.id,
        ruolo: StaffRole.SERVICE,
        email: "officina.moncalieri@autobasso.it",
        nome: "Luca Ferrero",
      },
    ],
  });

  console.log("👥 Creazione clienti e veicoli…");
  const customers = [];

  for (let i = 0; i < 25; i++) {
    const nome = NOMI[i]!;
    const cognome = COGNOMI[i]!;
    const canale = randomItem([
      PreferredChannel.EMAIL,
      PreferredChannel.SMS,
      PreferredChannel.WHATSAPP,
    ]);

    const customer = await prisma.customer.create({
      data: {
        groupId: group.id,
        nome,
        cognome,
        email: `${nome.toLowerCase()}.${cognome.toLowerCase().replace(/\s/g, "")}@email.it`,
        telefono: `${TELEFONI_PREFIX[i % TELEFONI_PREFIX.length]}${String(1000000 + i * 137).slice(0, 7)}`,
        dataNascita: yearsAgo(28 + (i % 35), (i % 12) + 1, (i % 27) + 1),
        consensoMarketing: i % 3 !== 0,
        canalePreferito: canale,
      },
    });
    customers.push(customer);
  }

  // 35 veicoli: alcuni clienti ne hanno 2
  const vehicleSpecs: { customerIndex: number; ageYears: number; seq: number }[] = [];
  for (let i = 0; i < 25; i++) {
    vehicleSpecs.push({ customerIndex: i, ageYears: 1 + (i % 8), seq: i + 1 });
  }
  // 10 clienti con secondo veicolo
  for (let i = 0; i < 10; i++) {
    vehicleSpecs.push({
      customerIndex: i,
      ageYears: 3 + (i % 6),
      seq: 26 + i,
    });
  }

  const vehicles = [];
  for (const spec of vehicleSpecs) {
    const customer = customers[spec.customerIndex]!;
    const v = VEICOLI[spec.seq % VEICOLI.length]!;
    const location = locations[spec.seq % 2]!;
    const dataAcquisto = yearsAgo(spec.ageYears, ((spec.seq * 3) % 12) + 1, ((spec.seq * 5) % 27) + 1);
    const kmBase = 8000 + spec.ageYears * 12000 + (spec.seq * 317) % 5000;

    // Scadenze distribuite nei prossimi 12 mesi (+ alcune già vicine / passate per demo)
    const revisioneOffset = ((spec.seq * 37) % 360) - 30; // da -30 a +330 giorni
    const tagliandoOffset = ((spec.seq * 53) % 300) - 15;
    const garanziaOffset = spec.ageYears <= 2 ? 180 + (spec.seq % 200) : -(spec.seq % 90);
    const finanziamentoOffset =
      spec.ageYears >= 3 ? ((spec.seq * 17) % 180) - 30 : 200 + (spec.seq % 160);

    const vehicle = await prisma.vehicle.create({
      data: {
        customerId: customer.id,
        targa: targa(spec.seq + 10),
        vin: `ZFA${String(10000000000000 + spec.seq * 7919).slice(0, 14)}`,
        marca: v.marca,
        modello: v.modello,
        allestimento: v.allestimento,
        annoImmatricolazione: dataAcquisto.getFullYear(),
        kmAttuali: kmBase,
        kmAggiornatiIl: daysFromNow(-((spec.seq * 7) % 60)),
        dataAcquisto,
        acquistatoPressoLocationId: location.id,
        fineGaranzia: daysFromNow(garanziaOffset),
        fineFinanziamento: daysFromNow(finanziamentoOffset),
        prossimaRevisione: daysFromNow(revisioneOffset),
        prossimoTagliandoData: daysFromNow(tagliandoOffset),
        prossimoTagliandoKm: kmBase + 15000 - ((spec.seq * 100) % 5000),
      },
    });
    vehicles.push(vehicle);
  }

  console.log("🔧 Creazione storico interventi…");
  const serviceTypes = [
    ServiceType.TAGLIANDO,
    ServiceType.REVISIONE,
    ServiceType.GOMME,
    ServiceType.RIPARAZIONE,
    ServiceType.ALTRO,
  ];

  let serviceCount = 0;
  for (let i = 0; i < vehicles.length; i++) {
    const vehicle = vehicles[i]!;
    // ~60% con interventi recenti; ~20% "a rischio" (nessun intervento da 12+ mesi)
    const isAtRisk = i % 5 === 0;
    const numRecords = isAtRisk ? 1 : 1 + (i % 3);

    for (let r = 0; r < numRecords; r++) {
      const monthsAgo = isAtRisk
        ? 14 + (i % 8)
        : 1 + ((i + r * 4) % 10);
      const tipo = serviceTypes[(i + r) % serviceTypes.length]!;
      const location = locations[i % 2]!;

      await prisma.serviceRecord.create({
        data: {
          vehicleId: vehicle.id,
          locationId: location.id,
          data: daysFromNow(-monthsAgo * 30),
          tipo,
          descrizione: descrizioneIntervento(tipo, vehicle.marca, vehicle.modello),
          importo: importoIntervento(tipo),
          kmAlMomento: Math.max(1000, vehicle.kmAttuali - monthsAgo * 1000),
        },
      });
      serviceCount++;
    }
  }

  console.log("📅 Creazione appuntamenti demo…");
  // Alcuni da confermare, alcuni confermati
  const appointmentVehicles = vehicles.slice(0, 8);
  for (let i = 0; i < appointmentVehicles.length; i++) {
    const vehicle = appointmentVehicles[i]!;
    const location = locations[i % 2]!;
    const stato =
      i < 4
        ? AppointmentStatus.RICHIESTO
        : i < 6
          ? AppointmentStatus.CONFERMATO
          : AppointmentStatus.COMPLETATO;

    const slotHour = 8 + (i % 4);
    const slotMin = i % 2 === 0 ? 30 : 0;
    const dataOra = daysFromNow(2 + i);
    dataOra.setHours(slotHour, slotMin, 0, 0);

    await prisma.appointment.create({
      data: {
        vehicleId: vehicle.id,
        locationId: location.id,
        dataOra,
        tipo: serviceTypes[i % serviceTypes.length]!,
        stato,
        note: stato === AppointmentStatus.RICHIESTO ? "Richiesta da area clienti" : null,
      },
    });
  }

  console.log("🔔 Creazione promemoria demo…");
  let reminderCount = 0;
  for (let i = 0; i < 12; i++) {
    const vehicle = vehicles[i]!;
    const tipi: ReminderType[] = [
      ReminderType.REVISIONE,
      ReminderType.TAGLIANDO,
      ReminderType.FINE_GARANZIA,
      ReminderType.FINE_FINANZIAMENTO,
      ReminderType.COMPLEANNO,
      ReminderType.ANNIVERSARIO_ACQUISTO,
    ];
    const tipo = tipi[i % tipi.length]!;
    const withinWindow = i < 6; // in uscita questa settimana / finestra

    await prisma.reminder.create({
      data: {
        vehicleId: vehicle.id,
        tipo,
        dataPrevista: daysFromNow(withinWindow ? 5 + i * 3 : 45 + i * 10),
        stato: withinWindow && i < 3 ? ReminderStatus.INVIATO : ReminderStatus.PIANIFICATO,
        inviatoIl: withinWindow && i < 3 ? daysFromNow(-1) : null,
      },
    });
    reminderCount++;

    if (withinWindow && i < 3) {
      const customer = customers[vehicleSpecs[i]!.customerIndex]!;
      await prisma.communicationLog.create({
        data: {
          customerId: customer.id,
          reminderId: (
            await prisma.reminder.findFirst({
              where: { vehicleId: vehicle.id, tipo },
            })
          )?.id,
          canale: customer.canalePreferito,
          oggetto: oggettoPromemoria(tipo),
          corpo: corpoPromemoria(tipo, customer.nome, vehicle.modello, vehicle.targa),
          inviatoIl: daysFromNow(-1),
          esito: "SIMULATO",
        },
      });
    }
  }

  console.log("🎯 Creazione funnel loyalty…");
  for (const funnel of DEMO_FUNNELS) {
    await prisma.marketingFunnel.create({
      data: {
        groupId: group.id,
        nome: funnel.nome,
        descrizione: funnel.descrizione,
        triggerTipo: funnel.triggerTipo,
        triggerNota: funnel.triggerNota,
        meccanica: funnel.meccanica,
        kpiTarget: funnel.kpiTarget,
        notaCompliance: funnel.notaCompliance,
        stato: funnel.stato,
        steps: {
          create: funnel.steps.map((s) => ({
            ordine: s.ordine,
            giornoOffset: s.giornoOffset,
            timingLabel: s.timingLabel,
            canale: s.canale,
            tipo: s.tipo,
            oggetto: s.oggetto,
            corpo: s.corpo,
            offerta: s.offerta,
            condizione: s.condizione,
            kpiClienti: s.kpiClienti,
            kpiConversione: s.kpiConversione,
          })),
        },
      },
    });
  }

  console.log("\n✅ Seed completato");
  console.log(`   Gruppo:     ${group.nome}`);
  console.log(`   Sedi:       2`);
  console.log(`   Staff:      3`);
  console.log(`   Clienti:    ${customers.length}`);
  console.log(`   Veicoli:    ${vehicles.length}`);
  console.log(`   Interventi: ${serviceCount}`);
  console.log(`   Promemoria: ${reminderCount}`);
  console.log(`   Funnel:     ${DEMO_FUNNELS.length}`);
  console.log("\n   Login staff demo (dopo setup Auth):");
  console.log("   • titolare@autobasso.it (OWNER, tutte le sedi)");
  console.log("   • vendite.torino@autobasso.it (SALES, Torino)");
  console.log("   • officina.moncalieri@autobasso.it (SERVICE, Moncalieri)");
}

function descrizioneIntervento(
  tipo: ServiceType,
  marca: string,
  modello: string,
): string {
  switch (tipo) {
    case "TAGLIANDO":
      return `Tagliando periodico ${marca} ${modello}: olio, filtri, controlli di sicurezza`;
    case "REVISIONE":
      return `Revisione ministeriale ${marca} ${modello}`;
    case "GOMME":
      return `Sostituzione pneumatici stagionali ${marca} ${modello}`;
    case "RIPARAZIONE":
      return `Riparazione impianto frenante / sospensioni ${marca} ${modello}`;
    default:
      return `Intervento generico su ${marca} ${modello}`;
  }
}

function importoIntervento(tipo: ServiceType): number {
  switch (tipo) {
    case "TAGLIANDO":
      return 280 + Math.floor(Math.random() * 120);
    case "REVISIONE":
      return 79.9;
    case "GOMME":
      return 450 + Math.floor(Math.random() * 200);
    case "RIPARAZIONE":
      return 150 + Math.floor(Math.random() * 400);
    default:
      return 50 + Math.floor(Math.random() * 100);
  }
}

function oggettoPromemoria(tipo: ReminderType): string {
  switch (tipo) {
    case "REVISIONE":
      return "Promemoria revisione veicolo";
    case "TAGLIANDO":
      return "Promemoria tagliando";
    case "GOMME_STAGIONALI":
      return "Promemoria cambio gomme stagionali";
    case "FINE_GARANZIA":
      return "Avviso imminente fine garanzia";
    case "FINE_FINANZIAMENTO":
      return "Avviso imminente fine finanziamento";
    case "COMPLEANNO":
      return "Auguri dalla tua concessionaria";
    case "ANNIVERSARIO_ACQUISTO":
      return "Anniversario del tuo acquisto";
  }
}

function corpoPromemoria(
  tipo: ReminderType,
  nome: string,
  modello: string,
  targa: string,
): string {
  switch (tipo) {
    case "REVISIONE":
      return `Gentile ${nome}, le ricordiamo che la revisione della sua ${modello} (targa ${targa}) è in scadenza. Può prenotare un appuntamento dalla sua area clienti o contattandoci. Cordiali saluti.`;
    case "TAGLIANDO":
      return `Gentile ${nome}, il tagliando della sua ${modello} (targa ${targa}) è vicino. Siamo a disposizione per fissare un passaggio in officina. Cordiali saluti.`;
    case "GOMME_STAGIONALI":
      return `Gentile ${nome}, con il cambio stagione le suggeriamo di verificare le gomme della sua ${modello} (targa ${targa}). Cordiali saluti.`;
    case "FINE_GARANZIA":
      return `Gentile ${nome}, la garanzia della sua ${modello} (targa ${targa}) è in scadenza. Se desidera un controllo preventivo, siamo a disposizione. Cordiali saluti.`;
    case "FINE_FINANZIAMENTO":
      return `Gentile ${nome}, il finanziamento legato alla sua ${modello} (targa ${targa}) è in fase di conclusione. Per qualsiasi informazione il nostro team commerciale è a disposizione. Cordiali saluti.`;
    case "COMPLEANNO":
      return `Gentile ${nome}, tutto il team le augura un buon compleanno. Grazie della fiducia.`;
    case "ANNIVERSARIO_ACQUISTO":
      return `Gentile ${nome}, è passato un altro anno con la sua ${modello} (targa ${targa}). Grazie di averci scelto: restiamo a disposizione per ogni esigenza. Cordiali saluti.`;
  }
}

main()
  .catch((e) => {
    console.error("❌ Seed fallito:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
