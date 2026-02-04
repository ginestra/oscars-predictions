"use strict";

const STORAGE_KEYS = {
  users: "oscars_users",
  picks: "oscars_picks",
  results: "oscars_results",
  currentUser: "oscars_current_user",
  currentUserId: "oscars_current_user_id",
  language: "oscars_language",
  theme: "oscars_theme"
};

const state = {
  categories: [],
  pointsPerCategory: 1,
  ceremonyDate: null,
  picks: [],
  ceremonyYear: null
};

let currentLanguage = "en";
let sessionPin = null;
let currentTheme = "system";

const SUPABASE_URL = window.SUPABASE_URL || "";
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || "";
const supabaseClient =
  SUPABASE_URL && SUPABASE_ANON_KEY && window.supabase
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;
function getVotingDeadline() {
  if (state.ceremonyDate) {
    const parsed = new Date(state.ceremonyDate);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  return null;
}

function formatVotingDeadline(locale) {
  const deadline = getVotingDeadline();
  if (!deadline) {
    return "March 15, 12:00 GMT";
  }
  return new Intl.DateTimeFormat(locale === "it" ? "it-IT" : "en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short"
  }).format(deadline);
}

function isVotingOpen() {
  const deadline = getVotingDeadline();
  if (!deadline) {
    return true;
  }
  return new Date() <= deadline;
}
const memoryStore = {
  oscars_users: [],
  oscars_picks: [],
  oscars_results: { winnersByCategoryId: {}, finalizedAt: null },
  oscars_current_user: null,
  oscars_current_user_id: null,
  oscars_language: "en"
};

const elements = {
  registrationForm: document.querySelector("#registration-form"),
  usernameInput: document.querySelector("#username"),
  usernameStatus: document.querySelector("#username-status"),
  pinInput: document.querySelector("#pin"),
  currentUser: document.querySelector("#current-user"),
  registrationEmpty: document.querySelector("#registration-empty"),
  registrationSummary: document.querySelector("#registration-summary"),
  editUsernameButton: document.querySelector("#edit-username"),
  addUserButton: document.querySelector("#add-user"),
  updateUsernameForm: document.querySelector("#update-username-form"),
  updateUsernameInput: document.querySelector("#update-username-input"),
  updatePinInput: document.querySelector("#update-pin-input"),
  updateStatus: document.querySelector("#update-status"),
  cancelUpdateButton: document.querySelector("#cancel-update"),
  personalLinkInput: document.querySelector("#personal-link"),
  copyLinkButton: document.querySelector("#copy-link"),
  copyStatus: document.querySelector("#copy-status"),
  picksForm: document.querySelector("#picks-form"),
  picksContainer: document.querySelector("#picks-container"),
  picksStatus: document.querySelector("#picks-status"),
  picksResults: document.querySelector("#picks-results"),
  picksResultsUpdated: document.querySelector("#picks-results-updated"),
  picksTitle: document.querySelector("#picks-title"),
  picksSubtitle: document.querySelector('[data-i18n="picksSubtitle"]'),
  picksDeadline: document.querySelector('[data-i18n="picksDeadline"]'),
  resultsForm: document.querySelector("#results-form"),
  resultsStatus: document.querySelector("#results-status"),
  resultsContainer: document.querySelector("#results-container"),
  resultsUpdated: document.querySelector("#results-updated"),
  resultsSection: document.querySelector("#results-title")?.closest("section"),
  leaderboardBody: document.querySelector("#leaderboard-body"),
  leaderboardStatus: document.querySelector("#leaderboard-status"),
  leaderboardExpandButton: document.querySelector("#leaderboard-expand"),
  leaderboardOverlay: document.querySelector("#leaderboard-overlay"),
  leaderboardSection: document.querySelector("#leaderboard-card"),
  similarityTable: document.querySelector("#similarity-table"),
  similarityHeader: document.querySelector("#similarity-header"),
  similarityBody: document.querySelector("#similarity-body"),
  similarityStatus: document.querySelector("#similarity-status"),
  themeSelect: document.querySelector("#theme-select"),
  languageSelect: document.querySelector("#language-select"),
  similarityExpandButton: document.querySelector("#similarity-expand"),
  similarityOverlay: document.querySelector("#similarity-overlay")
};

