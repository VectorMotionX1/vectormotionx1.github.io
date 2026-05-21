const STORAGE_KEY = "level-up-robot-log:v1";
const SUBSYSTEMS = ["Drivebase", "Intake", "Lift", "Scoring", "Sensors", "Code", "Structure"];

const form = document.querySelector("#versionForm");
const list = document.querySelector("#versionList");
const template = document.querySelector("#versionCardTemplate");
const subsystemWrap = document.querySelector("#subsystems");
const countLabel = document.querySelector("#versionCount");
const searchInput = document.querySelector("#searchInput");
const statusFilter = document.querySelector("#statusFilter");
const importInput = document.querySelector("#importInput");

let versions = loadVersions();

function today() {
  return new Date().toISOString().slice(0, 10);
}

function loadVersions() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveVersions() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(versions));
}

function field(id) {
  return document.querySelector(`#${id}`);
}

function selectedSubsystems() {
  return [...subsystemWrap.querySelectorAll("input:checked")].map((input) => input.value);
}

function renderSubsystemChoices() {
  subsystemWrap.innerHTML = SUBSYSTEMS.map(
    (name) => `<label class="chip"><input type="checkbox" value="${name}" /> ${name}</label>`,
  ).join("");
}

function resetForm() {
  form.reset();
  field("versionId").value = "";
  field("date").value = today();
  subsystemWrap.querySelectorAll("input").forEach((input) => {
    input.checked = false;
  });
  field("formTitle").textContent = "Add Robot Version";
}

function versionFromForm() {
  return {
    id: field("versionId").value || crypto.randomUUID(),
    name: field("name").value.trim(),
    date: field("date").value,
    status: field("status").value,
    subsystems: selectedSubsystems(),
    summary: field("summary").value.trim(),
    reason: field("reason").value.trim(),
    testResult: field("testResult").value.trim(),
    improved: field("improved").value.trim(),
    worse: field("worse").value.trim(),
    nextAction: field("nextAction").value.trim(),
    mediaLink: field("mediaLink").value.trim(),
    updatedAt: new Date().toISOString(),
  };
}

function searchableText(version) {
  return [
    version.name,
    version.status,
    version.summary,
    version.reason,
    version.testResult,
    version.improved,
    version.worse,
    version.nextAction,
    version.subsystems.join(" "),
  ].join(" ").toLowerCase();
}

function filteredVersions() {
  const query = searchInput.value.trim().toLowerCase();
  const status = statusFilter.value;
  return versions
    .filter((version) => status === "all" || version.status === status)
    .filter((version) => !query || searchableText(version).includes(query))
    .sort((a, b) => b.date.localeCompare(a.date) || b.updatedAt.localeCompare(a.updatedAt));
}

function renderVersions() {
  const visible = filteredVersions();
  countLabel.textContent = `${versions.length} saved`;

  if (!visible.length) {
    list.innerHTML = `<div class="empty">No robot versions match this view yet.</div>`;
    return;
  }

  list.innerHTML = "";
  visible.forEach((version) => {
    const node = template.content.firstElementChild.cloneNode(true);
    node.querySelector("h3").textContent = version.name;
    node.querySelector(".meta").textContent = `${version.date} - ${version.subsystems.join(", ") || "No subsystem"}`;
    node.querySelector(".status-pill").textContent = version.status;
    node.querySelector(".summary").textContent = version.summary || "No summary yet.";
    node.querySelector(".tag-row").innerHTML = version.subsystems
      .map((name) => `<span class="chip">${name}</span>`)
      .join("");
    node.querySelector(".next-action").textContent = version.nextAction
      ? `Next: ${version.nextAction}`
      : "Next: decide after the next test.";
    node.querySelector(".edit").addEventListener("click", () => editVersion(version.id));
    node.querySelector(".delete").addEventListener("click", () => deleteVersion(version.id));
    list.append(node);
  });
}

function editVersion(id) {
  const version = versions.find((item) => item.id === id);
  if (!version) return;

  field("versionId").value = version.id;
  field("name").value = version.name;
  field("date").value = version.date;
  field("status").value = version.status;
  field("summary").value = version.summary;
  field("reason").value = version.reason;
  field("testResult").value = version.testResult;
  field("improved").value = version.improved;
  field("worse").value = version.worse;
  field("nextAction").value = version.nextAction;
  field("mediaLink").value = version.mediaLink;
  subsystemWrap.querySelectorAll("input").forEach((input) => {
    input.checked = version.subsystems.includes(input.value);
  });
  field("formTitle").textContent = "Edit Robot Version";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function deleteVersion(id) {
  const version = versions.find((item) => item.id === id);
  if (!version || !confirm(`Delete ${version.name}?`)) return;
  versions = versions.filter((item) => item.id !== id);
  saveVersions();
  renderVersions();
}

function exportJson() {
  const blob = new Blob([JSON.stringify({ versions }, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "level-up-robot-log.json";
  link.click();
  URL.revokeObjectURL(url);
}

function importJson(file) {
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    try {
      const data = JSON.parse(reader.result);
      const incoming = Array.isArray(data) ? data : data.versions;
      if (!Array.isArray(incoming)) throw new Error("Missing versions array");
      versions = incoming;
      saveVersions();
      renderVersions();
      resetForm();
    } catch (error) {
      alert(`Could not import file: ${error.message}`);
    }
  });
  reader.readAsText(file);
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const nextVersion = versionFromForm();
  versions = versions.some((item) => item.id === nextVersion.id)
    ? versions.map((item) => (item.id === nextVersion.id ? nextVersion : item))
    : [nextVersion, ...versions];
  saveVersions();
  renderVersions();
  resetForm();
});

document.querySelector("#resetButton").addEventListener("click", resetForm);
document.querySelector("#exportButton").addEventListener("click", exportJson);
document.querySelector("#printButton").addEventListener("click", () => window.print());
importInput.addEventListener("change", (event) => {
  const [file] = event.target.files;
  if (file) importJson(file);
  importInput.value = "";
});
searchInput.addEventListener("input", renderVersions);
statusFilter.addEventListener("change", renderVersions);

renderSubsystemChoices();
resetForm();
renderVersions();
