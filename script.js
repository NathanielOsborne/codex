const githubUsername = "NathanielOsborne";
const apiUrl = `https://api.github.com/users/${githubUsername}/repos?sort=updated&per_page=100`;

const moodStorageKey = "dailyMoodVibe";
const moodHistoryKey = "dailyMoodHistory";
const moodNoteKey = "dailyMoodJournal";
const moodSoundKey = "dailyMoodSoundEnabled";
const vibeTapHighScoreKey = "vibeTapHighScore";
const oracleCollectionKey = "moodOracleCollectionV2";
const themeStorageKey = "siteThemeMode";

const validMoods = ["focused", "chill", "energetic", "calm"];
const moodContent = {
  focused: { emoji: "🧠", quote: "One focused block beats scattered effort.", challenge: "Do one 25-min deep-work sprint.", playlist: "https://open.spotify.com/search/deep%20focus" },
  chill: { emoji: "😎", quote: "Slow down and let ideas breathe.", challenge: "Take a phone-free 10-min walk.", playlist: "https://open.spotify.com/search/chill%20vibes" },
  energetic: { emoji: "⚡", quote: "Ride the momentum while it is here.", challenge: "Ship one small thing in an hour.", playlist: "https://open.spotify.com/search/high%20energy" },
  calm: { emoji: "🌿", quote: "Calm mind, clear decisions.", challenge: "Take five slow breaths now.", playlist: "https://open.spotify.com/search/calm%20focus" }
};

const vibeChallenges = {
  focused: ["Do a 15-min deep sprint now.", "Clear one tiny todo in 3 mins.", "Close all tabs except one."],
  chill: ["Stretch for 60 seconds.", "Drink water slowly.", "Step away from screens for 2 mins."],
  energetic: ["Do 20 quick taps on your desk.", "Launch one quick task now.", "Set a 10-min speed round."],
  calm: ["Inhale 4s, exhale 6s x 5.", "Relax your shoulders now.", "Write one grateful line."]
};

const vibeMissions = {
  focused: ["1. Pick one goal", "2. 25-min timer", "3. Ship result"],
  chill: ["1. Slow breathing", "2. Walk break", "3. Gentle restart"],
  energetic: ["1. Quick warm-up", "2. Sprint task", "3. Celebrate win"],
  calm: ["1. Quiet minute", "2. Clear top priority", "3. Move steadily"]
};

const moodSoundPatterns = {
  focused: [392, 440, 523.25],
  chill: [261.63, 329.63, 392],
  energetic: [523.25, 659.25, 783.99],
  calm: [329.63, 293.66, 261.63]
};

const repoGrid = document.getElementById("repoGrid");
const statusEl = document.getElementById("status");
const githubProfileLink = document.getElementById("githubProfile");
const repoSearch = document.getElementById("repoSearch");
const languageFilter = document.getElementById("languageFilter");

const moodButtons = [...document.querySelectorAll(".mood-btn")];
const moodStatus = document.getElementById("moodStatus");
const moodEmoji = document.getElementById("moodEmoji");
const moodQuote = document.getElementById("moodQuote");
const moodChallenge = document.getElementById("moodChallenge");
const moodPlaylist = document.getElementById("moodPlaylist");
const streakValue = document.getElementById("streakValue");
const checkinValue = document.getElementById("checkinValue");
const favoriteMood = document.getElementById("favoriteMood");
const yesterdayMood = document.getElementById("yesterdayMood");
const yesterdayMoodNote = document.getElementById("yesterdayMoodNote");
const replayYesterdayBtn = document.getElementById("replayYesterdayBtn");

const randomMoodBtn = document.getElementById("randomMoodBtn");
const celebrateBtn = document.getElementById("celebrateBtn");
const breatheBtn = document.getElementById("breatheBtn");
const breatheStatus = document.getElementById("breatheStatus");
const soundToggleBtn = document.getElementById("soundToggleBtn");
const themeToggleBtn = document.getElementById("themeToggleBtn");

const journalNote = document.getElementById("journalNote");
const journalStatus = document.getElementById("journalStatus");