const translations = {
  en: {
    appName: "Oscars Predictions",
    languageLabel: "Language",
    languageEnglish: "🇬🇧 English",
    languageItalian: "🇮🇹 Italiano",
    documentTitle: "Oscars Predictions",
    metaDescription:
      "Make your Oscars picks, track results, and see a local leaderboard.",
    heroTitle: "Predict the Oscars and climb the leaderboard.",
    heroSubtitle:
      "Make your picks, earn points, and see how you stack up once results are in. No accounts, no personal details, just a simple and fun game.",
    howItWorksTitle: "How it works",
    howItWorksSubtitle: "Three quick steps to join the fun.",
    votingInfo:
      "Vote in any categories you want (at least one). Voting closes {date}.",
    step1Title: "1. Make picks",
    step1Text: "Select a nominee for every category.",
    step2Title: "2. Score points",
    step2Text: "Correct picks earn points toward your total.",
    step3Title: "3. Track results",
    step3Text: "See the leaderboard update after winners are set.",
    registrationTitle: "Select your username",
    registrationSubtitle: "Pick a username to begin.",
    hiLabel: "Hi",
    usernameActions: "Update or add another user.",
    editUsername: "Update your username",
    addUser: "Add another user",
    cancel: "Cancel",
    personalLinkLabel: "Your personal link",
    copyLink: "Copy link",
    linkCopied: "Link copied to clipboard.",
    linkCopyFailed: "Copy failed. You can still select and copy the link.",
    usernameLabel: "Username",
    usernameHelp: "2–24 characters, letters, numbers, spaces, - or _.",
    pinLabel: "PIN",
    pinHelp: "4–6 digits. You will need this to access your link.",
    saveUsername: "Save username",
    currentUser: (name) => `Current user: ${name}`,
    noUser: "No username saved yet.",
    picksTitle: "Your picks",
    picksSubtitle:
      "Make a selection for each category. You can update your picks any time before results are entered.",
    picksDeadline: "Submit at least one pick. Voting closes {date}.",
    savePicks: "Save picks",
    resultsTitle: "Results",
    resultsSubtitle:
      "Winners are fetched automatically when the Oscars site updates.",
    resultsLoading: "Checking for results...",
    resultsUpdated: "Results updated.",
    resultsUnavailable: "Results are not available yet.",
    leaderboardTitle: "Leaderboard",
    leaderboardCaption: "Leaderboard with total points",
    leaderboardRank: "Rank",
    leaderboardUsername: "Username",
    leaderboardVotes: "Voted",
    leaderboardPoints: "Points",
    leaderboardCorrect: "Correct",
    leaderboardEmpty: "No results yet.",
    leaderboardNoPicks: "No picks saved yet.",
    leaderboardUpdated: "Leaderboard updated.",
    leaderboardExpandLabel: "Expand leaderboard table",
    leaderboardCollapseLabel: "Collapse leaderboard table",
    picksClosedTitle: "Voting closed - Results",
    picksClosedSubtitle: "Results are updated as winners are announced.",
    similarityTitle: "Vote similarity",
    similaritySubtitle: "Compare how similar users are based on matching picks.",
    similarityCaption: "Similarity matrix of user picks",
    similarityEmpty: "Not enough data to compare users.",
    resultsLastUpdated: "Last updated",
    pickCorrectLabel: "Correct pick",
    pickWrongLabel: "Wrong pick",
    winnerLabel: "Winner",
    similarityExpandLabel: "Expand similarity table",
    similarityCollapseLabel: "Collapse similarity table",
    themeLabel: "Theme",
    themeSystem: "◐ System",
    themeLight: "○ Light",
    themeDark: "● Dark",
    dataTitle: "Data tools",
    dataSubtitle:
      "Export or import your local data. Use this to move picks between devices.",
    exportData: "Export data",
    importData: "Import data",
    clearData: "Clear all data",
    footerNote:
      "Built for fun. Usernames and picks are stored on the server to share the leaderboard.",
    selectNominee: "Select a nominee",
    usernameInvalid: "Username must be 2–24 chars: letters, numbers, spaces, - or _.",
    pinInvalid: "PIN must be 4–6 digits.",
    usernameExists: "That username already exists. Choose another.",
    pinMismatch: "PIN does not match this username.",
    usernameSaved: (name) => `Saved username "${name}".`,
    usernameUpdated: (name) => `Username updated to "${name}".`,
    picksRequired: "Please select at least one category.",
    votingClosed: "Voting is closed. You can no longer update picks.",
    accountLocked: "Accounts are locked after the voting deadline.",
    supabaseMissing:
      "Supabase is not configured yet. Add your project URL and anon key in js/config.js.",
    loginFailed: "Login failed. Check your username and PIN.",
    saveFailed: "Could not save your picks. Please try again.",
    picksSaved: (missing) =>
      missing
        ? `Saved picks. ${missing} category${missing === 1 ? "" : "ies"} left.`
        : "All picks saved.",
    resultsSaved: (missing) =>
      missing
        ? `Saved results. ${missing} category${missing === 1 ? "" : "ies"} left.`
        : "All results saved.",
    exportReady: "Export ready.",
    importSuccess: "Data imported.",
    importFailed: "Import failed. Invalid JSON.",
    cleared: "All local data cleared.",
    loadFailed: "Could not load categories. Check data/categories.json."
  },
  it: {
    appName: "Pronostici Oscar",
    languageLabel: "Lingua",
    languageEnglish: "🇬🇧 Inglese",
    languageItalian: "🇮🇹 Italiano",
    documentTitle: "Pronostici Oscar",
    metaDescription:
      "Fai i tuoi pronostici, segui i risultati e guarda la classifica locale.",
    heroTitle: "Prevedi gli Oscar e scala la classifica.",
    heroSubtitle:
      "Fai i tuoi pronostici, guadagna punti e scopri la tua posizione quando saranno svelati i vincitori. Niente account, niente dati personali, solo un gioco semplice e divertente.",
    howItWorksTitle: "Come funziona",
    howItWorksSubtitle: "Tre passaggi veloci per iniziare.",
    votingInfo:
      "Vota nelle categorie che vuoi (almeno una). Le votazioni chiudono {date}.",
    step1Title: "1. Fai i pronostici",
    step1Text: "Seleziona un candidato per ogni categoria.",
    step2Title: "2. Ottieni punti",
    step2Text: "I pronostici corretti valgono punti.",
    step3Title: "3. Segui i risultati",
    step3Text: "La classifica si aggiorna dopo i vincitori.",
    registrationTitle: "Scegli il tuo username",
    registrationSubtitle: "Scegli un username per iniziare.",
    hiLabel: "Ciao",
    usernameActions: "Aggiorna o aggiungi un altro utente.",
    editUsername: "Aggiorna username",
    addUser: "Aggiungi un altro utente",
    cancel: "Annulla",
    personalLinkLabel: "Il tuo link personale",
    copyLink: "Copia link",
    linkCopied: "Link copiato.",
    linkCopyFailed: "Copia non riuscita. Puoi selezionare e copiare il link.",
    usernameLabel: "Username",
    usernameHelp: "2–24 caratteri, lettere, numeri, spazi, - o _.",
    pinLabel: "PIN",
    pinHelp: "4–6 cifre. Ti servirà per accedere al tuo link.",
    saveUsername: "Salva username",
    currentUser: (name) => `Utente attuale: ${name}`,
    noUser: "Nessun username salvato.",
    picksTitle: "I tuoi pronostici",
    picksSubtitle:
      "Seleziona un candidato per ogni categoria. Puoi modificare i pronostici fino all'inserimento dei risultati.",
    picksDeadline: "Inserisci almeno un pronostico. Le votazioni chiudono {date}.",
    savePicks: "Salva pronostici",
    resultsTitle: "Risultati",
    resultsSubtitle:
      "I vincitori vengono caricati automaticamente quando il sito degli Oscar si aggiorna.",
    resultsLoading: "Controllo risultati...",
    resultsUpdated: "Risultati aggiornati.",
    resultsUnavailable: "I risultati non sono ancora disponibili.",
    leaderboardTitle: "Classifica",
    leaderboardCaption: "Classifica con punteggio totale",
    leaderboardRank: "Posizione",
    leaderboardUsername: "Username",
    leaderboardVotes: "Votati",
    leaderboardPoints: "Punti",
    leaderboardCorrect: "Corretti",
    leaderboardEmpty: "Nessun risultato ancora.",
    leaderboardNoPicks: "Nessun pronostico salvato.",
    leaderboardUpdated: "Classifica aggiornata.",
    leaderboardExpandLabel: "Espandi tabella classifica",
    leaderboardCollapseLabel: "Comprimi tabella classifica",
    picksClosedTitle: "Votazioni chiuse - Risultati",
    picksClosedSubtitle: "I risultati si aggiornano man mano che vengono annunciati.",
    similarityTitle: "Somiglianza voti",
    similaritySubtitle: "Confronta la somiglianza tra utenti in base ai pronostici.",
    similarityCaption: "Matrice di somiglianza dei pronostici",
    similarityEmpty: "Dati insufficienti per confrontare gli utenti.",
    resultsLastUpdated: "Ultimo aggiornamento",
    pickCorrectLabel: "Pronostico corretto",
    pickWrongLabel: "Pronostico errato",
    winnerLabel: "Vincitore",
    similarityExpandLabel: "Espandi tabella somiglianza",
    similarityCollapseLabel: "Comprimi tabella somiglianza",
    themeLabel: "Tema",
    themeSystem: "◐ Sistema",
    themeLight: "○ Chiaro",
    themeDark: "● Scuro",
    dataTitle: "Strumenti dati",
    dataSubtitle:
      "Esporta o importa i dati locali. Usalo per spostare i pronostici tra dispositivi.",
    exportData: "Esporta dati",
    importData: "Importa dati",
    clearData: "Cancella tutti i dati",
    footerNote:
      "Creato per divertimento e per divertirsi. Username e pronostici sono salvati sul server per condividere la classifica.",
    selectNominee: "Seleziona un candidato",
    usernameInvalid: "Lo username deve avere 2–24 caratteri: lettere, numeri, spazi, - o _.",
    pinInvalid: "Il PIN deve avere 4–6 cifre.",
    usernameExists: "Questo username esiste già. Scegline un altro.",
    pinMismatch: "Il PIN non corrisponde a questo username.",
    usernameSaved: (name) => `Username "${name}" salvato.`,
    usernameUpdated: (name) => `Username aggiornato a "${name}".`,
    picksRequired: "Seleziona almeno una categoria.",
    votingClosed: "Le votazioni sono chiuse. Non puoi più modificare i pronostici.",
    accountLocked: "Gli account sono bloccati dopo la scadenza delle votazioni.",
    supabaseMissing:
      "Supabase non è configurato. Inserisci URL progetto e anon key in js/config.js.",
    loginFailed: "Accesso non riuscito. Controlla username e PIN.",
    saveFailed: "Impossibile salvare i pronostici. Riprova.",
    picksSaved: (missing) =>
      missing
        ? `Pronostici salvati. Mancano ${missing} categor${missing === 1 ? "ia" : "ie"}.`
        : "Tutti i pronostici salvati.",
    resultsSaved: (missing) =>
      missing
        ? `Risultati salvati. Mancano ${missing} categor${missing === 1 ? "ia" : "ie"}.`
        : "Tutti i risultati salvati.",
    exportReady: "Esportazione pronta.",
    importSuccess: "Dati importati.",
    importFailed: "Importazione non riuscita. JSON non valido.",
    cleared: "Tutti i dati locali sono stati cancellati.",
    loadFailed: "Impossibile caricare le categorie. Controlla data/categories.json."
  }
};

