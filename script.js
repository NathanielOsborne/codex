const githubUsername = "NathanielOsborne";
const apiUrl = `https://api.github.com/users/${githubUsername}/repos?sort=updated&per_page=100`;
const moodStorageKey = "dailyMoodVibe";
const validMoods = ["focused", "chill", "energetic", "calm"];

const repoGrid = document.getElementById("repoGrid");
const statusEl = document.getElementById("status");
const githubProfileLink = document.getElementById("githubProfile");
const repoSearch = document.getElementById("repoSearch");
const languageFilter = document.getElementById("languageFilter");
const moodButtons = [...document.querySelectorAll(".mood-btn")];
const moodStatus = document.getElementById("moodStatus");

let allRepos = [];

githubProfileLink.href = `https://github.com/${githubUsername}`;

function todayString() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function titleMood(mood) {
  return mood.charAt(0).toUpperCase() + mood.slice(1);
}

function setActiveMoodButton(selectedMood) {
  moodButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.mood === selectedMood);
  });
}

function applyMood(mood) {
  if (!validMoods.includes(mood)) return;
  document.body.dataset.mood = mood;
  setActiveMoodButton(mood);
  moodStatus.textContent = `${titleMood(mood)} vibe is active for today.`;
}

function persistMoodForToday(mood) {
  localStorage.setItem(
    moodStorageKey,
    JSON.stringify({
      date: todayString(),
      mood
    })
  );
}

function restoreMoodForToday() {
  const raw = localStorage.getItem(moodStorageKey);
  if (!raw) return;

  try {
    const saved = JSON.parse(raw);
    if (saved.date === todayString() && validMoods.includes(saved.mood)) {
      applyMood(saved.mood);
    } else {
      localStorage.removeItem(moodStorageKey);
    }
  } catch {
    localStorage.removeItem(moodStorageKey);
  }
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
    persistMoodForToday(mood);
  });
});

repoSearch.addEventListener("input", applyFilters);
languageFilter.addEventListener("change", applyFilters);

restoreMoodForToday();
loadRepos();
