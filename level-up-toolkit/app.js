const scoreItems = [
  { id: "floor", label: "Floor Goal", points: 1 },
  { id: "l1", label: "L1 Goal", points: 3 },
  { id: "l2", label: "L2 Goal", points: 6 },
  { id: "l3", label: "L3 Goal", points: 12 },
  { id: "l4", label: "L4 Goal", points: 16 }
];

const checklistItems = [
  "Robot fits 11 x 20 x 15 starting size",
  "Horizontal expansion stays within 11 x 24",
  "Battery charged and brain/controller connected",
  "Preload touching exactly one robot",
  "Driver 1 / Driver 2 / Loader assigned",
  "Opening route agreed with partner",
  "Loader knows load zone timing",
  "Stop immediately at match end"
];

const state = {
  score: Object.fromEntries(scoreItems.map((item) => [item.id, 0])),
  checklist: {},
  notes: {},
  timer: {
    remaining: 60,
    running: false,
    interval: null
  }
};

const scoreRows = document.querySelector("#scoreRows");
const scoreTotal = document.querySelector("#scoreTotal");
const bagCount = document.querySelector("#bagCount");
const bagWarning = document.querySelector("#bagWarning");
const checklist = document.querySelector("#checklist");
const clock = document.querySelector("#clock");
const clockPhase = document.querySelector("#clockPhase");
const startPauseTimer = document.querySelector("#startPauseTimer");
const ruleSearch = document.querySelector("#ruleSearch");
const ruleTabs = document.querySelector("#ruleTabs");
const ruleList = document.querySelector("#ruleList");
const rulesMeta = document.querySelector("#rulesMeta");
const changelogMeta = document.querySelector("#changelogMeta");
const changelogList = document.querySelector("#changelogList");
let rulesData = null;
let activeRuleGroup = "All";

function save() {
  localStorage.setItem("level-up-toolkit", JSON.stringify({
    score: state.score,
    checklist: state.checklist,
    notes: readNotes()
  }));
}

function restore() {
  const saved = JSON.parse(localStorage.getItem("level-up-toolkit") || "{}");
  Object.assign(state.score, saved.score || {});
  Object.assign(state.checklist, saved.checklist || {});
  state.notes = saved.notes || {};
}

function renderScore() {
  scoreRows.innerHTML = scoreItems
    .map(
      (item) => `
        <div class="score-row">
          <div>
            <strong>${item.label}</strong>
            <span>${item.points} pts each</span>
          </div>
          <div class="stepper">
            <button type="button" data-score="${item.id}" data-delta="-1">-</button>
            <output>${state.score[item.id]}</output>
            <button type="button" data-score="${item.id}" data-delta="1">+</button>
          </div>
          <strong>${state.score[item.id] * item.points}</strong>
        </div>
      `
    )
    .join("");

  const total = scoreItems.reduce((sum, item) => sum + state.score[item.id] * item.points, 0);
  const bags = scoreItems.reduce((sum, item) => sum + state.score[item.id], 0);
  scoreTotal.textContent = total;
  bagCount.textContent = bags;
  bagWarning.textContent = bags > 38 ? "Check count: field has 38 Bean Bags." : "";
}

function renderChecklist() {
  checklist.innerHTML = checklistItems
    .map(
      (item, index) => `
        <label class="check-item">
          <input type="checkbox" data-check="${index}" ${state.checklist[index] ? "checked" : ""} />
          <span>${item}</span>
        </label>
      `
    )
    .join("");
}

function renderTimer() {
  const minutes = Math.floor(state.timer.remaining / 60);
  const seconds = String(state.timer.remaining % 60).padStart(2, "0");
  clock.textContent = `${minutes}:${seconds}`;

  if (state.timer.remaining === 0) {
    clockPhase.textContent = "Stop moving";
  } else if (state.timer.remaining <= 30) {
    clockPhase.textContent = "Driver 2";
  } else {
    clockPhase.textContent = "Driver 1";
  }

  startPauseTimer.textContent = state.timer.running ? "Pause" : "Start";
}

function tick() {
  if (state.timer.remaining <= 0) {
    stopTimer();
    return;
  }

  state.timer.remaining -= 1;
  renderTimer();
}

function startTimer() {
  if (state.timer.running) return;
  state.timer.running = true;
  state.timer.interval = setInterval(tick, 1000);
  renderTimer();
}

function stopTimer() {
  state.timer.running = false;
  clearInterval(state.timer.interval);
  state.timer.interval = null;
  renderTimer();
}

function readNotes() {
  return {
    teamNumber: document.querySelector("#teamNumber").value,
    matchNumber: document.querySelector("#matchNumber").value,
    partnerTeam: document.querySelector("#partnerTeam").value,
    openingRoute: document.querySelector("#openingRoute").value,
    driverNotes: document.querySelector("#driverNotes").value,
    postMatchNotes: document.querySelector("#postMatchNotes").value
  };
}

