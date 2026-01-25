"use strict";

const STORAGE_KEYS = {
  users: "oscars_users",
  picks: "oscars_picks",
  results: "oscars_results",
  currentUser: "oscars_current_user",
  currentUserId: "oscars_current_user_id",
  language: "oscars_language"
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
  resultsForm: document.querySelector("#results-form"),
  resultsStatus: document.querySelector("#results-status"),
  leaderboardBody: document.querySelector("#leaderboard-body"),
  leaderboardStatus: document.querySelector("#leaderboard-status"),
  languageSelect: document.querySelector("#language-select")
};

const translations = {
  en: {
    appName: "Oscars Predictions",
    languageLabel: "Language",
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
    finalizedAt: null
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

function renderCategories() {
  const currentUser = getCurrentUser();
  const userPicks = state.picks.find((entry) => entry.username === currentUser);
  const localPicks = getPicks();
  const localUserPicks = localPicks.find(
    (entry) => entry.username === currentUser
  );
  const picksByCategoryId =
    userPicks?.picks_by_category || localUserPicks?.picksByCategoryId || {};

  elements.picksContainer.innerHTML = "";

  state.categories.forEach((category) => {
    elements.picksContainer.appendChild(
      createCategorySelect(category, picksByCategoryId[category.id], "picks")
    );
  });

  setFormEnabled(elements.picksForm, Boolean(currentUser));
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
    finalizedAt: new Date().toISOString()
  });
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
    setStatus(elements.picksStatus, t("picksRequired"));
    return;
  }

  savePicksWithSupabase(picksByCategoryId, missing);
}

async function fetchWinnersFromOscars() {
  if (!elements.resultsStatus || !state.ceremonyYear) {
    return;
  }
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
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const winnersByCategoryId = {};
  const isCategoryLine = (index) =>
    Boolean(lines[index]) &&
    lines[index] !== "Winner" &&
    lines[index + 1] === "Winner";

  for (let i = 0; i < lines.length - 2; i += 1) {
    if (!isCategoryLine(i)) {
      continue;
    }
    const categoryName = lines[i];
    const winnerName = lines[i + 2];
    const category = state.categories.find(
      (entry) => entry.name === categoryName
    );
    if (category && winnerName) {
      winnersByCategoryId[category.id] = winnerName;
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
  await applyUserFromUrl();
  renderCurrentUser();
  renderCategories();
  await fetchLeaderboardPicks();
  renderLeaderboard();
  applyDeadlineState();
}

async function init() {
  try {
    const storedLang = localStorage.getItem(STORAGE_KEYS.language);
    if (storedLang) {
      currentLanguage = storedLang;
    }
  } catch (error) {
    currentLanguage = "en";
  }
  memoryStore[STORAGE_KEYS.language] = currentLanguage;

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
  await applyUserFromUrl();
  renderCurrentUser();
  renderCategories();
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
  elements.picksForm.addEventListener("submit", handlePicksSubmit);
  fetchWinnersFromOscars();
  scheduleResultsPolling();
  if (elements.languageSelect) {
    elements.languageSelect.addEventListener("change", (event) => {
      handleLanguageChange(event.target.value);
    });
  }
  document.addEventListener("change", (event) => {
    if (event.target && event.target.id === "language-select") {
      handleLanguageChange(event.target.value);
    }
  });
}

document.addEventListener("DOMContentLoaded", init);
