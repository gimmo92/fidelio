/** Dati seed per i 3 funnel loyalty demo */
export const DEMO_FUNNELS = [
  {
    nome: "Riattivazione cliente dormiente officina",
    descrizione:
      "Recupera chi non porta l'auto in officina da 12+ mesi con offerta a tempo e urgenza crescente.",
    triggerTipo: "DORMIENTE_OFFICINA" as const,
    triggerNota:
      "Nessun intervento da 12+ mesi — segnale predittivo di churn: chi abbandona l'officina non torna nemmeno per il riacquisto.",
    meccanica:
      "Try&Buy (check-up gratuito) → Short Time Offer con urgenza crescente → handoff staff sui dormienti profondi.",
    kpiTarget:
      "Tasso riattivazione (target 8–15% sui dormienti), revenue officina generata per messaggio inviato.",
    notaCompliance: null as string | null,
    stato: "ATTIVO" as const,
    steps: [
      {
        ordine: 1,
        giornoOffset: 0,
        timingLabel: "Giorno 0",
        canale: "WHATSAPP" as const,
        tipo: "CASHBACK_TRYBUY" as const,
        oggetto: "Check-up gratuito",
        corpo:
          "Gentile Marco, è passato un po' di tempo dall'ultimo controllo della sua Golf. Se vuole, le prenotiamo un check-up gratuito di 20 minuti: freni, batteria, livelli. Risponde qui e ci pensiamo noi.",
        offerta:
          "Check-up gratuito 20 minuti (free service hook: costo marginale quasi zero, 30–40% genera intervento pagato)",
        condizione: null as string | null,
      },
      {
        ordine: 2,
        giornoOffset: 7,
        timingLabel: "Giorno 7",
        canale: "EMAIL" as const,
        tipo: "SHORT_TIME_OFFER" as const,
        oggetto: "Tagliando -20% a scadenza",
        corpo:
          "Tagliando completo a -20% per prenotazioni entro il 15 settembre. Include controllo climatizzatore omaggio. Countdown visibile, CTA diretta alla prenotazione online.",
        offerta: "Tagliando -20% + clima omaggio · scadenza 15 settembre",
        condizione: "Solo se non ha risposto allo step WhatsApp",
      },
      {
        ordine: 3,
        giornoOffset: 13,
        timingLabel: "Giorno 13",
        canale: "SMS" as const,
        tipo: "SHORT_TIME_OFFER" as const,
        oggetto: "Last chance -20%",
        corpo:
          "Ultimi 2 giorni per il -20% sul tagliando della sua Golf. Prenota qui: [link]",
        offerta: "Last chance · 48 ore prima della scadenza",
        condizione: "48 ore prima della scadenza offerta",
      },
      {
        ordine: 4,
        giornoOffset: 30,
        timingLabel: "Giorno 30",
        canale: "CHIAMATA_STAFF" as const,
        tipo: "HANDOFF_STAFF" as const,
        oggetto: "Dormiente profondo → lista chiamate",
        corpo:
          "Il cliente passa in stato «dormiente profondo» e finisce nella lista chiamate manuali della dashboard. L'automazione ha filtrato chi si riattiva da solo.",
        offerta: null,
        condizione: "Se ancora nessuna risposta / conversione",
      },
    ],
  },
  {
    nome: "Finestra riacquisto / supervalutazione permuta",
    descrizione:
      "Accompagna il cliente verso il riacquisto nella finestra finanziamento o età veicolo, con valutazione e evento riservato.",
    triggerTipo: "FINESTRA_RIACQUISTO" as const,
    triggerNota:
      "Fine finanziamento entro 6 mesi, oppure veicolo ≥ 4 anni. Il trigger finanziamento è il più forte: il cliente sta già confrontando rata nuova vs auto vecchia.",
    meccanica:
      "Try&Buy (valutazione gratuita) → STO supervalutazione → Short Term Collection sull'evento → handoff staff.",
    kpiTarget:
      "Tasso di riacquisto interno, valutazioni richieste, presenze evento.",
    notaCompliance: null,
    stato: "ATTIVO" as const,
    steps: [
      {
        ordine: 1,
        giornoOffset: -180,
        timingLabel: "Mese -6",
        canale: "EMAIL" as const,
        tipo: "CASHBACK_TRYBUY" as const,
        oggetto: "Valutazione indicativa gratuita",
        corpo:
          "La sua Tiguan compie 4 anni: le inviamo una valutazione indicativa gratuita del suo usato, senza impegno. Vale la pena sapere quanto vale oggi.",
        offerta: "Lead magnet: valutazione gratuita usato",
        condizione: null,
      },
      {
        ordine: 2,
        giornoOffset: -120,
        timingLabel: "Mese -4",
        canale: "WHATSAPP" as const,
        tipo: "SHORT_TIME_OFFER" as const,
        oggetto: "Supervalutazione +1.500€",
        corpo:
          "La valutazione della sua Tiguan: 16.500€. Fino al 30 novembre riconosciamo una supervalutazione di +1.500€ sulla permuta per i modelli in promozione. Vuole passare a vederli sabato?",
        offerta: "Supervalutazione +1.500€ sulla permuta · fino al 30 novembre",
        condizione: "Solo chi ha chiesto la valutazione",
      },
      {
        ordine: 3,
        giornoOffset: -90,
        timingLabel: "Mese -3",
        canale: "EVENTO" as const,
        tipo: "SHORT_TERM_COLLECTION" as const,
        oggetto: "Porte aperte riservate",
        corpo:
          "Invito a porte aperte / anteprima nuovo modello riservata ai clienti storici, con slot su prenotazione. Leva di status: «riservato ai clienti della concessionaria».",
        offerta: "Evento riservato con slot prenotabili",
        condizione: null,
      },
      {
        ordine: 4,
        giornoOffset: -30,
        timingLabel: "Mese -1",
        canale: "CHIAMATA_STAFF" as const,
        tipo: "HANDOFF_STAFF" as const,
        oggetto: "Lista chiamate con contesto",
        corpo:
          "Chi non ha convertito passa alla lista chiamate con tutto il contesto in scheda: valutazione fatta, offerte inviate, aperture email.",
        offerta: null,
        condizione: "Non convertiti dopo evento",
      },
    ],
  },
  {
    nome: "Arricchimento dati + stagionale gomme",
    descrizione:
      "Completa i profili con sweepstake / operazione a premio e riempie gli slot cambio gomme in stagione.",
    triggerTipo: "PROFILO_INCOMPLETO" as const,
    triggerNota:
      "Profilo incompleto (manca data di nascita, km attuali, consenso marketing, canale preferito) — oppure calendario: 15 ottobre e 1 aprile per il cambio gomme.",
    meccanica:
      "Sweepstake per arricchimento dati → Instant win reminder sui quasi convertiti → STO slot gomme → annuncio vincitore.",
    kpiTarget:
      "Profili completati, km aggiornati, slot gomme prenotati, tasso completamento dopo reminder.",
    notaCompliance:
      "In Italia i concorsi a premi sono regolati dal DPR 430/2001 (comunicazione MIMIT, cauzione, verbalizzazione). Preferibile strutturare come operazione a premio («completa il profilo → buono 20€ in officina per tutti»), più semplice amministrativamente. Verificare con il commercialista.",
    stato: "ATTIVO" as const,
    steps: [
      {
        ordine: 1,
        giornoOffset: 0,
        timingLabel: "Ottobre · giorno 0",
        canale: "EMAIL" as const,
        tipo: "SWEEPSTAKE" as const,
        oggetto: "Completa profilo → estrazione gomme",
        corpo:
          "Completa il profilo della tua auto (2 minuti: km attuali e gomme montate) e partecipi all'estrazione di un treno di gomme invernali omaggio. Estrazione il 31 ottobre.",
        offerta: "Estrazione treno gomme invernali · 31 ottobre",
        condizione: "Invio anche su WhatsApp in parallelo",
      },
      {
        ordine: 2,
        giornoOffset: 3,
        timingLabel: "Giorno 3",
        canale: "WHATSAPP" as const,
        tipo: "INSTANT_WIN" as const,
        oggetto: "Reminder quasi convertiti",
        corpo:
          "Hai aperto l'invito ma non hai ancora completato il profilo: bastano 2 minuti per partecipare all'estrazione delle gomme invernali.",
        offerta: null,
        condizione: "Solo chi ha aperto e non completato (+15–20% recupero tipico)",
      },
      {
        ordine: 3,
        giornoOffset: 10,
        timingLabel: "Giorno 10",
        canale: "SMS" as const,
        tipo: "SHORT_TIME_OFFER" as const,
        oggetto: "Cambio gomme · 40 slot",
        corpo:
          "Cambio gomme: solo 40 slot disponibili tra il 20 ottobre e il 10 novembre, prenotabili online. Deposito gomme incluso per chi prenota entro il 25.",
        offerta: "40 slot · deposito incluso se prenota entro il 25",
        condizione: "A tutti (profilo completo o no) — scarsità sugli slot, non sullo sconto",
      },
      {
        ordine: 4,
        giornoOffset: 31,
        timingLabel: "31 ottobre",
        canale: "EMAIL" as const,
        tipo: "SWEEPSTAKE" as const,
        oggetto: "Annuncio vincitore",
        corpo:
          "Annuncio vincitore a tutta la base, con foto del cliente che ritira il premio (previo consenso). Secondo momento di marketing: prova sociale e anticipazione edizione primaverile.",
        offerta: null,
        condizione: "Consenso foto obbligatorio",
      },
    ],
  },
];