function restoreNotes() {
  for (const [key, value] of Object.entries(state.notes)) {
    const node = document.querySelector(`#${key}`);
    if (node) node.value = value;
  }
}

restore();
renderScore();
renderChecklist();
restoreNotes();
renderTimer();

scoreRows.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-score]");
  if (!button) return;
  const id = button.dataset.score;
  const delta = Number(button.dataset.delta);
  state.score[id] = Math.max(0, state.score[id] + delta);
  renderScore();
  save();
});

document.querySelector("#resetScore").addEventListener("click", () => {
  for (const key of Object.keys(state.score)) state.score[key] = 0;
  renderScore();
  save();
});

checklist.addEventListener("change", (event) => {
  const input = event.target.closest("input[data-check]");
  if (!input) return;
  state.checklist[input.dataset.check] = input.checked;
  save();
});

document.querySelector("#clearChecklist").addEventListener("click", () => {
  state.checklist = {};
  renderChecklist();
  save();
});

startPauseTimer.addEventListener("click", () => {
  if (state.timer.running) stopTimer();
  else startTimer();
});

document.querySelector("#resetTimer").addEventListener("click", () => {
  stopTimer();
  state.timer.remaining = 60;
  renderTimer();
});

document.querySelector("#markSwitch").addEventListener("click", () => {
  state.timer.remaining = Math.min(state.timer.remaining, 30);
  renderTimer();
});

document.querySelectorAll("input, textarea").forEach((node) => {
  node.addEventListener("input", save);
});

document.querySelector("#printSheet").addEventListener("click", () => window.print());

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    };
    return entities[char];
  });
}

function ruleMatches(rule, query) {
  if (!query) return true;
  const normalized = query.toLowerCase().replace(/[<>]/g, "");
  const haystack = `${rule.ref} ${rule.group} ${rule.title}`.toLowerCase();
  return normalized
    .split(/\s+/)
    .filter(Boolean)
    .every((part) => haystack.includes(part));
}

function renderRules() {
  if (!rulesData) return;

  const groups = ["All", ...rulesData.groups.map((group) => group.label)];
  ruleTabs.innerHTML = groups
    .map(
      (group) =>
        `<button class="rule-tab ${group === activeRuleGroup ? "active" : ""}" type="button" data-group="${escapeHtml(group)}">${escapeHtml(group)}</button>`
    )
    .join("");

  const query = ruleSearch.value.trim();
  const rules = rulesData.groups
    .filter((group) => activeRuleGroup === "All" || group.label === activeRuleGroup)
    .flatMap((group) => group.rules)
    .filter((rule) => ruleMatches(rule, query));

  ruleList.innerHTML = rules.length
    ? rules
        .map(
          (rule) => `
            <article class="rule-card">
              <div class="rule-meta">
                <span>${escapeHtml(rule.ref)}</span>
                <span>${escapeHtml(rule.group)}</span>
              </div>
              <h3>${escapeHtml(rule.title)}</h3>
            </article>
          `
        )
        .join("")
    : `<p class="muted-text">No rules match this filter.</p>`;
}

function renderChangelog() {
  if (!rulesData) return;
  const entries = rulesData.changelog || [];
  changelogMeta.textContent = entries.length
    ? `${entries.length} changelog entr${entries.length === 1 ? "y" : "ies"} from the manual Prefix Changelog.`
    : "No changelog entries found in the manual Prefix Changelog.";

  changelogList.innerHTML = entries.length
    ? entries
        .map(
          (entry) => `
            <article class="changelog-card">
              <div class="rule-meta">
                <span>Version ${escapeHtml(entry.version)}</span>
                <span>${escapeHtml(entry.date)}</span>
              </div>
              <ul>
                ${entry.changes.map((change) => `<li>${escapeHtml(change)}</li>`).join("")}
              </ul>
            </article>
          `
        )
        .join("")
    : `<p class="muted-text">No changes listed.</p>`;
}

async function loadRules() {
  const response = await fetch("rules.json");
  if (!response.ok) {
    rulesMeta.textContent = "Run npm run build:rules to generate the Quick Reference Guide.";
    return;
  }

  rulesData = await response.json();
  rulesMeta.textContent = `${rulesData.totalRules} entries from the manual Quick Reference Guide.`;
  renderRules();
  renderChangelog();
}

ruleTabs.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-group]");
  if (!button) return;
  activeRuleGroup = button.dataset.group;
  renderRules();
});

ruleSearch.addEventListener("input", renderRules);

document.querySelectorAll(".view-tab").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".view-tab").forEach((tab) => tab.classList.remove("active"));
    document.querySelectorAll(".app-view").forEach((view) => view.classList.remove("active"));
    button.classList.add("active");
    document.querySelector(`#${button.dataset.view}`).classList.add("active");
  });
});

loadRules();