const vibeTitle = document.getElementById("vibeTitle");
const vibeLead = document.getElementById("vibeLead");
const vibeMoodBadge = document.getElementById("vibeMoodBadge");
const vibePrompt = document.getElementById("vibePrompt");
const vibeMicroChallenge = document.getElementById("vibeMicroChallenge");
const vibeChallengeBtn = document.getElementById("vibeChallengeBtn");
const vibeBurstBtn = document.getElementById("vibeBurstBtn");
const vibeShuffleMoodBtn = document.getElementById("vibeShuffleMoodBtn");
const vibeActionStatus = document.getElementById("vibeActionStatus");
const vibeEnergy = document.getElementById("vibeEnergy");
const vibeEnergyStatus = document.getElementById("vibeEnergyStatus");
const vibeMissionList = document.getElementById("vibeMissionList");
const vibeOracleBtn = document.getElementById("vibeOracleBtn");
const vibeOracleText = document.getElementById("vibeOracleText");
const vibeOracleProgress = document.getElementById("vibeOracleProgress");
const vibeOracleMission = document.getElementById("vibeOracleMission");
const vibeOracleMissionBtn = document.getElementById("vibeOracleMissionBtn");
const vibeTapStartBtn = document.getElementById("vibeTapStartBtn");
const vibeTapBtn = document.getElementById("vibeTapBtn");
const vibeTapStatus = document.getElementById("vibeTapStatus");
const vibeTapScore = document.getElementById("vibeTapScore");
const vibeTapHighScore = document.getElementById("vibeTapHighScore");

const particleLayer = document.getElementById("particleLayer");
const yearEl = document.getElementById("year");
const revealEls = [...document.querySelectorAll(".reveal")];

let allRepos = [];
let breatheTimer = null;
let audioContext = null;
let soundEnabled = parseJsonFromStorage(moodSoundKey, true) !== false;
let currentTheme = localStorage.getItem(themeStorageKey) === "dark" ? "dark" : "light";
let tapTimer = null;
let tapCount = 0;
let tapSecondsLeft = 10;
let tapBest = Number(parseJsonFromStorage(vibeTapHighScoreKey, 0)) || 0;
let oracleDrawPile = [];
let oracleCollected = new Set();
let oracleDrawsLeft = 1;
let oracleMissionActive = "";

const oracleFirstWords = [
  "Neon", "Solar", "Lunar", "Velvet", "Golden", "Silver", "Rapid", "Quiet", "Wild", "Pure",
  "Hidden", "Open", "Nova", "Pixel", "Echo", "Glide", "Steady", "Brave", "Fresh", "Prime"
];

const oracleSecondWords = ["Spark", "Wave", "Bloom", "Shift", "Pulse", "Orbit", "Quest", "Flow"];

const oracleSideMissions = {
  focused: ["Clear one tiny task right now.", "Do a 2-minute focus sprint.", "Close three distracting tabs."],
  chill: ["Take five slow breaths.", "Sip water and stretch once.", "Look away from screen for 30 seconds."],
  energetic: ["Do 15 quick taps on your desk.", "Stand up and move for 20 seconds.", "Start a 60-second mini sprint."],
  calm: ["Relax your shoulders and jaw.", "Breathe in 4, out 6, three times.", "Write one grateful word."]
};

if (githubProfileLink) {
  githubProfileLink.href = `https://github.com/${githubUsername}`;
}

function todayString() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function parseJsonFromStorage(key, fallback) {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function getActiveMood() {
  const saved = parseJsonFromStorage(moodStorageKey, null);
  if (saved && validMoods.includes(saved.mood)) return saved.mood;

  const history = parseJsonFromStorage(moodHistoryKey, {});
  const dates = Object.keys(history).sort().reverse();
  for (const date of dates) {
    const mood = history[date];
    if (validMoods.includes(mood)) return mood;
  }

  return "chill";
}

function ensureAudioContext() {
  if (!audioContext) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    audioContext = new Ctx();
  }

  if (audioContext.state === "suspended") {
    audioContext.resume();
  }

  return audioContext;
}

function primeAudioContext() {
  const ctx = ensureAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = 440;

  const t0 = ctx.currentTime + 0.01;
  const t1 = t0 + 0.03;
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(0.0012, t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t1);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t1 + 0.01);
}

