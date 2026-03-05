const githubUsername = "NathanielOsborne";
const apiUrl = `https://api.github.com/users/${githubUsername}/repos?sort=updated&per_page=100`;

const repoGrid = document.getElementById("repoGrid");
const statusEl = document.getElementById("status");
const githubProfileLink = document.getElementById("githubProfile");
const repoSearch = document.getElementById("repoSearch");
const languageFilter = document.getElementById("languageFilter");

let allRepos = [];

githubProfileLink.href = `https://github.com/${githubUsername}`;

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

repoSearch.addEventListener("input", applyFilters);
languageFilter.addEventListener("change", applyFilters);

loadRepos();