const similarityIcons = {
  expand: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" aria-hidden="true" focusable="false">
      <path d="M408 64L552 64C565.3 64 576 74.7 576 88L576 232C576 241.7 570.2 250.5 561.2 254.2C552.2 257.9 541.9 255.9 535 249L496 210L409 297C399.6 306.4 384.4 306.4 375.1 297L343.1 265C333.7 255.6 333.7 240.4 343.1 231.1L430.1 144.1L391.1 105.1C384.2 98.2 382.2 87.9 385.9 78.9C389.6 69.9 398.3 64 408 64zM232 576L88 576C74.7 576 64 565.3 64 552L64 408C64 398.3 69.8 389.5 78.8 385.8C87.8 382.1 98.1 384.2 105 391L144 430L231 343C240.4 333.6 255.6 333.6 264.9 343L296.9 375C306.3 384.4 306.3 399.6 296.9 408.9L209.9 495.9L248.9 534.9C255.8 541.8 257.8 552.1 254.1 561.1C250.4 570.1 241.7 576 232 576z"/>
    </svg>
  `,
  collapse: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" aria-hidden="true" focusable="false">
      <path d="M503.5 71C512.9 61.6 528.1 61.6 537.4 71L569.4 103C578.8 112.4 578.8 127.6 569.4 136.9L482.4 223.9L521.4 262.9C528.3 269.8 530.3 280.1 526.6 289.1C522.9 298.1 514.2 304 504.5 304L360.5 304C347.2 304 336.5 293.3 336.5 280L336.5 136C336.5 126.3 342.3 117.5 351.3 113.8C360.3 110.1 370.6 112.1 377.5 119L416.5 158L503.5 71zM136.5 336L280.5 336C293.8 336 304.5 346.7 304.5 360L304.5 504C304.5 513.7 298.7 522.5 289.7 526.2C280.7 529.9 270.4 527.9 263.5 521L224.5 482L137.5 569C128.1 578.4 112.9 578.4 103.6 569L71.6 537C62.2 527.6 62.2 512.4 71.6 503.1L158.6 416.1L119.6 377.1C112.7 370.2 110.7 359.9 114.4 350.9C118.1 341.9 126.8 336 136.5 336z"/>
    </svg>
  `
};

const trophyIcon = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" aria-hidden="true" focusable="false">
    <path d="M208.3 64L432.3 64C458.8 64 480.4 85.8 479.4 112.2C479.2 117.5 479 122.8 478.7 128L528.3 128C554.4 128 577.4 149.6 575.4 177.8C567.9 281.5 514.9 338.5 457.4 368.3C441.6 376.5 425.5 382.6 410.2 387.1C390 415.7 369 430.8 352.3 438.9L352.3 512L416.3 512C434 512 448.3 526.3 448.3 544C448.3 561.7 434 576 416.3 576L224.3 576C206.6 576 192.3 561.7 192.3 544C192.3 526.3 206.6 512 224.3 512L288.3 512L288.3 438.9C272.3 431.2 252.4 416.9 233 390.6C214.6 385.8 194.6 378.5 175.1 367.5C121 337.2 72.2 280.1 65.2 177.6C63.3 149.5 86.2 127.9 112.3 127.9L161.9 127.9C161.6 122.7 161.4 117.5 161.2 112.1C160.2 85.6 181.8 63.9 208.3 63.9zM165.5 176L113.1 176C119.3 260.7 158.2 303.1 198.3 325.6C183.9 288.3 172 239.6 165.5 176zM444 320.8C484.5 297 521.1 254.7 527.3 176L475 176C468.8 236.9 457.6 284.2 444 320.8z"/>
  </svg>
