const STORAGE_KEY = "level-up-season-notes:v1";

const starter = {
  seasonFocus:
    "Build a steady pre-season rhythm: practice skills, record robot changes, and decide what evidence matters before the first event.",
  goals: [
    { title: "Skills baseline", body: "Get a repeatable early-season driving and coding skills score." },
    { title: "Robot reliability", body: "Track which robot version survives full practice runs without repair." },
  ],
  roster: [
    { title: "Driver", body: "Practice route ideas, pressure handling, and reset habits." },
    { title: "Builder / coder", body: "Record changes, test one variable at a time, and keep backups." },
  ],
  ideas: [
    { title: "Practice review sheet", body: "One printable page for weekly coach/student reflection." },
    { title: "Robot version comparison", body: "Connect practice scores to robot versions once enough data exists." },
  ],
  practiceChecklist: [
    { text: "Warm up with one no-pressure run.", done: false },
    { text: "Log every scored run in the practice logger.", done: false },
    { text: "Record robot version before testing.", done: false },
    { text: "Write one observation and one next action.", done: false },
  ],
  readinessChecklist: [
    { text: "Robot battery plan is written down.", done: false },
    { text: "Driver station, controller, tools, and spare parts list is ready.", done: false },
    { text: "Team can explain current robot version and why it changed.", done: false },
    { text: "First-event questions for coaches are collected.", done: false },
  ],
  weeklyReview: {
    improved: "What improved this week?",
    blocked: "What slowed us down?",
    next: "What should we try next practice?",
  },
};

let state = loadState();
const template = document.querySelector("#noteTemplate");
const savedStatus = document.querySelector("#savedStatus");
const importInput = document.querySelector("#importInput");

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadState() {
  try {
    return { ...clone(starter), ...JSON.parse(localStorage.getItem(STORAGE_KEY)) };
  } catch {
    return clone(starter);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  savedStatus.textContent = `Saved ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

function renderNotes(key, placeholderTitle, placeholderBody) {
  const wrap = document.querySelector(`#${key}`);
  wrap.innerHTML = "";
  state[key].forEach((item, index) => {
    const node = template.content.firstElementChild.cloneNode(true);
    const title = node.querySelector(".title");
    const body = node.querySelector(".body");
    title.placeholder = placeholderTitle;
    body.placeholder = placeholderBody;
    title.value = item.title;
    body.value = item.body;
    title.addEventListener("input", () => updateNote(key, index, "title", title.value));
    body.addEventListener("input", () => updateNote(key, index, "body", body.value));
    node.querySelector(".remove").addEventListener("click", () => removeNote(key, index));
    wrap.append(node);
  });
}

function updateNote(key, index, field, value) {
  state[key][index][field] = value;
  saveState();
}

function addNote(key) {
  state[key].push({ title: "", body: "" });
  saveState();
  renderAll();
}

function removeNote(key, index) {
  state[key].splice(index, 1);
  saveState();
  renderAll();
}

function renderChecklist(key, selector) {
  const wrap = document.querySelector(selector);
  wrap.innerHTML = "";
  state[key].forEach((item, index) => {
    const label = document.createElement("label");
    label.className = `check${item.done ? " done" : ""}`;
    label.innerHTML = `<input type="checkbox" ${item.done ? "checked" : ""} /><span>${item.text}</span>`;
    label.querySelector("input").addEventListener("change", (event) => {
      state[key][index].done = event.target.checked;
      saveState();
      renderChecklist(key, selector);
    });
    wrap.append(label);
  });
}

function renderWeeklyReview() {
  const wrap = document.querySelector("#weeklyReview");
  wrap.innerHTML = "";
  Object.entries(state.weeklyReview).forEach(([key, label]) => {
    const card = document.createElement("label");
    card.className = "review-card";
    card.innerHTML = `<span>${label}</span><textarea rows="4"></textarea>`;
    const textarea = card.querySelector("textarea");
    textarea.value = state[`${key}Note`] || "";
    textarea.addEventListener("input", () => {
      state[`${key}Note`] = textarea.value;
      saveState();
    });
    wrap.append(card);
  });
}

function renderAll() {
  document.querySelector("#seasonFocus").value = state.seasonFocus;
  renderNotes("goals", "Goal", "How will we know it is improving?");
  renderNotes("roster", "Name or role", "Strengths, responsibilities, reminders");
  renderNotes("ideas", "Tool or process idea", "Why it might help later");
  renderChecklist("practiceChecklist", "#practiceChecklist");
  renderChecklist("readinessChecklist", "#readinessChecklist");
  renderWeeklyReview();
}

function exportJson() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "level-up-season-notes.json";
  link.click();
  URL.revokeObjectURL(url);
}

function importJson(file) {
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    try {
      state = { ...clone(starter), ...JSON.parse(reader.result) };
      saveState();
      renderAll();
    } catch (error) {
      alert(`Could not import notes: ${error.message}`);
    }
  });
  reader.readAsText(file);
}

document.querySelector("#seasonFocus").addEventListener("input", (event) => {
  state.seasonFocus = event.target.value;
  saveState();
});

document.querySelectorAll("[data-add]").forEach((button) => {
  button.addEventListener("click", () => addNote(button.dataset.add));
});

document.querySelector("#resetDemoButton").addEventListener("click", () => {
  if (!confirm("Restore starter notes? This replaces the current notes on this device.")) return;
  state = clone(starter);
  saveState();
  renderAll();
});

document.querySelector("#exportButton").addEventListener("click", exportJson);
document.querySelector("#printButton").addEventListener("click", () => window.print());
importInput.addEventListener("change", (event) => {
  const [file] = event.target.files;
  if (file) importJson(file);
  importInput.value = "";
});

renderAll();
saveState();
