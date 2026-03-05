const githubUsername = "NathanielOsborne";
const apiUrl = `https://api.github.com/users/${githubUsername}/repos?sort=updated&per_page=100`;

const moodStorageKey = "dailyMoodVibe";
const moodHistoryKey = "dailyMoodHistory";
const moodNoteKey = "dailyMoodJournal";

const validMoods = ["focused", "chill", "energetic", "calm"];
const moodContent = {
  focused: {
    emoji: "🧠",
    quote: "Small focused sessions compound into massive progress.",
    challenge: "Challenge: complete one 25-minute deep-work sprint.",
    playlist: "https://open.spotify.com/search/deep%20focus"
  },
  chill: {
    emoji: "😎",
    quote: "Relaxed energy helps creativity flow naturally.",
    challenge: "Challenge: take a 10-minute walk without your phone.",
    playlist: "https://open.spotify.com/search/chill%20vibes"
  },
  energetic: {
    emoji: "⚡",
    quote: "Use your momentum while your energy is high.",
    challenge: "Challenge: ship one thing in the next hour.",
    playlist: "https://open.spotify.com/search/high%20energy"
  },
  calm: {
    emoji: "🌿",
    quote: "Calm minds make clear decisions.",
    challenge: "Challenge: take five slow breaths before your next task.",
    playlist: "https://open.spotify.com/search/calm%20focus"
  }
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

const journalNote = document.getElementById("journalNote");
const journalStatus = document.getElementById("journalStatus");

const particleLayer = document.getElementById("particleLayer");
const yearEl = document.getElementById("year");
const revealEls = [...document.querySelectorAll(".reveal")];

let allRepos = [];
let breatheTimer = null;

githubProfileLink.href = `https://github.com/${githubUsername}`;

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

function setActiveMoodButton(selectedMood) {
  moodButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.mood === selectedMood);
  });
}

function setMoodContent(mood) {
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
  moodStatus.textContent = `${mood.charAt(0).toUpperCase() + mood.slice(1)} vibe is active for today.`;
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
  const history = parseJsonFromStorage(moodHistoryKey, {});
  const dates = Object.keys(history).sort().reverse().slice(0, 7);
  moodHistory.innerHTML = "";

  if (!dates.length) {
    const item = document.createElement("li");
    item.textContent = "No history yet. Pick your first mood today.";
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
    applyMood(saved.mood);
  } else {
    setMoodContent("");
  }
}

function createParticles() {
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

function triggerCelebration() {
  const moodRect = document.getElementById("mood").getBoundingClientRect();
  const centerX = moodRect.left + moodRect.width / 2;
  const centerY = moodRect.top + 90;

  for (let i = 0; i < 28; i += 1) {
    const spark = document.createElement("span");
    spark.className = "spark";
    spark.style.left = `${centerX}px`;
    spark.style.top = `${centerY}px`;

    const angle = (Math.PI * 2 * i) / 28;
    const distance = 30 + Math.random() * 90;
    spark.style.setProperty("--dx", `${Math.cos(angle) * distance}px`);
    spark.style.setProperty("--dy", `${Math.sin(angle) * distance}px`);

    document.body.appendChild(spark);
    setTimeout(() => spark.remove(), 800);
  }
}

function startBreathingTimer() {
  if (breatheTimer) return;
  let secondsLeft = 30;
  breatheStatus.textContent = `Breathe in... ${secondsLeft}s`;

  breatheTimer = setInterval(() => {
    secondsLeft -= 1;
    if (secondsLeft <= 0) {
      clearInterval(breatheTimer);
      breatheTimer = null;
      breatheStatus.textContent = "Nice reset. You are back in flow.";
      return;
    }

    const phase = secondsLeft % 8 < 4 ? "Breathe in" : "Breathe out";
    breatheStatus.textContent = `${phase}... ${secondsLeft}s`;
  }, 1000);
}

function setupJournal() {
  const notes = parseJsonFromStorage(moodNoteKey, {});
  const today = todayString();
  journalNote.value = notes[today] || "";

  journalNote.addEventListener("input", () => {
    const updated = parseJsonFromStorage(moodNoteKey, {});
    updated[today] = journalNote.value.trim();
    localStorage.setItem(moodNoteKey, JSON.stringify(updated));
    journalStatus.textContent = "Saved for today.";
  });
}

function setupRevealAnimations() {
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
  repoGrid.innerHTML = "";
  repos.forEach((repo) => repoGrid.appendChild(createRepoCard(repo)));
  statusEl.textContent = repos.length
    ? `Showing ${repos.length} repositories.`
    : "No repositories match the current filters.";
}

function populateLanguageFilter(repos) {
  const languages = [...new Set(repos.map((repo) => repo.language).filter(Boolean))].sort();
  languages.forEach((language) => {
    const option = document.createElement("option");
    option.value = language.toLowerCase();
    option.textContent = language;
    languageFilter.appendChild(option);
  });
}

function applyFilters() {
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
  try {
    const response = await fetch(apiUrl, {
      headers: {
        Accept: "application/vnd.github+json"
      }
    });

    if (!response.ok) {
      throw new Error(`GitHub API returned ${response.status}`);
    }

    const repos = await response.json();
    allRepos = repos.filter((repo) => !repo.fork);

    if (!allRepos.length) {
      statusEl.textContent = "No public repositories found.";
      return;
    }

    populateLanguageFilter(allRepos);
    renderRepos(allRepos);
  } catch (error) {
    statusEl.textContent = "Unable to load repositories right now. Check your GitHub username or network access.";
    console.error(error);
  }
}

moodButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const mood = button.dataset.mood;
    applyMood(mood);
    saveTodayMood(mood);
  });
});

randomMoodBtn.addEventListener("click", () => {
  const mood = validMoods[Math.floor(Math.random() * validMoods.length)];
  applyMood(mood);
  saveTodayMood(mood);
  triggerCelebration();
});

celebrateBtn.addEventListener("click", triggerCelebration);
breatheBtn.addEventListener("click", startBreathingTimer);

repoSearch.addEventListener("input", applyFilters);
languageFilter.addEventListener("change", applyFilters);

if (yearEl) yearEl.textContent = new Date().getFullYear();
restoreMoodForToday();
updateMoodStats();
renderMoodHistory();
setupJournal();
createParticles();
setupRevealAnimations();
loadRepos();

