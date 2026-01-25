"use strict";

const STORAGE_KEYS = {
  users: "oscars_users",
  picks: "oscars_picks",
  results: "oscars_results",
  currentUser: "oscars_current_user",
  language: "oscars_language"
};

const state = {
  categories: [],
  pointsPerCategory: 1
};

let currentLanguage = "en";
const memoryStore = {
  oscars_users: [],
  oscars_picks: [],
  oscars_results: { winnersByCategoryId: {}, finalizedAt: null },
  oscars_current_user: null,
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
  resultsContainer: document.querySelector("#results-container"),
  resultsStatus: document.querySelector("#results-status"),
  leaderboardBody: document.querySelector("#leaderboard-body"),
  leaderboardStatus: document.querySelector("#leaderboard-status"),
  exportButton: document.querySelector("#export-data"),
  importInput: document.querySelector("#import-data"),
  clearButton: document.querySelector("#clear-data"),
  dataStatus: document.querySelector("#data-status"),
  languageSelect: document.querySelector("#language-select")
};

const translations = {
  en: {
    appName: "Oscars Forecast",
    languageLabel: "Language",
    documentTitle: "Oscars Forecast",
    metaDescription:
      "Make your Oscars picks, track results, and see a local leaderboard.",
    heroTitle: "Predict the Oscars and climb the leaderboard.",
    heroSubtitle:
      "Make your picks, earn points, and see how you stack up once results are in. No accounts, no personal details, just a simple and fun game.",
    howItWorksTitle: "How it works",
    howItWorksSubtitle: "Three quick steps to join the fun.",
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
    usernameHelp: "2–24 characters, letters and numbers only.",
    pinLabel: "PIN",
    pinHelp: "4–6 digits. You will need this to access your link.",
    saveUsername: "Save username",
    currentUser: (name) => `Current user: ${name}`,
    noUser: "No username saved yet.",
    picksTitle: "Your picks",
    picksSubtitle:
      "Make a selection for each category. You can update your picks any time before results are entered.",
    savePicks: "Save picks",
    resultsTitle: "Results entry",
    resultsSubtitle:
      "Enter winners to calculate scores. Results are stored locally in your browser only.",
    saveResults: "Save results",
    leaderboardTitle: "Leaderboard",
    leaderboardCaption: "Leaderboard with total points",
    leaderboardRank: "Rank",
    leaderboardUsername: "Username",
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
      "Built for fun. No personal info required and nothing is stored on a server.",
    selectNominee: "Select a nominee",
    usernameInvalid: "Username must be 2–24 letters or numbers.",
    pinInvalid: "PIN must be 4–6 digits.",
    usernameExists: "That username already exists. Choose another.",
    pinMismatch: "PIN does not match this username.",
    usernameSaved: (name) => `Saved username "${name}".`,
    usernameUpdated: (name) => `Username updated to "${name}".`,
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
      "Fai i tuoi pronostici, guadagna punti e scopri la tua posizione quando arrivano i risultati. Niente account, niente dati personali, solo un gioco semplice e divertente.",
    howItWorksTitle: "Come funziona",
    howItWorksSubtitle: "Tre passaggi veloci per iniziare.",
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
    usernameHelp: "2–24 caratteri, solo lettere e numeri.",
    pinLabel: "PIN",
    pinHelp: "4–6 cifre. Ti servirà per accedere al tuo link.",
    saveUsername: "Salva username",
    currentUser: (name) => `Utente attuale: ${name}`,
    noUser: "Nessun username salvato.",
    picksTitle: "I tuoi pronostici",
    picksSubtitle:
      "Seleziona un candidato per ogni categoria. Puoi modificare i pronostici fino all'inserimento dei risultati.",
    savePicks: "Salva pronostici",
    resultsTitle: "Inserisci risultati",
    resultsSubtitle:
      "Inserisci i vincitori per calcolare i punteggi. I risultati restano solo nel browser.",
    saveResults: "Salva risultati",
    leaderboardTitle: "Classifica",
    leaderboardCaption: "Classifica con punteggio totale",
    leaderboardRank: "Posizione",
    leaderboardUsername: "Username",
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
      "Creato per divertirsi. Nessun dato personale richiesto e nulla viene salvato su un server.",
    selectNominee: "Seleziona un candidato",
    usernameInvalid: "Lo username deve avere 2–24 lettere o numeri.",
    pinInvalid: "Il PIN deve avere 4–6 cifre.",
    usernameExists: "Questo username esiste già. Scegline un altro.",
    pinMismatch: "Il PIN non corrisponde a questo username.",
    usernameSaved: (name) => `Username "${name}" salvato.`,
    usernameUpdated: (name) => `Username aggiornato a "${name}".`,
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
    const value = translations[getLanguage()]?.[key] ?? translations.en[key];
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
  return value.trim();
}

function isValidUsername(value) {
  return /^[A-Za-z0-9]{2,24}$/.test(value);
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

function setStatus(target, message) {
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
  const picks = getPicks();
  const results = getResults();
  const currentUser = getCurrentUser();
  const userPicks = picks.find((entry) => entry.username === currentUser);
  const picksByCategoryId = userPicks ? userPicks.picksByCategoryId : {};

  elements.picksContainer.innerHTML = "";
  elements.resultsContainer.innerHTML = "";

  state.categories.forEach((category) => {
    elements.picksContainer.appendChild(
      createCategorySelect(category, picksByCategoryId[category.id], "picks")
    );

    elements.resultsContainer.appendChild(
      createCategorySelect(
        category,
        results.winnersByCategoryId[category.id],
        "results"
      )
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
    const user = currentUser ? findUser(currentUser) : null;
    elements.personalLinkInput.value =
      user && user.pin ? buildPersonalLink(user.username, user.pin) : "";
  }
  if (elements.copyStatus) {
    elements.copyStatus.textContent = "";
  }

  setFormEnabled(elements.picksForm, Boolean(currentUser));
}

function saveUser(username, pin) {
  const users = getUsers();
  const existing = users.find(
    (user) => user.username.toLowerCase() === username.toLowerCase()
  );
  if (!existing) {
    users.push({ username, pin, createdAt: new Date().toISOString() });
    writeJSON(STORAGE_KEYS.users, users);
  }
  setCurrentUser(username);
}

function ensureUserPin(username, pin) {
  const users = getUsers();
  const existing = users.find(
    (user) => user.username.toLowerCase() === username.toLowerCase()
  );
  if (!existing) {
    return false;
  }
  if (!existing.pin) {
    existing.pin = pin;
    writeJSON(STORAGE_KEYS.users, users);
  }
  return true;
}

function renameUser(oldUsername, newUsername, pin) {
  const users = getUsers();
  const existing = users.find(
    (user) => user.username.toLowerCase() === oldUsername.toLowerCase()
  );
  if (!existing || existing.pin !== pin) {
    return false;
  }
  const nameTaken = users.some(
    (user) => user.username.toLowerCase() === newUsername.toLowerCase()
  );
  if (nameTaken) {
    return false;
  }
  existing.username = newUsername;
  writeJSON(STORAGE_KEYS.users, users);

  const picks = getPicks();
  const pickEntry = picks.find(
    (entry) => entry.username.toLowerCase() === oldUsername.toLowerCase()
  );
  if (pickEntry) {
    pickEntry.username = newUsername;
    writeJSON(STORAGE_KEYS.picks, picks);
  }

  const currentUser = getCurrentUser();
  if (currentUser && currentUser.toLowerCase() === oldUsername.toLowerCase()) {
    setCurrentUser(newUsername);
  }
  return true;
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
  const picks = getPicks();
  const results = getResults();
  const scores = [];

  picks.forEach((entry) => {
    let total = 0;
    let correct = 0;
    state.categories.forEach((category) => {
      const selected = entry.picksByCategoryId[category.id];
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
      correct
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
  const results = getResults();
  const hasResults = Object.keys(results.winnersByCategoryId).length > 0;
  const scores = calculateScores();

  elements.leaderboardBody.innerHTML = "";

  if (!hasResults) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 4;
    cell.textContent = t("leaderboardEmpty");
    row.appendChild(cell);
    elements.leaderboardBody.appendChild(row);
    setStatus(elements.leaderboardStatus, "");
    return;
  }

  if (scores.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 4;
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
      <td>${entry.score}</td>
      <td>${entry.correct} / ${state.categories.length}</td>
    `;
    elements.leaderboardBody.appendChild(row);
  });

  setStatus(elements.leaderboardStatus, t("leaderboardUpdated"));
}

function handleRegistrationSubmit(event) {
  event.preventDefault();
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

  const existing = findUser(username);
  if (existing) {
    if (existing.pin && existing.pin !== pin) {
      setStatus(elements.usernameStatus, t("usernameExists"));
      return;
    }
    ensureUserPin(username, pin);
  } else {
    saveUser(username, pin);
  }
  setStatus(elements.usernameStatus, t("usernameSaved", username));
  if (existing) {
    setCurrentUser(existing.username);
  }
  renderCurrentUser();
  renderCategories();
  elements.usernameInput.value = "";
  elements.pinInput.value = "";
}

function handleUpdateUsernameSubmit(event) {
  event.preventDefault();
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

  const currentUser = getCurrentUser();
  if (!currentUser) {
    return;
  }

  const existing = findUser(username);
  if (existing) {
    setStatus(elements.updateStatus, t("usernameExists"));
    return;
  }

  const renamed = renameUser(currentUser, username, pin);
  if (!renamed) {
    setStatus(elements.updateStatus, t("pinMismatch"));
    return;
  }
  renderCurrentUser();
  renderCategories();
  setStatus(elements.updateStatus, t("usernameUpdated", username));
  elements.updateUsernameInput.value = "";
  elements.updatePinInput.value = "";
  elements.updateUsernameForm.hidden = true;
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

function applyUserFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get("user");
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
  const existing = findUser(username);
  if (existing && existing.pin === pin) {
    setCurrentUser(existing.username);
  }
}

function handlePicksSubmit(event) {
  event.preventDefault();
  const picksByCategoryId = {};
  let missing = 0;

  state.categories.forEach((category) => {
    const select = elements.picksForm.querySelector(
      `select[name="${category.id}"]`
    );
    const value = select.value;
    if (!value) {
      missing += 1;
    } else {
      picksByCategoryId[category.id] = value;
    }
  });

  savePicks(picksByCategoryId);
  setStatus(elements.picksStatus, t("picksSaved", missing));
  renderLeaderboard();
}

function handleResultsSubmit(event) {
  event.preventDefault();
  const winnersByCategoryId = {};
  let missing = 0;

  state.categories.forEach((category) => {
    const select = elements.resultsForm.querySelector(
      `select[name="${category.id}"]`
    );
    const value = select.value;
    if (!value) {
      missing += 1;
    } else {
      winnersByCategoryId[category.id] = value;
    }
  });

  saveResults(winnersByCategoryId);
  setStatus(elements.resultsStatus, t("resultsSaved", missing));
  renderLeaderboard();
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
  localStorage.removeItem(STORAGE_KEYS.users);
  localStorage.removeItem(STORAGE_KEYS.picks);
  localStorage.removeItem(STORAGE_KEYS.results);
  localStorage.removeItem(STORAGE_KEYS.currentUser);
  renderCurrentUser();
  renderCategories();
  renderLeaderboard();
  setStatus(elements.dataStatus, t("cleared"));
}

function handleLanguageChange(value) {
  setLanguage(value);
  applyTranslations();
  applyUserFromUrl();
  renderCurrentUser();
  renderCategories();
  renderLeaderboard();
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
  } catch (error) {
    setStatus(
      elements.dataStatus,
      t("loadFailed")
    );
  }

  setCurrentUser(null);
  applyTranslations();
  applyUserFromUrl();
  renderCurrentUser();
  renderCategories();
  renderLeaderboard();

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
  elements.resultsForm.addEventListener("submit", handleResultsSubmit);
  elements.exportButton.addEventListener("click", handleExport);
  elements.importInput.addEventListener("change", handleImport);
  elements.clearButton.addEventListener("click", handleClearData);
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
