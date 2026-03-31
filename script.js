const STORAGE_KEY = "terra-tide-student-tasks";

const screens = Array.from(document.querySelectorAll(".screen"));
const navButtons = Array.from(document.querySelectorAll("[data-target-screen]"));
const categoryButtons = Array.from(document.querySelectorAll("[data-category-choice]"));
const typeButtons = Array.from(document.querySelectorAll("[data-type-choice]"));
const visibilityButtons = Array.from(document.querySelectorAll("[data-visibility-choice]"));

const todayLine = document.querySelector("#today-line");
const remainingChip = document.querySelector("#remaining-chip");
const examChip = document.querySelector("#exam-chip");
const priorityTitle = document.querySelector("#priority-title");
const priorityMeta = document.querySelector("#priority-meta");
const priorityTiming = document.querySelector("#priority-timing");
const progressTitle = document.querySelector("#progress-title");
const progressBar = document.querySelector("#progress-bar");
const progressCopy = document.querySelector("#progress-copy");
const upcomingTitle = document.querySelector("#upcoming-title");
const upcomingCopy = document.querySelector("#upcoming-copy");
const groupTitle = document.querySelector("#group-title");
const groupCopy = document.querySelector("#group-copy");
const agendaList = document.querySelector("#agenda-list");
const doneList = document.querySelector("#done-list");
const spacesList = document.querySelector("#spaces-list");
const focusCompleted = document.querySelector("#focus-completed");
const focusOpen = document.querySelector("#focus-open");
const focusShared = document.querySelector("#focus-shared");
const focusSpaces = document.querySelector("#focus-spaces");

const form = document.querySelector("#task-form");
const taskInput = document.querySelector("#task-input");
const categoryInput = document.querySelector("#category-input");
const dueDateInput = document.querySelector("#due-date-input");
const taskTypeInput = document.querySelector("#task-type-select");
const visibilityInput = document.querySelector("#visibility-select");
const groupInput = document.querySelector("#group-input");

const agendaTemplate = document.querySelector("#agenda-template");
const doneTemplate = document.querySelector("#done-template");
const spaceTemplate = document.querySelector("#space-template");

let state = {
  activeScreen: "day",
  tasks: loadTasks()
};

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];

    if (!Array.isArray(parsed) || parsed.length === 0) {
      return createStarterTasks();
    }

    return parsed.map(normalizeTask).filter(Boolean);
  } catch {
    return createStarterTasks();
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tasks));
}

function normalizeTask(task) {
  if (!task || typeof task.id !== "string") {
    return null;
  }

  const title = typeof task.title === "string" ? task.title.trim() : "";
  if (!title) {
    return null;
  }

  return {
    id: task.id,
    title,
    dueDate: isValidDateKey(task.dueDate) ? task.dueDate : getTodayKey(),
    taskType: ["assignment", "exam", "reminder"].includes(task.taskType) ? task.taskType : "assignment",
    category: typeof task.category === "string" ? task.category.trim() : "General",
    visibility: task.visibility === "group" ? "group" : "personal",
    groupName: typeof task.groupName === "string" ? task.groupName.trim() : "",
    completed: Boolean(task.completed),
    createdAt: typeof task.createdAt === "number" ? task.createdAt : Date.now()
  };
}

function createStarterTasks() {
  const today = getTodayKey();

  const starterTasks = [
    createTaskObject("Modern Architecture Final", today, "exam", "Architecture", "personal", ""),
    createTaskObject("Return Library Books", today, "reminder", "Personal", "personal", ""),
    createTaskObject("Bio Lab Report", offsetDate(1), "assignment", "Biology", "personal", ""),
    createTaskObject("Study Group: Art History", offsetDate(2), "assignment", "Art History", "group", "Art History"),
    createTaskObject("Math Homework Set 2", today, "assignment", "Math", "personal", "", true)
  ];

  saveStarterTasks(starterTasks);
  return starterTasks;
}

function saveStarterTasks(tasks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function createTaskObject(title, dueDate, taskType, category, visibility, groupName, completed = false) {
  return {
    id: crypto.randomUUID(),
    title,
    dueDate,
    taskType,
    category,
    visibility,
    groupName,
    completed,
    createdAt: Date.now() + Math.floor(Math.random() * 1000)
  };
}

function getTodayKey() {
  const now = new Date();
  return formatDateKey(now);
}

function offsetDate(offset) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return formatDateKey(date);
}

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isValidDateKey(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function toLocalDate(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatHeroDate() {
  const formatter = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric"
  });

  todayLine.textContent = formatter.format(new Date());
}

function getDayOffset(dateKey) {
  const today = toLocalDate(getTodayKey());
  const target = toLocalDate(dateKey);
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((target - today) / msPerDay);
}