function playMoodSound(mood) {
  if (!soundEnabled) return;
  const notes = moodSoundPatterns[mood];
  if (!notes || !notes.length) return;

  const ctx = ensureAudioContext();
  if (!ctx) return;

  const start = ctx.currentTime + 0.01;
  notes.forEach((frequency, index) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = mood === "energetic" ? "sawtooth" : mood === "focused" ? "triangle" : "sine";
    osc.frequency.value = frequency;

    const t0 = start + index * 0.12;
    const t1 = t0 + 0.14;

    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(0.09, t0 + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, t1);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t1 + 0.02);
  });
}

function playCelebrateSound(force = false) {
  if (!force && !soundEnabled) return;
  const ctx = ensureAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime + 0.01;
  const chord = [392, 523.25, 659.25, 783.99];

  chord.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = i % 2 === 0 ? "triangle" : "sine";
    osc.frequency.value = freq;

    const t0 = now + i * 0.05;
    const t1 = t0 + 0.38;

    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(0.15, t0 + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, t1);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t1 + 0.04);
  });

  const bass = ctx.createOscillator();
  const bassGain = ctx.createGain();
  bass.type = "sine";
  bass.frequency.value = 130.81;
  bassGain.gain.setValueAtTime(0.0001, now);
  bassGain.gain.exponentialRampToValueAtTime(0.12, now + 0.04);
  bassGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
  bass.connect(bassGain);
  bassGain.connect(ctx.destination);
  bass.start(now);
  bass.stop(now + 0.36);
}

function updateSoundButtonLabel() {
  if (!soundToggleBtn) return;
  soundToggleBtn.textContent = soundEnabled ? "Sound: On" : "Sound: Off";
}

function updateThemeButtonLabel() {
  if (!themeToggleBtn) return;
  themeToggleBtn.textContent = currentTheme === "dark" ? "Dark Mode: On" : "Dark Mode: Off";
}

function applyTheme(theme) {
  currentTheme = theme === "dark" ? "dark" : "light";
  document.body.dataset.theme = currentTheme;
  localStorage.setItem(themeStorageKey, currentTheme);
  updateThemeButtonLabel();
}

function setActiveMoodButton(selectedMood) {
  moodButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.mood === selectedMood);
  });
}

function setMoodContent(mood) {
  if (!moodEmoji || !moodQuote || !moodChallenge || !moodPlaylist) return;

  const content = moodContent[mood];
  if (!content) {
    moodEmoji.textContent = "🙂";
    moodQuote.textContent = "Pick a mood to unlock your message.";
    moodChallenge.textContent = "";
    moodPlaylist.href = "https://open.spotify.com";
    moodPlaylist.setAttribute("aria-label", "Open Spotify playlist");
    return;
  }

  moodEmoji.textContent = content.emoji;
  moodQuote.textContent = content.quote;
  moodChallenge.textContent = content.challenge;
  moodPlaylist.href = content.playlist;
  moodPlaylist.setAttribute("aria-label", `Open ${mood.charAt(0).toUpperCase() + mood.slice(1)} Spotify playlist`);
}

function applyMood(mood, options = {}) {
  const { playSound = false } = options;
  if (!validMoods.includes(mood)) return;

  document.body.dataset.mood = mood;
  setActiveMoodButton(mood);
  setMoodContent(mood);
  if (playSound) {
    primeAudioContext();
    playMoodSound(mood);
  }

  if (moodStatus) {
    moodStatus.textContent = `${mood.charAt(0).toUpperCase() + mood.slice(1)} vibe active.`;
  }
}

function saveTodayMood(mood) {
  const today = todayString();
  const history = parseJsonFromStorage(moodHistoryKey, {});
  history[today] = mood;
  localStorage.setItem(moodHistoryKey, JSON.stringify(history));
  localStorage.setItem(moodStorageKey, JSON.stringify({ date: today, mood }));
  updateMoodStats();
  renderYesterdayMood();
}

