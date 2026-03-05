const githubUsername = "NathanielOsborne";
const apiUrl = `https://api.github.com/users/${githubUsername}/repos?sort=updated&per_page=100`;

const moodStorageKey = "dailyMoodVibe";
const moodHistoryKey = "dailyMoodHistory";
const moodNoteKey = "dailyMoodJournal";
const moodSoundKey = "dailyMoodSoundEnabled";
const vibeTapHighScoreKey = "vibeTapHighScore";

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
const moodHistory = document.getElementById("moodHistory");

const randomMoodBtn = document.getElementById("randomMoodBtn");
const celebrateBtn = document.getElementById("celebrateBtn");
const breatheBtn = document.getElementById("breatheBtn");
const breatheStatus = document.getElementById("breatheStatus");
const soundToggleBtn = document.getElementById("soundToggleBtn");

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
let tapTimer = null;
let tapCount = 0;
let tapSecondsLeft = 10;
let tapBest = Number(parseJsonFromStorage(vibeTapHighScoreKey, 0)) || 0;
let oracleDeck = [];
let oracleIndex = 0;

const oracleDeckThemes = {
  focused: ["Focus", "Clarity", "Build", "Ship", "Systems"],
  chill: ["Flow", "Ease", "Glow", "Reset", "Balance"],
  energetic: ["Spark", "Action", "Momentum", "Launch", "Charge"],
  calm: ["Stillness", "Ground", "Breath", "Drift", "Center"]
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

function playCelebrateSound() {
  if (!soundEnabled) return;
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
    const t1 = t0 + 0.35;

    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(0.11, t0 + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, t1);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t1 + 0.04);
  });
}

function updateSoundButtonLabel() {
  if (!soundToggleBtn) return;
  soundToggleBtn.textContent = soundEnabled ? "Sound: On" : "Sound: Off";
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
    moodPlaylist.textContent = "Open Playlist";
    return;
  }

  moodEmoji.textContent = content.emoji;
  moodQuote.textContent = content.quote;
  moodChallenge.textContent = content.challenge;
  moodPlaylist.href = content.playlist;
  moodPlaylist.textContent = `Open ${mood.charAt(0).toUpperCase() + mood.slice(1)} Playlist`;
}

function applyMood(mood) {
  if (!validMoods.includes(mood)) return;

  document.body.dataset.mood = mood;
  setActiveMoodButton(mood);
  setMoodContent(mood);

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
  renderMoodHistory();
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

function renderMoodHistory() {
  if (!moodHistory) return;

  const history = parseJsonFromStorage(moodHistoryKey, {});
  const dates = Object.keys(history).sort().reverse().slice(0, 7);
  moodHistory.innerHTML = "";

  if (!dates.length) {
    const item = document.createElement("li");
    item.textContent = "No history yet.";
    moodHistory.appendChild(item);
    return;
  }

  dates.forEach((date) => {
    const mood = history[date];
    const item = document.createElement("li");
    item.textContent = `${date}: ${moodContent[mood]?.emoji || "🙂"} ${mood}`;
    moodHistory.appendChild(item);
  });
}

function restoreMoodForToday() {
  const saved = parseJsonFromStorage(moodStorageKey, null);
  if (saved && saved.date === todayString() && validMoods.includes(saved.mood)) {
    applyMood(saved.mood, { playSound: false });
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

function buildOracleDeck(activeMood, size = 160) {
  const deck = [];
  const moodLabel = activeMood.charAt(0).toUpperCase() + activeMood.slice(1);
  const themes = oracleDeckThemes[activeMood] || oracleDeckThemes.chill;

  for (let i = 1; i <= size; i += 1) {
    const slot = ((i - 1) % 8) + 1;
    const wave = Math.floor((i - 1) / 8) + 1;
    const theme = themes[(i - 1) % themes.length];
    deck.push(`Slide ${i} - ${moodLabel} ${theme} - Wave ${wave} - Move ${slot}`);
  }

  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
}

function drawOracleCard(activeMood) {
  if (!oracleDeck.length || oracleIndex >= oracleDeck.length) {
    oracleDeck = buildOracleDeck(activeMood, 160);
    oracleIndex = 0;
  }

  const card = oracleDeck[oracleIndex];
  oracleIndex += 1;
  return `${card} (${oracleIndex}/${oracleDeck.length})`;
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

      if (tapCount > tapBest) {
        tapBest = tapCount;
        localStorage.setItem(vibeTapHighScoreKey, JSON.stringify(tapBest));
        vibeTapHighScore.textContent = `High score: ${tapBest} taps`;
        vibeTapStatus.textContent = `New high score: ${tapBest}!`;
        playCelebrateSound();
        triggerCelebration();
      } else {
        vibeTapStatus.textContent = `Run complete: ${tapCount} taps.`;
      }

      if (vibeActionStatus) {
        vibeActionStatus.textContent = `Tap sprint done for ${activeMood}.`;
      }
      return;
    }

    vibeTapStatus.textContent = `Go! ${tapSecondsLeft}s left.`;
  }, 1000);
}

function initVibePage() {
  if (!vibeTitle || !vibeLead || !vibeMoodBadge || !vibePrompt || !vibeMicroChallenge || !vibeMissionList) return;

  let activeMood = getActiveMood();

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

    oracleDeck = buildOracleDeck(activeMood, 160);
    oracleIndex = 0;
    if (vibeOracleText) vibeOracleText.textContent = "Draw a card from the 160-slide deck.";
    if (vibeTapHighScore) vibeTapHighScore.textContent = `High score: ${tapBest} taps`;
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
      saveTodayMood(activeMood);
      renderVibeMood();
      if (vibeActionStatus) vibeActionStatus.textContent = `Mood shuffled to ${activeMood}.`;
    });
  }

  if (vibeOracleBtn && vibeOracleText) {
    vibeOracleBtn.addEventListener("click", () => {
      vibeOracleText.textContent = drawOracleCard(activeMood);
      if (vibeActionStatus) vibeActionStatus.textContent = "Card drawn.";
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
    vibeTapStartBtn.addEventListener("click", () => startTapSprint(activeMood));
  }
}

moodButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const mood = button.dataset.mood;
    applyMood(mood);
    saveTodayMood(mood);
  });
});

if (randomMoodBtn) {
  randomMoodBtn.addEventListener("click", () => {
    const mood = validMoods[Math.floor(Math.random() * validMoods.length)];
    applyMood(mood);
    saveTodayMood(mood);
    triggerCelebration();
  });
}

if (celebrateBtn) {
  celebrateBtn.addEventListener("click", () => {
    triggerCelebration();
    spawnFloatingDots(96, 1.5);
  });
}

if (breatheBtn) {
  breatheBtn.addEventListener("click", startBreathingTimer);
}

if (soundToggleBtn) {
  updateSoundButtonLabel();
  soundToggleBtn.addEventListener("click", () => {
    soundEnabled = !soundEnabled;
    localStorage.setItem(moodSoundKey, JSON.stringify(soundEnabled));
    updateSoundButtonLabel();

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

restoreMoodForToday();
updateMoodStats();
renderMoodHistory();
setupJournal();
createParticles();
setupRevealAnimations();
initVibePage();
loadRepos();