function getStatusText(task) {
  const offset = getDayOffset(task.dueDate);

  if (offset < 0) {
    return `Overdue by ${Math.abs(offset)} day${Math.abs(offset) === 1 ? "" : "s"}`;
  }

  if (offset === 0) {
    return "Due today";
  }

  if (offset === 1) {
    return "Due tomorrow";
  }

  return `${offset} days left`;
}

function sortTasks(a, b) {
  const dateDiff = getDayOffset(a.dueDate) - getDayOffset(b.dueDate);
  if (dateDiff !== 0) {
    return dateDiff;
  }

  return a.createdAt - b.createdAt;
}

function getOpenTasks() {
  return state.tasks.filter((task) => !task.completed).sort(sortTasks);
}

function getCompletedTasks() {
  return state.tasks.filter((task) => task.completed).sort(sortTasks);
}

function getTodayTasks() {
  return getOpenTasks().filter((task) => getDayOffset(task.dueDate) <= 0);
}

function getAgendaTasks() {
  const openTasks = getOpenTasks();
  const urgent = openTasks.filter((task) => getDayOffset(task.dueDate) <= 0);
  const upcoming = openTasks.filter((task) => getDayOffset(task.dueDate) > 0);
  return [...urgent, ...upcoming].slice(0, 4);
}

function render() {
  formatHeroDate();
  renderNavigation();
  renderHero();
  renderAgenda();
  renderDone();
  renderSpaces();
  syncGroupFieldState();
}

function renderNavigation() {
  screens.forEach((screen) => {
    screen.classList.toggle("is-active", screen.dataset.screen === state.activeScreen);
  });

  document.querySelectorAll(".nav-item").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.targetScreen === state.activeScreen);
  });
}

function renderHero() {
  const todayTasks = getTodayTasks();
  const openTasks = getOpenTasks();
  const completedTasks = getCompletedTasks();
  const examsToday = todayTasks.filter((task) => task.taskType === "exam").length;
  const primaryTask = todayTasks[0] || openTasks[0];
  const nextUpcoming = openTasks.find((task) => getDayOffset(task.dueDate) > 0);
  const groupTask = openTasks.find((task) => task.visibility === "group");
  const completionRate = state.tasks.length === 0 ? 0 : Math.round((completedTasks.length / state.tasks.length) * 100);

  remainingChip.textContent = `${todayTasks.length} task${todayTasks.length === 1 ? "" : "s"} remaining`;
  examChip.textContent = `${examsToday} exam${examsToday === 1 ? "" : "s"} today`;

  if (primaryTask) {
    priorityTitle.textContent = primaryTask.title;
    priorityMeta.textContent = `${primaryTask.category} - ${primaryTask.visibility === "group" ? primaryTask.groupName : "Personal focus"}`;
    priorityTiming.textContent = getStatusText(primaryTask);
  } else {
    priorityTitle.textContent = "Clear board";
    priorityMeta.textContent = "You have no urgent items right now.";
    priorityTiming.textContent = "Use Add New to plant the next task.";
  }

  progressTitle.textContent = completedTasks.length > 0 ? "Momentum" : "Study flow";
  progressBar.style.width = `${completionRate}%`;
  progressCopy.textContent = `${completionRate}% complete`;

  if (nextUpcoming) {
    upcomingTitle.textContent = nextUpcoming.title;
    upcomingCopy.textContent = `${getStatusText(nextUpcoming)} - ${nextUpcoming.category}`;
  } else {
    upcomingTitle.textContent = "Nothing upcoming";
    upcomingCopy.textContent = "Future tasks will show here.";
  }

  if (groupTask) {
    groupTitle.textContent = groupTask.groupName || "Study group";
    groupCopy.textContent = `${groupTask.title} - ${getStatusText(groupTask)}`;
  } else {
    groupTitle.textContent = "Group space is quiet";
    groupCopy.textContent = "Shared study tasks and meetups will appear here.";
  }
}

function renderAgenda() {
  const tasks = getAgendaTasks();
  agendaList.replaceChildren();

  if (tasks.length === 0) {
    agendaList.append(createEmptyCard("No live agenda yet", "Add a task and it will appear in your current agenda."));
    return;
  }

  tasks.forEach((task) => {
    const fragment = agendaTemplate.content.cloneNode(true);
    const card = fragment.querySelector(".agenda-card");
    const check = fragment.querySelector(".agenda-check");
    const title = fragment.querySelector(".agenda-title");
    const badge = fragment.querySelector(".agenda-badge");
    const subtitle = fragment.querySelector(".agenda-subtitle");

    title.textContent = task.title;
    badge.textContent = task.category;
    subtitle.textContent = `${task.taskType} - ${getStatusText(task)}${task.visibility === "group" ? ` - ${task.groupName}` : ""}`;

    card.classList.toggle("priority", getDayOffset(task.dueDate) <= 0);
    card.classList.toggle("exam", task.taskType === "exam");
    check.addEventListener("click", () => toggleTask(task.id));

    agendaList.append(fragment);
  });
}