function computeStreak(historyObj) {
  let streak = 0;
  const date = new Date();

  while (true) {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const key = `${yyyy}-${mm}-${dd}`;

    if (historyObj[key]) {
      streak += 1;
      date.setDate(date.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

function updateMoodStats() {
  if (!checkinValue || !streakValue || !favoriteMood) return;

  const history = parseJsonFromStorage(moodHistoryKey, {});
  const dates = Object.keys(history).sort();
  checkinValue.textContent = String(dates.length);

  const streak = computeStreak(history);
  streakValue.textContent = `${streak} ${streak === 1 ? "day" : "days"}`;

  const countByMood = validMoods.reduce((acc, mood) => {
    acc[mood] = 0;
    return acc;
  }, {});

  dates.forEach((date) => {
    const mood = history[date];
    if (countByMood[mood] !== undefined) countByMood[mood] += 1;
  });

  const topMood = [...validMoods].sort((a, b) => countByMood[b] - countByMood[a])[0];
  favoriteMood.textContent = countByMood[topMood] ? `${moodContent[topMood].emoji} ${topMood}` : "-";
}

function renderYesterdayMood() {
  if (!yesterdayMood || !yesterdayMoodNote) return;

  const history = parseJsonFromStorage(moodHistoryKey, {});
  const date = new Date();
  date.setDate(date.getDate() - 1);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const yesterdayKey = `${yyyy}-${mm}-${dd}`;
  const mood = history[yesterdayKey];

  if (!mood || !moodContent[mood]) {
    yesterdayMood.textContent = "No check-in yet.";
    yesterdayMoodNote.textContent = "Pick a mood today to unlock the throwback.";
    if (replayYesterdayBtn) replayYesterdayBtn.disabled = true;
    return;
  }

  const moodTitle = `${moodContent[mood].emoji} ${mood.charAt(0).toUpperCase() + mood.slice(1)}`;
  const throwbacks = [
    "Yesterday had great energy.",
    "That vibe looked good on you.",
    "Throwback unlocked.",
    "Replay it if it still fits."
  ];

  yesterdayMood.textContent = moodTitle;
  yesterdayMoodNote.textContent = throwbacks[Math.floor(Math.random() * throwbacks.length)];
  if (replayYesterdayBtn) replayYesterdayBtn.disabled = false;
}

function restoreMoodForToday() {
  const saved = parseJsonFromStorage(moodStorageKey, null);
  if (saved && saved.date === todayString() && validMoods.includes(saved.mood)) {
    applyMood(saved.mood);
  } else {
    setMoodContent("");
  }
}

function createParticles() {
  if (!particleLayer) return;

  particleLayer.innerHTML = "";
  for (let i = 0; i < 34; i += 1) {
    const particle = document.createElement("span");
    particle.className = "particle";

    const size = `${(Math.random() * 7 + 3).toFixed(1)}px`;
    const x = `${(Math.random() * 100).toFixed(2)}vw`;
    const duration = `${(Math.random() * 10 + 9).toFixed(1)}s`;
    const delay = `${(Math.random() * -18).toFixed(1)}s`;

    particle.style.setProperty("--size", size);
    particle.style.setProperty("--x", x);
    particle.style.setProperty("--duration", duration);
    particle.style.animationDelay = delay;

    particleLayer.appendChild(particle);
  }
}

function spawnFloatingDots(count = 28, spread = 1) {
  for (let i = 0; i < count; i += 1) {
    const dot = document.createElement("span");
    dot.className = "burst-dot";
    dot.style.left = `${(Math.random() * 100).toFixed(2)}vw`;
    dot.style.bottom = `${(-8 - Math.random() * 30).toFixed(1)}px`;
    dot.style.width = `${(4 + Math.random() * 8 * spread).toFixed(1)}px`;
    dot.style.height = dot.style.width;
    dot.style.animationDuration = `${(2.8 + Math.random() * 2.4).toFixed(2)}s`;
    dot.style.animationDelay = `${(Math.random() * 0.22).toFixed(2)}s`;

    document.body.appendChild(dot);
    setTimeout(() => dot.remove(), 6000);
  }
}

function triggerCelebration() {
  const moodSection = document.getElementById("mood") || document.getElementById("vibeZone");
  if (!moodSection) return;

  document.body.classList.add("celebration");
  setTimeout(() => document.body.classList.remove("celebration"), 880);

  const moodRect = moodSection.getBoundingClientRect();
  const centerX = moodRect.left + window.scrollX + moodRect.width / 2;
  const centerY = moodRect.top + window.scrollY + 90;

  for (let i = 0; i < 72; i += 1) {
    const spark = document.createElement("span");
    spark.className = "spark";
    spark.style.left = `${centerX}px`;
    spark.style.top = `${centerY}px`;

    const angle = (Math.PI * 2 * i) / 72;
    const distance = 70 + Math.random() * 220;
    spark.style.width = `${8 + Math.random() * 12}px`;
    spark.style.height = spark.style.width;
    spark.style.setProperty("--dx", `${Math.cos(angle) * distance}px`);
    spark.style.setProperty("--dy", `${Math.sin(angle) * distance}px`);

    document.body.appendChild(spark);
    setTimeout(() => spark.remove(), 980);
  }

  for (let i = 0; i < 28; i += 1) {
    const sparkle = document.createElement("span");
    sparkle.className = "spark";
    sparkle.style.left = `${(Math.random() * window.innerWidth).toFixed(1)}px`;
    sparkle.style.top = `${(Math.random() * window.innerHeight).toFixed(1)}px`;
    sparkle.style.width = `${8 + Math.random() * 6}px`;
    sparkle.style.height = sparkle.style.width;
    sparkle.style.setProperty("--dx", `${(Math.random() - 0.5) * 180}px`);
    sparkle.style.setProperty("--dy", `${(Math.random() - 0.5) * 180}px`);

    document.body.appendChild(sparkle);
    setTimeout(() => sparkle.remove(), 980);
  }

  spawnFloatingDots(140, 1.8);
}

function startBreathingTimer() {
  if (!breatheStatus) return;

  if (breatheTimer) {
    clearInterval(breatheTimer);
    breatheTimer = null;
  }

  let secondsLeft = 30;
  breatheStatus.textContent = `Breathe in... ${secondsLeft}s`;

  breatheTimer = setInterval(() => {
    secondsLeft -= 1;
    if (secondsLeft <= 0) {
      clearInterval(breatheTimer);
      breatheTimer = null;
      breatheStatus.textContent = "Reset complete.";
      return;
    }

    const phase = secondsLeft % 8 < 4 ? "Breathe in" : "Breathe out";
    breatheStatus.textContent = `${phase}... ${secondsLeft}s`;
  }, 1000);
}

function setupJournal() {
  if (!journalNote || !journalStatus) return;

  const notes = parseJsonFromStorage(moodNoteKey, {});
  const today = todayString();
  journalNote.value = notes[today] || "";

  journalNote.addEventListener("input", () => {
    const updated = parseJsonFromStorage(moodNoteKey, {});
    updated[today] = journalNote.value.trim();
    localStorage.setItem(moodNoteKey, JSON.stringify(updated));
    journalStatus.textContent = "Saved.";
  });
}

function setupRevealAnimations() {
  if (!revealEls.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.16 }
  );

  revealEls.forEach((element, index) => {
    element.style.transitionDelay = `${Math.min(index * 55, 240)}ms`;
    observer.observe(element);
  });
}

function formatDate(isoDate) {
  const date = new Date(isoDate);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric"
  }).format(date);
}

function createRepoCard(repo) {
  const card = document.createElement("article");
  card.className = "repo-card";

  const language = repo.language ? `Language: ${repo.language}` : "Language: n/a";

  card.innerHTML = `
    <h3>${repo.name}</h3>
    <p>${repo.description || "No description provided."}</p>
    <div class="repo-meta">${language} | Updated: ${formatDate(repo.updated_at)}</div>
    <a class="repo-link" href="${repo.html_url}" target="_blank" rel="noreferrer">Open Repo</a>
  `;

  return card;
}

function renderRepos(repos) {
  if (!repoGrid || !statusEl) return;

  repoGrid.innerHTML = "";
  repos.forEach((repo) => repoGrid.appendChild(createRepoCard(repo)));
  statusEl.textContent = repos.length
    ? `Showing ${repos.length} repositories.`
    : "No repositories match the current filters.";
}

function populateLanguageFilter(repos) {
  if (!languageFilter) return;

  const languages = [...new Set(repos.map((repo) => repo.language).filter(Boolean))].sort();
  languages.forEach((language) => {
    const option = document.createElement("option");
    option.value = language.toLowerCase();
    option.textContent = language;
    languageFilter.appendChild(option);
  });
}

function applyFilters() {
  if (!repoSearch || !languageFilter) return;

  const searchText = repoSearch.value.trim().toLowerCase();
  const selectedLanguage = languageFilter.value;

  const filtered = allRepos.filter((repo) => {
    const matchesLanguage =
      selectedLanguage === "all" || (repo.language || "").toLowerCase() === selectedLanguage;
    const text = `${repo.name} ${repo.description || ""}`.toLowerCase();
    const matchesSearch = text.includes(searchText);

    return matchesLanguage && matchesSearch;
  });

  renderRepos(filtered);
}

async function loadRepos() {
  if (!repoGrid || !statusEl) return;

  try {
    const response = await fetch(apiUrl, { headers: { Accept: "application/vnd.github+json" } });
    if (!response.ok) throw new Error(`GitHub API returned ${response.status}`);

    const repos = await response.json();
    allRepos = repos.filter((repo) => !repo.fork);
    if (!allRepos.length) {
      statusEl.textContent = "No public repositories found.";
      return;
    }

    populateLanguageFilter(allRepos);
    renderRepos(allRepos);
  } catch (error) {
    statusEl.textContent = "Unable to load repositories right now.";
    console.error(error);
  }
}

function shuffleArray(items) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function buildOracleCards() {
  const cards = [];
  const prompts = [
    "Take one bold action in the next minute.",
    "Send one message you have been postponing.",
    "Clear one tiny task right now.",
    "Do a 20-second movement burst.",
    "Write one clear next step.",
    "Remove one distraction from your view.",
    "Start a 2-minute focus timer.",
    "Celebrate one small win."
  ];

  let id = 1;
  for (let i = 0; i < oracleSecondWords.length; i += 1) {
    for (let j = 0; j < oracleFirstWords.length; j += 1) {
      cards.push({
        id,
        title: `${oracleFirstWords[j]} ${oracleSecondWords[i]}`,
        prompt: prompts[i]
      });
      id += 1;
    }
  }

  return cards;
}

const oracleCards = buildOracleCards();
const oracleCardById = new Map(oracleCards.map((card) => [card.id, card]));

function pickOracleMission(activeMood) {
  const pool = oracleSideMissions[activeMood] || oracleSideMissions.chill;
  return pool[Math.floor(Math.random() * pool.length)];
}

function saveOracleState() {
  const state = {
    collected: [...oracleCollected],
    drawsLeft: oracleDrawsLeft,
    pile: oracleDrawPile,
    mission: oracleMissionActive
  };
  localStorage.setItem(oracleCollectionKey, JSON.stringify(state));
}

function loadOracleState(activeMood) {
  const state = parseJsonFromStorage(oracleCollectionKey, null);
  const validIds = new Set(oracleCards.map((card) => card.id));

  if (state) {
    oracleCollected = new Set((state.collected || []).filter((id) => validIds.has(id)));
    oracleDrawsLeft = Number.isFinite(state.drawsLeft) ? Math.max(0, Math.floor(state.drawsLeft)) : 1;
    oracleDrawPile = (state.pile || []).filter((id) => validIds.has(id));
    oracleMissionActive = typeof state.mission === "string" ? state.mission : "";
  }

  if (!oracleDrawPile.length) {
    oracleDrawPile = shuffleArray(oracleCards.map((card) => card.id));
  }

  if (oracleDrawsLeft < 1 && !oracleMissionActive) {
    oracleMissionActive = pickOracleMission(activeMood);
  }

  saveOracleState();
}

function refreshOracleUI() {
  if (vibeOracleProgress) {
    vibeOracleProgress.textContent = `Collection: ${oracleCollected.size}/${oracleCards.length} | Draws left: ${oracleDrawsLeft}`;
  }

  if (vibeOracleMission) {
    vibeOracleMission.textContent = oracleMissionActive
      ? `Side mission: ${oracleMissionActive}`
      : "No mission active.";
  }

  if (vibeOracleMissionBtn) {
    vibeOracleMissionBtn.disabled = !oracleMissionActive;
  }
}

function drawOracleCard(activeMood) {
  if (oracleDrawsLeft < 1) {
    if (!oracleMissionActive) {
      oracleMissionActive = pickOracleMission(activeMood);
      saveOracleState();
    }
    refreshOracleUI();
    return null;
  }

  if (!oracleDrawPile.length) {
    oracleDrawPile = shuffleArray(oracleCards.map((card) => card.id));
  }

  const cardId = oracleDrawPile.pop();
  const card = oracleCardById.get(cardId);
  const isNew = !oracleCollected.has(cardId);
  if (isNew) oracleCollected.add(cardId);

  oracleDrawsLeft -= 1;
  if (oracleDrawsLeft < 1) {
    oracleMissionActive = pickOracleMission(activeMood);
  }

  saveOracleState();
  refreshOracleUI();
  return { card, isNew };
}

function completeOracleMission() {
  if (!oracleMissionActive) return false;

  oracleMissionActive = "";
  oracleDrawsLeft += 1;
  saveOracleState();
  refreshOracleUI();
  return true;
}

function startTapSprint(activeMood) {
  if (!vibeTapBtn || !vibeTapStatus || !vibeTapScore || !vibeTapStartBtn || !vibeTapHighScore) return;

  if (tapTimer) {
    clearInterval(tapTimer);
    tapTimer = null;
  }

  tapCount = 0;
  tapSecondsLeft = 10;
  vibeTapBtn.disabled = false;
  vibeTapStartBtn.disabled = true;
  vibeTapScore.textContent = "0 taps";
  vibeTapHighScore.textContent = `High score: ${tapBest} taps`;
  vibeTapStatus.textContent = `Go! ${tapSecondsLeft}s left.`;

  tapTimer = setInterval(() => {
    tapSecondsLeft -= 1;
    if (tapSecondsLeft <= 0) {
      clearInterval(tapTimer);
      tapTimer = null;
      vibeTapBtn.disabled = true;
      vibeTapStartBtn.disabled = false;

      let unlockedBonusDraw = false;
      if (tapCount > tapBest) {
        tapBest = tapCount;
        localStorage.setItem(vibeTapHighScoreKey, JSON.stringify(tapBest));
        vibeTapHighScore.textContent = `High score: ${tapBest} taps`;
        vibeTapStatus.textContent = `New high score: ${tapBest}!`;
        triggerCelebration();

        oracleDrawsLeft += 1;
        unlockedBonusDraw = true;
        saveOracleState();
        refreshOracleUI();
      } else {
        vibeTapStatus.textContent = `Run complete: ${tapCount} taps.`;
      }

      if (vibeActionStatus) {
        vibeActionStatus.textContent = unlockedBonusDraw
          ? `Tap sprint done for ${activeMood}. Bonus draw unlocked.`
          : `Tap sprint done for ${activeMood}.`;
      }
      return;
    }

    vibeTapStatus.textContent = `Go! ${tapSecondsLeft}s left.`;
  }, 1000);
}

function initVibePage() {
  if (!vibeTitle || !vibeLead || !vibeMoodBadge || !vibePrompt || !vibeMicroChallenge || !vibeMissionList) return;

  let activeMood = getActiveMood();
  loadOracleState(activeMood);

  const renderVibeMood = () => {
    applyMood(activeMood);
    vibeTitle.textContent = `${moodContent[activeMood].emoji} ${activeMood.charAt(0).toUpperCase() + activeMood.slice(1)} Mode`;
    vibeLead.textContent = moodContent[activeMood].quote;
    vibeMoodBadge.textContent = `Mood: ${moodContent[activeMood].emoji} ${activeMood}`;
    vibePrompt.textContent = moodContent[activeMood].quote;
    vibeMicroChallenge.textContent = moodContent[activeMood].challenge;

    vibeMissionList.innerHTML = "";
    vibeMissions[activeMood].forEach((mission) => {
      const li = document.createElement("li");
      li.textContent = mission;
      vibeMissionList.appendChild(li);
    });

    if (vibeOracleText) {
      vibeOracleText.classList.remove("oracle-hit", "oracle-miss");
      vibeOracleText.textContent = "Build your 160-card collection.";
    }

    if (vibeTapHighScore) vibeTapHighScore.textContent = `High score: ${tapBest} taps`;
    if (oracleDrawsLeft < 1 && !oracleMissionActive) {
      oracleMissionActive = pickOracleMission(activeMood);
      saveOracleState();
    }
    refreshOracleUI();
  };

  renderVibeMood();

  if (vibeChallengeBtn) {
    vibeChallengeBtn.addEventListener("click", () => {
      const picks = vibeChallenges[activeMood];
      vibeMicroChallenge.textContent = picks[Math.floor(Math.random() * picks.length)];
      if (vibeActionStatus) vibeActionStatus.textContent = "New challenge loaded.";
    });
  }

  if (vibeBurstBtn) {
    vibeBurstBtn.addEventListener("click", () => {
      triggerCelebration();
      spawnFloatingDots(110, 1.5);
      if (vibeActionStatus) vibeActionStatus.textContent = "Burst activated.";
    });
  }

  if (vibeShuffleMoodBtn) {
    vibeShuffleMoodBtn.addEventListener("click", () => {
      activeMood = validMoods[Math.floor(Math.random() * validMoods.length)];
      applyMood(activeMood, { playSound: true });
      saveTodayMood(activeMood);
      renderVibeMood();
      if (vibeActionStatus) vibeActionStatus.textContent = `Mood shuffled to ${activeMood}.`;
    });
  }

  if (vibeOracleBtn && vibeOracleText) {
    vibeOracleBtn.addEventListener("click", () => {
      const result = drawOracleCard(activeMood);
      if (!result) {
        vibeOracleText.classList.remove("oracle-hit");
        vibeOracleText.classList.add("oracle-miss");
        vibeOracleText.textContent = "No draws left. Complete the side mission to unlock your next card.";
        if (vibeActionStatus) vibeActionStatus.textContent = "Mission required for next draw.";
        return;
      }

      const { card, isNew } = result;
      vibeOracleText.classList.toggle("oracle-hit", isNew);
      vibeOracleText.classList.toggle("oracle-miss", !isNew);
      vibeOracleText.textContent = `Card #${card.id}: ${card.title}. ${card.prompt}`;
      if (vibeActionStatus) {
        vibeActionStatus.textContent = isNew ? "New card collected." : "Duplicate card pulled.";
      }
    });
  }

  if (vibeOracleMissionBtn) {
    vibeOracleMissionBtn.addEventListener("click", () => {
      const unlocked = completeOracleMission();
      if (!unlocked) {
        if (vibeActionStatus) vibeActionStatus.textContent = "No mission active.";
        return;
      }
      if (vibeActionStatus) vibeActionStatus.textContent = "Mission complete. +1 draw unlocked.";
    });
  }

  if (vibeEnergy && vibeEnergyStatus) {
    vibeEnergy.addEventListener("input", () => {
      const value = Number(vibeEnergy.value);
      vibeEnergyStatus.textContent = `Energy: ${value}`;
      if (value >= 8) spawnFloatingDots(value * 3, 1 + value / 10);
    });
  }

  if (vibeTapBtn && vibeTapScore) {
    vibeTapBtn.addEventListener("click", () => {
      tapCount += 1;
      vibeTapScore.textContent = `${tapCount} taps`;
    });
  }

  if (vibeTapStartBtn) {
    vibeTapStartBtn.addEventListener("click", () => {
      startTapSprint(activeMood);
    });
  }
}

moodButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const mood = button.dataset.mood;
    applyMood(mood, { playSound: true });
    saveTodayMood(mood);
  });
});