`;

let lastResultsUpdatedAt = null;

const categoryLabels = {
  it: {
    actor_in_a_leading_role: "Attore protagonista",
    actor_in_a_supporting_role: "Attore non protagonista",
    actress_in_a_leading_role: "Attrice protagonista",
    actress_in_a_supporting_role: "Attrice non protagonista",
    animated_feature_film: "Film d'animazione",
    animated_short_film: "Cortometraggio d'animazione",
    best_picture: "Miglior film",
    casting: "Casting",
    cinematography: "Fotografia",
    costume_design: "Costumi",
    directing: "Regia",
    documentary_feature_film: "Documentario (lungometraggio)",
    documentary_short_film: "Documentario (corto)",
    film_editing: "Montaggio",
    international_feature_film: "Film internazionale",
    live_action_short_film: "Cortometraggio live action",
    makeup_and_hairstyling: "Trucco e acconciatura",
    music_original_score: "Musica (colonna sonora)",
    music_original_song: "Musica (canzone originale)",
    production_design: "Scenografia",
    sound: "Suono",
    visual_effects: "Effetti visivi",
    writing_adapted_screenplay: "Sceneggiatura adattata",
    writing_original_screenplay: "Sceneggiatura originale"
  }
};

function getLanguage() {
  return currentLanguage;
}

function setLanguage(lang) {
  currentLanguage = lang === "it" ? "it" : "en";
  try {
    localStorage.setItem(STORAGE_KEYS.language, currentLanguage);
  } catch (error) {
    // Ignore storage failures
  }
  document.documentElement.lang = currentLanguage;
  memoryStore[STORAGE_KEYS.language] = currentLanguage;
}

function getBrowserLanguage() {
  const preferred = navigator.language || navigator.languages?.[0] || "en";
  const base = preferred.split("-")[0]?.toLowerCase() || "en";
  return base === "it" ? "it" : "en";
}

function getSystemTheme() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(theme) {
  currentTheme = theme;
  try {
    localStorage.setItem(STORAGE_KEYS.theme, currentTheme);
  } catch (error) {
    // Ignore storage failures
  }
  const resolved = theme === "system" ? getSystemTheme() : theme;
  document.documentElement.setAttribute("data-theme", resolved);
  if (elements.themeSelect) {
    elements.themeSelect.value = theme;
  }
}

function t(key, ...args) {
  const lang = getLanguage();
  const value = translations[lang]?.[key] ?? translations.en[key];
  return typeof value === "function" ? value(...args) : value;
}

function getCategoryLabel(category) {
  const lang = getLanguage();
  const localized = categoryLabels[lang]?.[category.id];
  return localized || category.name;
}

function applyTranslations() {
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    const key = node.getAttribute("data-i18n");
    let value = translations[getLanguage()]?.[key] ?? translations.en[key];
    if (typeof value === "string" && value.includes("{date}")) {
      value = value.replace("{date}", formatVotingDeadline(getLanguage()));
    }
    if (typeof value === "string") {
      node.textContent = value;
    }
  });

  document.title = t("documentTitle");
  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) {
    metaDescription.setAttribute("content", t("metaDescription"));
  }
  if (elements.languageSelect) {
    elements.languageSelect.value = getLanguage();
  }
  if (elements.themeSelect) {
    elements.themeSelect.value = currentTheme;
  }
  syncSimilarityButtonState();
  syncLeaderboardButtonState();
  updateResultsUpdatedLabels();
}

function getResultsLocale() {
  return getLanguage() === "it" ? "it-IT" : "en-US";
}

function formatLastUpdated(date) {
  if (!date) {
    return "";
  }
  return new Intl.DateTimeFormat(getResultsLocale(), {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

function updateResultsUpdatedLabels() {
  const formatted = formatLastUpdated(lastResultsUpdatedAt);
  const message = formatted ? `${t("resultsLastUpdated")}: ${formatted}` : "";
  if (elements.resultsUpdated) {
    elements.resultsUpdated.textContent = message;
    elements.resultsUpdated.hidden = !formatted;
  }
  if (elements.picksResultsUpdated) {
    elements.picksResultsUpdated.textContent = message;
    elements.picksResultsUpdated.hidden = !formatted;
  }
}

function markResultsUpdated() {
  lastResultsUpdatedAt = new Date();
  updateResultsUpdatedLabels();
}

function syncSimilarityButtonState() {
  if (!elements.similarityExpandButton) {
    return;
  }
  const isExpanded = elements.similarityOverlay?.classList.contains("is-active");
  setSimilarityButtonState(Boolean(isExpanded));
}

function setSimilarityButtonState(isExpanded) {
  if (!elements.similarityExpandButton) {
    return;
  }
  elements.similarityExpandButton.innerHTML = isExpanded
    ? similarityIcons.collapse
    : similarityIcons.expand;
  elements.similarityExpandButton.setAttribute(
    "aria-expanded",
    isExpanded ? "true" : "false"
  );
  elements.similarityExpandButton.setAttribute(
    "aria-label",
    isExpanded ? t("similarityCollapseLabel") : t("similarityExpandLabel")
  );
}

function openSimilarityModal() {
  if (!elements.similarityExpandButton || !elements.similarityOverlay) {
    return;
  }
  setSimilarityButtonState(true);
  elements.similarityOverlay.classList.add("is-active");
  elements.similarityOverlay.setAttribute("aria-hidden", "false");
  const card = elements.similarityOverlay.previousElementSibling;
  if (card) {
    card.classList.add("is-expanded");
  }
  document.body.classList.add("modal-open");
}

function closeSimilarityModal() {
  if (!elements.similarityExpandButton || !elements.similarityOverlay) {
    return;
  }
  setSimilarityButtonState(false);
  elements.similarityOverlay.classList.remove("is-active");
  elements.similarityOverlay.setAttribute("aria-hidden", "true");
  const card = elements.similarityOverlay.previousElementSibling;
  if (card) {
    card.classList.remove("is-expanded");
  }
  document.body.classList.remove("modal-open");
}

function toggleSimilarityModal() {
  if (!elements.similarityOverlay) {
    return;
  }
  if (elements.similarityOverlay.classList.contains("is-active")) {
    closeSimilarityModal();
  } else {
    openSimilarityModal();
  }
}

function syncLeaderboardButtonState() {
  if (!elements.leaderboardExpandButton) {
    return;
  }
  const isExpanded = elements.leaderboardOverlay?.classList.contains("is-active");
  setLeaderboardButtonState(Boolean(isExpanded));
}

function setLeaderboardButtonState(isExpanded) {
  if (!elements.leaderboardExpandButton) {
    return;
  }
  elements.leaderboardExpandButton.innerHTML = isExpanded
    ? similarityIcons.collapse
    : similarityIcons.expand;
  elements.leaderboardExpandButton.setAttribute(
    "aria-expanded",
    isExpanded ? "true" : "false"
  );
  elements.leaderboardExpandButton.setAttribute(
    "aria-label",
    isExpanded ? t("leaderboardCollapseLabel") : t("leaderboardExpandLabel")
  );
}

function openLeaderboardModal() {
  if (!elements.leaderboardExpandButton || !elements.leaderboardOverlay) {
    return;
  }
  setLeaderboardButtonState(true);
  elements.leaderboardOverlay.classList.add("is-active");
  elements.leaderboardOverlay.setAttribute("aria-hidden", "false");
  if (elements.leaderboardSection) {
    elements.leaderboardSection.classList.add("is-expanded");
  }
  document.body.classList.add("modal-open");
}

function closeLeaderboardModal() {
  if (!elements.leaderboardExpandButton || !elements.leaderboardOverlay) {
    return;
  }
  setLeaderboardButtonState(false);
  elements.leaderboardOverlay.classList.remove("is-active");
  elements.leaderboardOverlay.setAttribute("aria-hidden", "true");
  if (elements.leaderboardSection) {
    elements.leaderboardSection.classList.remove("is-expanded");
  }
  document.body.classList.remove("modal-open");
}

function toggleLeaderboardModal() {
  if (!elements.leaderboardOverlay) {
    return;
  }
  if (elements.leaderboardOverlay.classList.contains("is-active")) {
    closeLeaderboardModal();
  } else {
    openLeaderboardModal();
  }
}

function readJSON(key, fallback) {
  let raw = null;
  try {
    raw = localStorage.getItem(key);
  } catch (error) {
    return key in memoryStore ? memoryStore[key] : fallback;
  }
  if (!raw) {
    return key in memoryStore ? memoryStore[key] : fallback;
  }
  try {
    const parsed = JSON.parse(raw);
    memoryStore[key] = parsed;
    return parsed;
  } catch (error) {
    return key in memoryStore ? memoryStore[key] : fallback;
  }
}

function writeJSON(key, value) {
  memoryStore[key] = value;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    // Ignore storage failures (e.g. file:// or disabled storage)
  }
}

function normalizeUsername(value) {
  return value.trim().replace(/\s+/g, " ");
}

function isValidUsername(value) {
  return /^[A-Za-z0-9][A-Za-z0-9 _-]{1,23}$/.test(value);
}

function normalizePin(value) {
  return value.trim();
}

function isValidPin(value) {
  return /^\d{4,6}$/.test(value);
}

function normalizeNomineeName(value) {
  return value
    ? value
        .toString()
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ")
    : "";
}

function normalizeWhitespace(text) {
  return text ? text.replace(/\s+/g, " ").trim() : "";
}

function decodeEntities(text) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

const ACTING_CATEGORIES = new Set([
  "actor in a leading role",
  "actor in a supporting role",
  "actress in a leading role",
  "actress in a supporting role"
]);

const DIRECTING_CATEGORY = "directing";

function shouldAppendDetail(categoryName) {
  const normalized = categoryName.toLowerCase();
  return ACTING_CATEGORIES.has(normalized) || normalized === DIRECTING_CATEGORY;
}

function formatNomineeLabel(categoryName, nominee, detail) {
  if (!detail || detail === nominee) {
    return nominee;
  }
  if (categoryName.toLowerCase().includes("international feature film")) {
    return `${nominee} — ${detail}`;
  }
  if (shouldAppendDetail(categoryName)) {
    return `${nominee} (${detail})`;
  }
  return nominee;
}

function stripNomineeDetail(value) {
  if (!value) {
    return "";
  }
  return value.replace(/\s*[\u2014-]\s*.+$/, "").replace(/\s*\(.+\)\s*$/, "");
}

function getUsers() {
  return readJSON(STORAGE_KEYS.users, []);
}

function findUser(username) {
  return getUsers().find(
    (user) => user.username.toLowerCase() === username.toLowerCase()
  );
}

function getPicks() {
  return readJSON(STORAGE_KEYS.picks, []);
}

function getResults() {
  return readJSON(STORAGE_KEYS.results, {
    winnersByCategoryId: {},
    finalizedAt: null,
    ceremonyYear: null
  });
}

function getCurrentUser() {
  return memoryStore[STORAGE_KEYS.currentUser];
}

function setCurrentUser(username) {
  memoryStore[STORAGE_KEYS.currentUser] = username;
  try {
    if (username) {
      localStorage.setItem(STORAGE_KEYS.currentUser, username);
    } else {
      localStorage.removeItem(STORAGE_KEYS.currentUser);
    }
  } catch (error) {
    // Ignore storage failures
  }
}

function getCurrentUserId() {
  return memoryStore[STORAGE_KEYS.currentUserId];
}

function setCurrentUserId(userId) {
  memoryStore[STORAGE_KEYS.currentUserId] = userId;
  try {
    if (userId) {
      localStorage.setItem(STORAGE_KEYS.currentUserId, userId);
    } else {
      localStorage.removeItem(STORAGE_KEYS.currentUserId);
    }
  } catch (error) {
    // Ignore storage failures
  }
}

function setStatus(target, message) {
  if (!target) {
    return;
  }
  target.textContent = message;
}

function setFormEnabled(form, enabled) {
  form.querySelectorAll("select, button, input").forEach((field) => {
    field.disabled = !enabled;
  });
}

function createCategorySelect(category, selectedValue, prefix) {
  const wrapper = document.createElement("div");
  wrapper.className = "field";

  const label = document.createElement("label");
  label.textContent = getCategoryLabel(category);
  label.setAttribute("for", `${prefix}-${category.id}`);
  wrapper.appendChild(label);

  const select = document.createElement("select");
  select.name = category.id;
  select.id = `${prefix}-${category.id}`;
  select.required = true;

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = t("selectNominee");
  placeholder.disabled = true;
  placeholder.selected = !selectedValue;
  select.appendChild(placeholder);

  category.nominees.forEach((nominee) => {
    const option = document.createElement("option");
    option.value = nominee;
    option.textContent = nominee;
    if (selectedValue === nominee) {
      option.selected = true;
    }
    select.appendChild(option);
  });

  wrapper.appendChild(select);
  return wrapper;
}

function highlightMissingPicks() {
  if (!elements.picksForm) {
    return;
  }
  state.categories.forEach((category) => {
    const select = elements.picksForm.querySelector(
      `select[name="${category.id}"]`
    );
    if (!select) {
      return;
    }
    const wrapper = select.closest(".field");
    if (!wrapper) {
      return;
    }
    if (select.value) {
      wrapper.classList.remove("is-missing");
    } else {
      wrapper.classList.add("is-missing");
    }
  });
}

function renderCategories() {
  const currentUser = getCurrentUser();
  const hasSession = Boolean(currentUser && sessionPin);
  const userPicks = hasSession
    ? state.picks.find((entry) => entry.username === currentUser)
    : null;
  const localPicks = hasSession ? getPicks() : [];
  const localUserPicks = hasSession
    ? localPicks.find((entry) => entry.username === currentUser)
    : null;
  const picksByCategoryId = hasSession
    ? userPicks?.picks_by_category || localUserPicks?.picksByCategoryId || {}
    : {};

  elements.picksContainer.innerHTML = "";

  state.categories.forEach((category) => {
    elements.picksContainer.appendChild(
      createCategorySelect(category, picksByCategoryId[category.id], "picks")
    );
  });

  setFormEnabled(elements.picksForm, Boolean(currentUser));
  highlightMissingPicks();
}

function renderNomineesList(container) {
  if (!container) {
    return;
  }
  container.innerHTML = "";
  if (!state.categories.length) {
    return;
  }
  const results = getResults();
  const hasWinners =
    results &&
    results.winnersByCategoryId &&
    Object.keys(results.winnersByCategoryId).length > 0 &&
    results.ceremonyYear &&
    results.ceremonyYear === state.ceremonyYear;
  const winners = hasWinners ? results.winnersByCategoryId : {};
  const currentUser = getCurrentUser();
  const hasSession = Boolean(currentUser && sessionPin);
  const userPicks = hasSession
    ? state.picks.find((entry) => entry.username === currentUser)
    : null;
  const localPicks = hasSession ? getPicks() : [];
  const localUserPicks = hasSession
    ? localPicks.find((entry) => entry.username === currentUser)
    : null;
  const picksByCategoryId = hasSession
    ? userPicks?.picks_by_category || localUserPicks?.picksByCategoryId || {}
    : {};

  state.categories.forEach((category) => {
    const group = document.createElement("div");
    group.className = "nominee-group";

    const title = document.createElement("p");
    title.className = "nominee-title";
    title.textContent = getCategoryLabel(category);
    group.appendChild(title);

    const list = document.createElement("ul");
    list.className = "nominees-list";

    const winner = winners[category.id];
    const normalizedWinner = normalizeNomineeName(winner);
    const normalizedWinnerFallback = normalizeNomineeName(
      stripNomineeDetail(winner)
    );
    const userPick = picksByCategoryId[category.id];
    const normalizedPick = normalizeNomineeName(userPick);

    category.nominees.forEach((nominee) => {
      const li = document.createElement("li");
      const normalizedNominee = normalizeNomineeName(nominee);
      const isWinner =
        (normalizedWinner && normalizedNominee === normalizedWinner) ||
        (normalizedWinnerFallback &&
          normalizedNominee === normalizedWinnerFallback);
      const isUserPick = normalizedPick && normalizedNominee === normalizedPick;
      if (isWinner) {
        li.classList.add("is-winner");
        li.setAttribute("aria-label", `${nominee} - ${t("winnerLabel")}`);
        const icon = document.createElement("span");
        icon.className = "winner-icon";
        icon.innerHTML = trophyIcon;
        li.appendChild(icon);
      }
      const name = document.createElement("span");
      name.className = "nominee-name";
      name.textContent = nominee;
      li.appendChild(name);

      if (isWinner) {
        const badge = document.createElement("span");
        badge.className = "winner-tag";
        badge.textContent = t("winnerLabel");
        li.appendChild(badge);
      }

      if (hasSession && normalizedWinner && isUserPick) {
        const pickBadge = document.createElement("span");
        const isCorrect = isWinner;
        pickBadge.className = `pick-result ${isCorrect ? "is-correct" : "is-wrong"}`;
        pickBadge.textContent = isCorrect ? "✓" : "✕";
        pickBadge.setAttribute(
          "aria-label",
          isCorrect ? t("pickCorrectLabel") : t("pickWrongLabel")
        );
        li.appendChild(pickBadge);
        if (!isCorrect) {
          li.classList.add("is-wrong-pick");
        }
      }

      list.appendChild(li);
    });

    group.appendChild(list);
    container.appendChild(group);
  });
}

function updatePicksPanel() {
  const votingOpen = isVotingOpen();
  if (elements.picksTitle) {
    elements.picksTitle.textContent = votingOpen
      ? t("picksTitle")
      : t("picksClosedTitle");
  }
  if (elements.picksSubtitle) {
    elements.picksSubtitle.textContent = votingOpen
      ? t("picksSubtitle")
      : t("picksClosedSubtitle");
  }
  if (elements.picksDeadline) {
    elements.picksDeadline.hidden = !votingOpen;
    if (votingOpen) {
      elements.picksDeadline.textContent = t("picksDeadline");
    }
  }
  if (elements.picksForm) {
    elements.picksForm.hidden = !votingOpen;
  }
  if (elements.picksResults) {
    elements.picksResults.hidden = votingOpen;
    if (!votingOpen) {
      renderNomineesList(elements.picksResults);
    } else {
      elements.picksResults.innerHTML = "";
    }
  }
  if (elements.picksResultsUpdated) {
    elements.picksResultsUpdated.hidden = votingOpen || !lastResultsUpdatedAt;
  }
  if (elements.resultsSection) {
    elements.resultsSection.hidden = !votingOpen;
  }
}

function renderCurrentUser() {
  const currentUser = getCurrentUser();
  const hasUser = Boolean(currentUser);
  if (elements.registrationEmpty && elements.registrationSummary) {
    elements.registrationEmpty.hidden = hasUser;
    elements.registrationSummary.hidden = !hasUser;
  }
  if (elements.updateUsernameForm) {
    elements.updateUsernameForm.hidden = true;
  }
  if (elements.usernameStatus) {
    elements.usernameStatus.textContent = "";
  }
  if (elements.updateStatus) {
    elements.updateStatus.textContent = "";
  }
  if (elements.currentUser) {
    elements.currentUser.textContent = currentUser || "";
  }
  if (elements.personalLinkInput) {
    elements.personalLinkInput.value =
      currentUser && sessionPin
        ? buildPersonalLink(currentUser, sessionPin)
        : "";
  }
  if (elements.copyStatus) {
    elements.copyStatus.textContent = "";
  }

  setFormEnabled(elements.picksForm, Boolean(currentUser));
}

function applyDeadlineState() {
  const votingOpen = isVotingOpen();
  if (elements.picksForm) {
    setFormEnabled(elements.picksForm, Boolean(getCurrentUser()) && votingOpen);
  }

  const usernameLocked = !votingOpen;
  if (elements.registrationForm) {
    setFormEnabled(elements.registrationForm, !usernameLocked);
  }
  if (elements.editUsernameButton) {
    elements.editUsernameButton.disabled = usernameLocked;
  }
  if (elements.addUserButton) {
    elements.addUserButton.disabled = usernameLocked;
  }
  if (elements.updateUsernameForm) {
    setFormEnabled(elements.updateUsernameForm, !usernameLocked);
  }
  updatePicksPanel();
}

function saveUser(username, pin, userId) {
  setCurrentUser(username);
  setCurrentUserId(userId);
  sessionPin = pin;
}

function savePicks(picksByCategoryId) {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    return;
  }
  const picks = getPicks();
  const existing = picks.find((entry) => entry.username === currentUser);
  if (existing) {
    existing.picksByCategoryId = picksByCategoryId;
  } else {
    picks.push({ username: currentUser, picksByCategoryId });
  }
  writeJSON(STORAGE_KEYS.picks, picks);
}

function saveResults(winnersByCategoryId) {
  writeJSON(STORAGE_KEYS.results, {
    winnersByCategoryId,
    finalizedAt: new Date().toISOString(),
    ceremonyYear: state.ceremonyYear
  });
  renderResults();
  updatePicksPanel();
}

function renderResultsStatus() {
  if (!elements.resultsStatus) {
    return;
  }
  const results = getResults();
  const hasWinners =
    results &&
    results.winnersByCategoryId &&
    Object.keys(results.winnersByCategoryId).length > 0 &&
    results.ceremonyYear &&
    results.ceremonyYear === state.ceremonyYear;
  setStatus(
    elements.resultsStatus,
    hasWinners ? t("resultsUpdated") : t("resultsUnavailable")
  );
  renderResults();
}

function renderResults() {
  if (elements.resultsContainer) {
    elements.resultsContainer.hidden = true;
    elements.resultsContainer.innerHTML = "";
  }
  if (elements.resultsSection) {
    elements.resultsSection.hidden = !isVotingOpen();
  }
  if (elements.resultsUpdated) {
    elements.resultsUpdated.hidden = !isVotingOpen() || !lastResultsUpdatedAt;
  }
}

function calculateScores() {
  const picks = state.picks;
  const results = getResults();
  const scores = [];

  picks.forEach((entry) => {
    let total = 0;
    let correct = 0;
    const picksByCategoryId = entry.picks_by_category || {};
    const votedCount = Object.values(picksByCategoryId || {}).filter(
      Boolean
    ).length;
    state.categories.forEach((category) => {
      const selected = picksByCategoryId[category.id];
      const winner = results.winnersByCategoryId[category.id];
      if (selected && winner && selected === winner) {
        const points = Number(category.points || state.pointsPerCategory);
        total += points;
        correct += 1;
      }
    });

    scores.push({
      username: entry.username,
      score: total,
      correct,
      votedCount
    });
  });

  scores.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    if (b.correct !== a.correct) {
      return b.correct - a.correct;
    }
    return a.username.localeCompare(b.username);
  });

  return scores;
}

function renderLeaderboard() {
  const scores = calculateScores();

  elements.leaderboardBody.innerHTML = "";

  if (scores.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 5;
    cell.textContent = t("leaderboardNoPicks");
    row.appendChild(cell);
    elements.leaderboardBody.appendChild(row);
    setStatus(elements.leaderboardStatus, "");
    return;
  }

  let currentRank = 1;
  let previousScore = null;
  let previousCorrect = null;

  scores.forEach((entry, index) => {
    if (entry.score !== previousScore || entry.correct !== previousCorrect) {
      currentRank = index + 1;
      previousScore = entry.score;
      previousCorrect = entry.correct;
    }

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${currentRank}</td>
      <td>${entry.username}</td>
      <td>${entry.votedCount}</td>
      <td>${entry.score}</td>
      <td>${entry.correct} / ${state.categories.length}</td>
    `;
    elements.leaderboardBody.appendChild(row);
  });

  setStatus(elements.leaderboardStatus, t("leaderboardUpdated"));
  renderSimilarityMatrix();
}