function renderDone() {
  const tasks = getCompletedTasks().slice(0, 4);
  doneList.replaceChildren();

  if (tasks.length === 0) {
    doneList.append(createEmptyCard("Nothing completed yet", "Finished tasks will land here once you check them off."));
    return;
  }

  tasks.forEach((task) => {
    const fragment = doneTemplate.content.cloneNode(true);
    const check = fragment.querySelector(".done-check");
    const title = fragment.querySelector(".done-title");
    const meta = fragment.querySelector(".done-meta");

    check.classList.add("is-complete");
    check.addEventListener("click", () => toggleTask(task.id));
    title.textContent = task.title;
    meta.textContent = `${task.category} - Completed`;

    doneList.append(fragment);
  });
}

function renderSpaces() {
  const spaceData = buildSpaces();
  spacesList.replaceChildren();

  spaceData.forEach((space) => {
    const fragment = spaceTemplate.content.cloneNode(true);
    const card = fragment.querySelector(".space-card");
    const pill = fragment.querySelector(".space-pill");
    const title = fragment.querySelector(".space-title");
    const copy = fragment.querySelector(".space-copy");

    pill.textContent = `${space.count} active task${space.count === 1 ? "" : "s"}`;
    title.textContent = space.title;
    copy.textContent = space.copy;
    card.dataset.space = space.title.toLowerCase();

    spacesList.append(fragment);
  });

  focusCompleted.textContent = String(getCompletedTasks().length);
  focusOpen.textContent = String(getOpenTasks().length);
  focusShared.textContent = String(state.tasks.filter((task) => task.visibility === "group").length);
  focusSpaces.textContent = String(spaceData.length);
}

function buildSpaces() {
  const openTasks = getOpenTasks();

  return [
    {
      title: "School",
      count: openTasks.filter((task) => task.category !== "Personal").length,
      copy: "Academic projects, lectures, and semester goals."
    },
    {
      title: "Personal",
      count: openTasks.filter((task) => task.visibility === "personal").length,
      copy: "Personal rituals, errands, and self-managed work."
    },
    {
      title: "Group",
      count: openTasks.filter((task) => task.visibility === "group").length,
      copy: "Shared study plans, meetups, and collaborative deadlines."
    }
  ];
}

function createEmptyCard(title, subtitle) {
  const item = document.createElement("li");
  item.className = "done-card";
  item.innerHTML = `<div class="done-body"><p class="done-title">${title}</p><p class="done-meta">${subtitle}</p></div>`;
  return item;
}

function toggleTask(taskId) {
  state.tasks = state.tasks.map((task) =>
    task.id === taskId ? { ...task, completed: !task.completed } : task
  );

  saveTasks();
  render();
}

function syncGroupFieldState() {
  const isGroup = visibilityInput.value === "group";
  groupInput.disabled = !isGroup;
  groupInput.value = isGroup ? groupInput.value : "";
}

function switchScreen(screenName) {
  state.activeScreen = screenName;
  renderNavigation();
}

function selectChoice(buttons, selectedValue, attributeName, hiddenInput) {
  buttons.forEach((button) => {
    const isSelected = button.dataset[attributeName] === selectedValue;
    button.classList.toggle("is-selected", isSelected);
  });

  hiddenInput.value = selectedValue;
}

navButtons.forEach((button) => {
  button.addEventListener("click", () => {
    switchScreen(button.dataset.targetScreen);
  });
});

categoryButtons.forEach((button) => {
  button.addEventListener("click", () => {
    selectChoice(categoryButtons, button.dataset.categoryChoice, "categoryChoice", categoryInput);
  });
});

typeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    selectChoice(typeButtons, button.dataset.typeChoice, "typeChoice", taskTypeInput);
  });
});

visibilityButtons.forEach((button) => {
  button.addEventListener("click", () => {
    selectChoice(visibilityButtons, button.dataset.visibilityChoice, "visibilityChoice", visibilityInput);
    syncGroupFieldState();
  });
});

form.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!taskInput.value.trim() || !isValidDateKey(dueDateInput.value)) {
    return;
  }

  const task = createTaskObject(
    taskInput.value.trim(),
    dueDateInput.value,
    taskTypeInput.value,
    categoryInput.value,
    visibilityInput.value,
    visibilityInput.value === "group" ? (groupInput.value.trim() || "Study Group") : ""
  );

  state.tasks = [task, ...state.tasks];
  saveTasks();
  form.reset();
  dueDateInput.value = getTodayKey();
  selectChoice(categoryButtons, "Math", "categoryChoice", categoryInput);
  selectChoice(typeButtons, "assignment", "typeChoice", taskTypeInput);
  selectChoice(visibilityButtons, "personal", "visibilityChoice", visibilityInput);
  syncGroupFieldState();
  switchScreen("day");
  render();
});

dueDateInput.value = getTodayKey();
render();