if (randomMoodBtn) {
  randomMoodBtn.addEventListener("click", () => {
    const mood = validMoods[Math.floor(Math.random() * validMoods.length)];
    applyMood(mood, { playSound: true });
    saveTodayMood(mood);
    triggerCelebration();
  });
}

if (replayYesterdayBtn) {
  replayYesterdayBtn.addEventListener("click", () => {
    const history = parseJsonFromStorage(moodHistoryKey, {});
    const date = new Date();
    date.setDate(date.getDate() - 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    const mood = history[key];
    if (!mood || !moodContent[mood]) return;

    applyMood(mood, { playSound: true });
    triggerCelebration();
    if (moodStatus) moodStatus.textContent = `Replaying yesterday: ${mood}.`;
  });
}

if (celebrateBtn) {
  celebrateBtn.addEventListener("click", () => {
    primeAudioContext();
    playCelebrateSound(true);
    triggerCelebration();
    spawnFloatingDots(96, 1.5);
  });
}

if (breatheBtn) {
  breatheBtn.addEventListener("click", startBreathingTimer);
}

if (themeToggleBtn) {
  updateThemeButtonLabel();
  themeToggleBtn.addEventListener("click", () => {
    const nextTheme = currentTheme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
  });
}

if (repoSearch) {
  repoSearch.addEventListener("input", applyFilters);
}

if (languageFilter) {
  languageFilter.addEventListener("change", applyFilters);
}

if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

applyTheme(currentTheme);
restoreMoodForToday();
updateMoodStats();
renderYesterdayMood();
setupJournal();
createParticles();
setupRevealAnimations();
initVibePage();
loadRepos();



