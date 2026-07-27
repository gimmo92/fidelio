import type { ReminderType } from "@prisma/client";

type TemplateVars = {
  nome: string;
  modello: string;
  targa: string;
  dataPrevista?: string;
};

export function reminderSubject(tipo: ReminderType): string {
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

export function reminderBody(tipo: ReminderType, vars: TemplateVars): string {
  const { nome, modello, targa } = vars;
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