function computeSimilarity(aPicks, bPicks) {
  const keys = Object.keys(state.categories.reduce((acc, category) => {
    acc[category.id] = true;
    return acc;
  }, {}));
  let compared = 0;
  let matched = 0;
  keys.forEach((key) => {
    const a = aPicks?.[key];
    const b = bPicks?.[key];
    if (a && b) {
      compared += 1;
      if (a === b) {
        matched += 1;
      }
    }
  });
  return {
    compared,
    matched,
    percent: compared ? Math.round((matched / compared) * 100) : 0
  };
}

function renderSimilarityMatrix() {
  if (!elements.similarityHeader || !elements.similarityBody) {
    return;
  }
  const rows = state.picks || [];
  const users = rows
    .map((row) => row.username)
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  elements.similarityHeader.innerHTML = "";
  elements.similarityBody.innerHTML = "";

  if (users.length < 2) {
    setStatus(elements.similarityStatus, t("similarityEmpty"));
    return;
  }

  setStatus(elements.similarityStatus, "");

  const corner = document.createElement("th");
  corner.textContent = "";
  elements.similarityHeader.appendChild(corner);
  users.forEach((user) => {
    const th = document.createElement("th");
    th.textContent = user;
    elements.similarityHeader.appendChild(th);
  });

  const pickMap = rows.reduce((acc, row) => {
    acc[row.username] = row.picks_by_category || {};
    return acc;
  }, {});

  users.forEach((rowUser) => {
    const tr = document.createElement("tr");
    const th = document.createElement("th");
    th.textContent = rowUser;
    tr.appendChild(th);

    users.forEach((colUser) => {
      const td = document.createElement("td");
      td.className = "heatmap-cell";
      if (rowUser === colUser) {
        td.textContent = "—";
        td.classList.add("is-self");
      } else {
        const { compared, matched, percent } = computeSimilarity(
          pickMap[rowUser],
          pickMap[colUser]
        );
        td.textContent = compared ? `${percent}%` : "—";
        const bucket = compared ? Math.min(5, Math.floor(percent / 20)) : 0;
        td.classList.add(`heat-${bucket}`);
      }
      tr.appendChild(td);
    });
    elements.similarityBody.appendChild(tr);
  });
}

