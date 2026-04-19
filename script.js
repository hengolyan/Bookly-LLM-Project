const files = [
  {
    id: 1,
    name: "Vendor Agreement.pdf",
    botName: "Contract Review Bot",
    type: "PDF",
    updated: "2h ago",
    summary: "Answers contract questions and points to exact clauses.",
    location: "Section 4.2, page 8",
    answer: "The renewal notice period is 30 days before expiration.",
    excerpt: "Either party may renew this Agreement by giving written notice no later than thirty (30) days before expiration."
  },
  {
    id: 2,
    name: "Biology Notes.docx",
    botName: "Biology Tutor Bot",
    type: "DOCX",
    updated: "Today",
    summary: "Turns class notes into direct answers and quiz questions.",
    location: "Chapter 2, page 14",
    answer: "Mitochondria are responsible for ATP energy production.",
    excerpt: "Mitochondria generate ATP through cellular respiration and are often called the powerhouse of the cell."
  },
  {
    id: 3,
    name: "Tax Summary 2025.xlsx",
    botName: "Finance Helper Bot",
    type: "XLSX",
    updated: "Yesterday",
    summary: "Finds totals, dates, and financial notes from spreadsheets.",
    location: "Sheet Expenses, row 18",
    answer: "The largest expense category is operations.",
    excerpt: "Operations: 42% of annual costs, driven by logistics and vendor services."
  }
];

const recentFiles = document.getElementById("recentFiles");
const allFilesTable = document.getElementById("allFilesTable");
const navLinks = document.querySelectorAll(".nav-link");
const views = document.querySelectorAll(".view");
const chatTitle = document.getElementById("chatTitle");
const referenceFileTitle = document.getElementById("referenceFileTitle");
const chatWindow = document.getElementById("chatWindow");
const questionInput = document.getElementById("questionInput");
const studyDialog = document.getElementById("studyDialog");

let activeFile = files[0];

function renderRecentFiles() {
  recentFiles.innerHTML = files.map((file) => `
    <article class="file-card">
      <div class="file-card-top">
        <div>
          <p class="eyebrow">${file.type}</p>
          <h4>${file.name}</h4>
        </div>
        <span class="chip">${file.updated}</span>
      </div>
      <p>${file.summary}</p>
      <div class="file-actions">
        <button class="file-action" data-action="open" data-id="${file.id}">Open Bot</button>
        <button class="file-action" data-action="study" data-id="${file.id}">Study Mode</button>
        <button class="file-action" data-action="edit" data-id="${file.id}">Edit</button>
        <button class="file-action" data-action="share" data-id="${file.id}">Share</button>
        <button class="file-action" data-action="delete" data-id="${file.id}">Delete</button>
      </div>
    </article>
  `).join("");
}

function renderAllFiles() {
  allFilesTable.innerHTML = files.map((file) => `
    <div class="table-row">
      <strong>${file.name}</strong>
      <span>${file.botName}</span>
      <span>${file.updated}</span>
    </div>
  `).join("");
}

function setActiveFile(file) {
  activeFile = file;
  chatTitle.textContent = file.botName;
  referenceFileTitle.textContent = file.name;
  chatWindow.innerHTML = `
    <div class="message user-message">
      <p>What should I know most from this file?</p>
    </div>
    <div class="message bot-message">
      <p>${file.answer}</p>
      <span class="reference">Found in: ${file.location}</span>
    </div>
  `;

  const highlightedExcerpt = file.excerpt.includes("thirty (30) days before expiration")
    ? file.excerpt.replace("thirty (30) days before expiration", "<mark>thirty (30) days before expiration</mark>")
    : `<mark>${file.excerpt}</mark>`;

  document.querySelector(".reference-preview p").innerHTML = `"${highlightedExcerpt}"`;
}

function switchView(viewName) {
  navLinks.forEach((link) => {
    link.classList.toggle("active", link.dataset.view === viewName);
  });

  views.forEach((view) => {
    view.classList.toggle("active", view.id === `${viewName}View`);
  });
}

navLinks.forEach((link) => {
  link.addEventListener("click", () => switchView(link.dataset.view));
});

recentFiles.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  const file = files.find((item) => item.id === Number(button.dataset.id));
  if (!file) return;

  if (button.dataset.action === "open") {
    setActiveFile(file);
    switchView("home");
  }

  if (button.dataset.action === "study") {
    setActiveFile(file);
    studyDialog.showModal();
  }

  if (button.dataset.action === "edit") {
    alert(`Edit settings for ${file.name}`);
  }

  if (button.dataset.action === "share") {
    alert(`Share ${file.name} with another user or team`);
  }

  if (button.dataset.action === "delete") {
    alert(`Delete ${file.name} from your workspace`);
  }
});

document.getElementById("createFileBtn").addEventListener("click", () => {
  alert("This is where users upload a new file and generate a unique file bot.");
});

document.getElementById("askBtn").addEventListener("click", () => {
  const question = questionInput.value.trim();
  if (!question) return;

  chatWindow.innerHTML += `
    <div class="message user-message">
      <p>${question}</p>
    </div>
    <div class="message bot-message">
      <p>${activeFile.answer}</p>
      <span class="reference">Found in: ${activeFile.location}</span>
    </div>
  `;

  questionInput.value = "";
  chatWindow.scrollTop = chatWindow.scrollHeight;
});

questionInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    document.getElementById("askBtn").click();
  }
});

document.getElementById("closeStudyDialog").addEventListener("click", () => {
  studyDialog.close();
});

renderRecentFiles();
renderAllFiles();
setActiveFile(activeFile);