function handleRegistrationSubmit(event) {
  event.preventDefault();
  if (!isVotingOpen()) {
    setStatus(elements.usernameStatus, t("accountLocked"));
    return;
  }
  const raw = elements.usernameInput.value;
  const username = normalizeUsername(raw);
  const rawPin = elements.pinInput.value;
  const pin = normalizePin(rawPin);

  if (!isValidUsername(username)) {
    elements.usernameInput.setAttribute("aria-invalid", "true");
    setStatus(elements.usernameStatus, t("usernameInvalid"));
    elements.usernameInput.focus();
    return;
  }
  if (!isValidPin(pin)) {
    elements.pinInput.setAttribute("aria-invalid", "true");
    setStatus(elements.usernameStatus, t("pinInvalid"));
    elements.pinInput.focus();
    return;
  }

  elements.usernameInput.removeAttribute("aria-invalid");
  elements.pinInput.removeAttribute("aria-invalid");
  loginWithSupabase(username, pin, true);
}

function handleUpdateUsernameSubmit(event) {
  event.preventDefault();
  if (!isVotingOpen()) {
    setStatus(elements.updateStatus, t("accountLocked"));
    return;
  }
  const raw = elements.updateUsernameInput.value;
  const username = normalizeUsername(raw);
  const rawPin = elements.updatePinInput.value;
  const pin = normalizePin(rawPin);

  if (!isValidUsername(username)) {
    elements.updateUsernameInput.setAttribute("aria-invalid", "true");
    setStatus(elements.updateStatus, t("usernameInvalid"));
    elements.updateUsernameInput.focus();
    return;
  }
  if (!isValidPin(pin)) {
    elements.updatePinInput.setAttribute("aria-invalid", "true");
    setStatus(elements.updateStatus, t("pinInvalid"));
    elements.updatePinInput.focus();
    return;
  }

  elements.updateUsernameInput.removeAttribute("aria-invalid");
  elements.updatePinInput.removeAttribute("aria-invalid");
  renameUserWithSupabase(username, pin);
}

function openUpdateUsername() {
  if (!elements.updateUsernameForm) {
    return;
  }
  elements.updateUsernameForm.hidden = false;
  elements.updateUsernameInput.focus();
}

function cancelUpdateUsername() {
  if (!elements.updateUsernameForm) {
    return;
  }
  elements.updateUsernameForm.hidden = true;
  elements.updateUsernameInput.value = "";
}

function startAddUser() {
  if (!isVotingOpen()) {
    setStatus(elements.usernameStatus, t("accountLocked"));
    return;
  }
  if (elements.registrationEmpty && elements.registrationSummary) {
    elements.registrationSummary.hidden = true;
    elements.registrationEmpty.hidden = false;
  }
  elements.usernameInput.focus();
}

function buildPersonalLink(username, pin) {
  const url = new URL(window.location.href);
  url.searchParams.set("user", username);
  if (pin) {
    url.searchParams.set("pin", pin);
  }
  return url.toString();
}

function ensureSupabase() {
  if (!supabaseClient) {
    setStatus(elements.usernameStatus, t("supabaseMissing"));
    return false;
  }
  return true;
}

async function loginWithSupabase(username, pin, showSuccess) {
  if (!ensureSupabase()) {
    return;
  }
  try {
    const { data, error } = await supabaseClient.rpc("login_user", {
      p_username: username,
      p_pin: pin
    });
    if (error || !data) {
      setStatus(elements.usernameStatus, t("loginFailed"));
      return;
    }
    saveUser(username, pin, data);
    setStatus(
      elements.usernameStatus,
      showSuccess ? t("usernameSaved", username) : ""
    );
    elements.usernameInput.value = "";
    elements.pinInput.value = "";
    renderCurrentUser();
    renderCategories();
    await fetchLeaderboardPicks();
    renderLeaderboard();
  } catch (error) {
    setStatus(elements.usernameStatus, t("loginFailed"));
  }
}

async function renameUserWithSupabase(newUsername, pin) {
  if (!ensureSupabase()) {
    return;
  }
  const userId = getCurrentUserId();
  if (!userId) {
    return;
  }
  try {
    const { data, error } = await supabaseClient.rpc("rename_user", {
      p_user_id: userId,
      p_pin: pin,
      p_new_username: newUsername
    });
    if (error || !data) {
      setStatus(elements.updateStatus, t("pinMismatch"));
      return;
    }
    saveUser(newUsername, pin, userId);
    setStatus(elements.updateStatus, t("usernameUpdated", newUsername));
    elements.updateUsernameInput.value = "";
    elements.updatePinInput.value = "";
    elements.updateUsernameForm.hidden = true;
    renderCurrentUser();
    await fetchLeaderboardPicks();
    renderLeaderboard();
  } catch (error) {
    setStatus(elements.updateStatus, t("loginFailed"));
  }
}

async function savePicksWithSupabase(picksByCategoryId, missing) {
  if (!ensureSupabase()) {
    return;
  }
  const userId = getCurrentUserId();
  if (!userId || !sessionPin) {
    setStatus(elements.picksStatus, t("loginFailed"));
    return;
  }
  try {
    const { data, error } = await supabaseClient.rpc("save_picks", {
      p_user_id: userId,
      p_pin: sessionPin,
      p_picks: picksByCategoryId
    });
    if (error || !data) {
      setStatus(elements.picksStatus, t("saveFailed"));
      return;
    }
    setStatus(elements.picksStatus, t("picksSaved", missing));
    await fetchLeaderboardPicks();
    renderLeaderboard();
  } catch (error) {
    setStatus(elements.picksStatus, t("saveFailed"));
  }
}

async function fetchLeaderboardPicks() {
  if (!supabaseClient) {
    return;
  }
  try {
    const { data, error } = await supabaseClient
      .from("leaderboard_picks")
      .select("username, picks_by_category");
    if (error) {
      return;
    }
    state.picks = data || [];
  } catch (error) {
    return;
  }
}

async function handleCopyLink() {
  if (!elements.personalLinkInput) {
    return;
  }
  const link = elements.personalLinkInput.value;
  if (!link) {
    return;
  }

  try {
    await navigator.clipboard.writeText(link);
    setStatus(elements.copyStatus, t("linkCopied"));
  } catch (error) {
    elements.personalLinkInput.select();
    setStatus(elements.copyStatus, t("linkCopyFailed"));
  }
}

async function applyUserFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get("user") || params.get("username");
  const rawPin = params.get("pin");
  if (!raw) {
    return;
  }
  const username = normalizeUsername(raw);
  if (!isValidUsername(username)) {
    return;
  }
  if (!rawPin) {
    return;
  }
  const pin = normalizePin(rawPin);
  if (!isValidPin(pin)) {
    return;
  }
  await loginWithSupabase(username, pin, false);
}

function handlePicksSubmit(event) {
  event.preventDefault();
  if (!isVotingOpen()) {
    setStatus(elements.picksStatus, t("votingClosed"));
    return;
  }
  const picksByCategoryId = {};
  let missing = 0;
  let selectedCount = 0;

  state.categories.forEach((category) => {
    const select = elements.picksForm.querySelector(
      `select[name="${category.id}"]`
    );
    const value = select.value;
    if (!value) {
      missing += 1;
    } else {
      picksByCategoryId[category.id] = value;
      selectedCount += 1;
    }
  });

  if (selectedCount === 0) {
    highlightMissingPicks();
    setStatus(elements.picksStatus, t("picksRequired"));
    return;
  }

  highlightMissingPicks();
  savePicksWithSupabase(picksByCategoryId, missing);
}

async function fetchWinnersFromOscars() {
  if (!elements.resultsStatus || !state.ceremonyYear) {
    return;
  }
  markResultsUpdated();
  setStatus(elements.resultsStatus, t("resultsLoading"));
  const url = `https://r.jina.ai/http://www.oscars.org/oscars/ceremonies/${state.ceremonyYear}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      setStatus(elements.resultsStatus, t("resultsUnavailable"));
      return;
    }
    const text = await response.text();
    const winnersByCategoryId = parseWinnersFromText(text);
    if (!Object.keys(winnersByCategoryId).length) {
      setStatus(elements.resultsStatus, t("resultsUnavailable"));
      return;
    }
    saveResults(winnersByCategoryId);
    setStatus(elements.resultsStatus, t("resultsUpdated"));
    renderLeaderboard();
    renderResults();
    updatePicksPanel();
  } catch (error) {
    setStatus(elements.resultsStatus, t("resultsUnavailable"));
  }
}

function shouldPollResults() {
  const now = new Date();
  const windowStart = new Date(Date.UTC(2026, 2, 15, 20, 0, 0));
  const windowEnd = new Date(Date.UTC(2026, 2, 16, 8, 0, 0));
  return now >= windowStart && now <= windowEnd;
}

function scheduleResultsPolling() {
  if (!shouldPollResults()) {
    return;
  }
  setInterval(fetchWinnersFromOscars, 60 * 60 * 1000);
}

function parseWinnersFromText(rawText) {
  const lines = rawText
    .split("\n")
    .map((line) => decodeEntities(normalizeWhitespace(line)))
    .filter(Boolean);

  const winnersByCategoryId = {};
  const isCategoryLine = (index) =>
    Boolean(lines[index]) &&
    lines[index] !== "Winner" &&
    lines[index + 1] === "Winner";
  const isDetailLine = (index) =>
    Boolean(lines[index]) &&
    lines[index] !== "Winner" &&
    lines[index] !== "Nominees" &&
    lines[index] !== "NOMINEES" &&
    !isCategoryLine(index);

  for (let i = 0; i < lines.length - 2; i += 1) {
    if (!isCategoryLine(i)) {
      continue;
    }
    const categoryName = lines[i];
    const winnerName = lines[i + 2];
    const detailCandidate = lines[i + 3] || "";
    const detail = isDetailLine(i + 3) ? detailCandidate : "";
    const category = state.categories.find(
      (entry) => entry.name === categoryName
    );
    if (category && winnerName) {
      winnersByCategoryId[category.id] = formatNomineeLabel(
        categoryName,
        winnerName,
        detail
      );
    }
  }

  return winnersByCategoryId;
}

function handleExport() {
  const payload = {
    users: getUsers(),
    picks: getPicks(),
    results: getResults(),
    currentUser: getCurrentUser()
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json"
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "oscars-forecast-data.json";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  setStatus(elements.dataStatus, t("exportReady"));
}

function handleImport(event) {
  const file = event.target.files[0];
  if (!file) {
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (data.users) {
        writeJSON(STORAGE_KEYS.users, data.users);
      }
      if (data.picks) {
        writeJSON(STORAGE_KEYS.picks, data.picks);
      }
      if (data.results) {
        writeJSON(STORAGE_KEYS.results, data.results);
      }
      if (data.currentUser) {
        setCurrentUser(data.currentUser);
      }
      renderCurrentUser();
      renderCategories();
      renderLeaderboard();
      setStatus(elements.dataStatus, t("importSuccess"));
    } catch (error) {
      setStatus(elements.dataStatus, t("importFailed"));
    }
  };
  reader.readAsText(file);
  event.target.value = "";
}

function handleClearData() {
  localStorage.removeItem(STORAGE_KEYS.results);
  localStorage.removeItem(STORAGE_KEYS.currentUser);
  localStorage.removeItem(STORAGE_KEYS.currentUserId);
  renderCurrentUser();
  renderCategories();
  renderLeaderboard();
  setStatus(elements.dataStatus, t("cleared"));
}

async function handleLanguageChange(value) {
  setLanguage(value);
  applyTranslations();
  renderResultsStatus();
  await applyUserFromUrl();
  renderCurrentUser();
  renderCategories();
  await fetchLeaderboardPicks();
  renderLeaderboard();
  applyDeadlineState();
  renderResults();
}

async function init() {
  try {
    const storedLang = localStorage.getItem(STORAGE_KEYS.language);
    if (storedLang) {
      currentLanguage = storedLang;
    } else {
      currentLanguage = getBrowserLanguage();
    }
  } catch (error) {
    currentLanguage = getBrowserLanguage();
  }
  memoryStore[STORAGE_KEYS.language] = currentLanguage;
  if (elements.languageSelect) {
    elements.languageSelect.value = currentLanguage;
  }
  try {
    const storedTheme = localStorage.getItem(STORAGE_KEYS.theme);
    if (storedTheme) {
      currentTheme = storedTheme;
    }
  } catch (error) {
    currentTheme = "system";
  }

  try {
    const response = await fetch("data/categories.json");
    const data = await response.json();
    state.categories = data.categories || [];
    state.pointsPerCategory = data.pointsPerCategory || 1;
    state.ceremonyDate = data.ceremonyDate || null;
    state.ceremonyYear = data.year || null;
  } catch (error) {
    setStatus(
      elements.dataStatus,
      t("loadFailed")
    );
  }

  setCurrentUser(null);
  applyTranslations();
  applyTheme(currentTheme);
  renderResultsStatus();
  await applyUserFromUrl();
  renderCurrentUser();
  renderCategories();
  updatePicksPanel();
  renderResults();
  await fetchLeaderboardPicks();
  renderLeaderboard();
  applyDeadlineState();

  elements.registrationForm.addEventListener("submit", handleRegistrationSubmit);
  if (elements.updateUsernameForm) {
    elements.updateUsernameForm.addEventListener(
      "submit",
      handleUpdateUsernameSubmit
    );
  }
  if (elements.editUsernameButton) {
    elements.editUsernameButton.addEventListener("click", openUpdateUsername);
  }
  if (elements.cancelUpdateButton) {
    elements.cancelUpdateButton.addEventListener("click", cancelUpdateUsername);
  }
  if (elements.addUserButton) {
    elements.addUserButton.addEventListener("click", startAddUser);
  }
  if (elements.copyLinkButton) {
    elements.copyLinkButton.addEventListener("click", handleCopyLink);
  }
  if (elements.picksForm) {
    elements.picksForm.addEventListener("submit", handlePicksSubmit);
    elements.picksForm.addEventListener("change", (event) => {
      if (event.target && event.target.matches("select")) {
        highlightMissingPicks();
      }
    });
  }
  fetchWinnersFromOscars();
  scheduleResultsPolling();
  if (elements.languageSelect) {
    elements.languageSelect.addEventListener("change", (event) => {
      handleLanguageChange(event.target.value);
    });
  }
  syncSimilarityButtonState();
  syncLeaderboardButtonState();
  if (elements.leaderboardExpandButton) {
    elements.leaderboardExpandButton.addEventListener("click", () => {
      toggleLeaderboardModal();
    });
  }
  if (elements.leaderboardOverlay) {
    elements.leaderboardOverlay.addEventListener("click", () => {
      closeLeaderboardModal();
    });
  }
  if (elements.similarityExpandButton) {
    elements.similarityExpandButton.addEventListener("click", () => {
      toggleSimilarityModal();
    });
  }
  if (elements.similarityOverlay) {
    elements.similarityOverlay.addEventListener("click", () => {
      closeSimilarityModal();
    });
  }
  if (elements.themeSelect) {
    elements.themeSelect.addEventListener("change", (event) => {
      applyTheme(event.target.value);
    });
  }
  document.addEventListener("change", (event) => {
    if (event.target && event.target.id === "language-select") {
      handleLanguageChange(event.target.value);
    }
    if (event.target && event.target.id === "theme-select") {
      applyTheme(event.target.value);
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeSimilarityModal();
      closeLeaderboardModal();
    }
  });
}

document.addEventListener("DOMContentLoaded", init);
