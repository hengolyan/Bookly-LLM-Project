const STORAGE_KEY = "northstar-student-tasks";

const form = document.querySelector("#task-form");
const taskInput = document.querySelector("#task-input");
const dueDateInput = document.querySelector("#due-date-input");
const taskTypeSelect = document.querySelector("#task-type-select");
const categoryInput = document.querySelector("#category-input");
const visibilitySelect = document.querySelector("#visibility-select");
const groupInput = document.querySelector("#group-input");
const searchInput = document.querySelector("#search-input");
const dateFilter = document.querySelector("#date-filter");
const viewButtons = Array.from(document.querySelectorAll(".view-button"));
const todayList = document.querySelector("#today-list");
const upcomingList = document.querySelector("#upcoming-list");
const completedList = document.querySelector("#completed-list");
const itemsLeft = document.querySelector("#items-left");
const itemsDone = document.querySelector("#items-done");
const upcomingCount = document.querySelector("#upcoming-count");
const sharedCount = document.querySelector("#shared-count");
const progressCopy = document.querySelector("#progress-copy");
const statusLine = document.querySelector("#status-line");
const todayLabel = document.querySelector("#today-label");
const clearCompletedButton = document.querySelector("#clear-completed");
const taskTemplate = document.querySelector("#task-template");
const emptyStateTemplate = document.querySelector("#empty-state-template");

let state = {
  tasks: loadTasks(),
  view: "all",
  search: "",
  dateFilter: "today"
};

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map(normalizeTask)
      .filter(Boolean);
  } catch {
    return [];
  }
}

function normalizeTask(task) {
  if (!task || typeof task.id !== "string") {
    return null;
  }

  const title = typeof task.title === "string"
    ? task.title.trim()
    : typeof task.text === "string"
      ? task.text.trim()
      : "";

  if (!title) {
    return null;
  }

  const today = getTodayKey();
  const fallbackDate = isValidDateKey(task.dueDate) ? task.dueDate : today;
  const visibility = task.visibility === "group" ? "group" : "personal";
  const groupName = visibility === "group" ? (task.groupName || "Study Group").trim() || "Study Group" : "";

  return {
    id: task.id,
    title,
    dueDate: fallbackDate,
    taskType: normalizeTaskType(task.taskType),
    category: typeof task.category === "string" ? task.category.trim() : "",
    visibility,
    groupName,
    completed: Boolean(task.completed),
    createdAt: typeof task.createdAt === "number" ? task.createdAt : Date.now(),
    completedAt: typeof task.completedAt === "number" ? task.completedAt : null
  };
}

function normalizeTaskType(taskType) {
  return ["assignment", "exam", "reminder"].includes(taskType) ? taskType : "assignment";
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tasks));
}

function getTodayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isValidDateKey(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const candidate = new Date(year, month - 1, day);

  return candidate.getFullYear() === year
    && candidate.getMonth() === month - 1
    && candidate.getDate() === day;
}

function dateKeyToLocalDate(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatToday() {
  const formatter = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric"
  });

  todayLabel.textContent = formatter.format(new Date());
}

function formatDueDate(dateKey) {
  const formatter = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric"
  });

  return formatter.format(dateKeyToLocalDate(dateKey));
}

function getDayOffset(dateKey) {
  const target = dateKeyToLocalDate(dateKey);
  const today = dateKeyToLocalDate(getTodayKey());
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((target - today) / msPerDay);
}

function getDueLabel(task) {
  const offset = getDayOffset(task.dueDate);

  if (offset < 0) {
    return { text: `Overdue by ${Math.abs(offset)} day${Math.abs(offset) === 1 ? "" : "s"}`, tone: "overdue" };
  }

  if (offset === 0) {
    return { text: "Due today", tone: "soon" };
  }

  if (offset === 1) {
    return { text: "Due tomorrow", tone: "soon" };
  }

  return { text: `${offset} days left`, tone: "ok" };
}

function createTask() {
  const visibility = visibilitySelect.value === "group" ? "group" : "personal";
  const groupName = visibility === "group"
    ? (groupInput.value.trim() || "Study Group")
    : "";

  return {
    id: crypto.randomUUID(),
    title: taskInput.value.trim(),
    dueDate: dueDateInput.value,
    taskType: normalizeTaskType(taskTypeSelect.value),
    category: categoryInput.value.trim(),
    visibility,
    groupName,
    completed: false,
    createdAt: Date.now(),
    completedAt: null
  };
}

function taskMatchesView(task) {
  return state.view === "all" ? true : task.visibility === state.view;
}

function taskMatchesSearch(task) {
  const query = state.search.trim().toLowerCase();

  if (!query) {
    return true;
  }

  return [
    task.title,
    task.category,
    task.groupName,
    task.taskType
  ].some((value) => value.toLowerCase().includes(query));
}

function taskMatchesCurrentFilters(task) {
  return taskMatchesView(task) && taskMatchesSearch(task);
}

function getUpcomingLimit() {
  if (state.dateFilter === "today") {
    return 7;
  }

  if (state.dateFilter === "week") {
    return 14;
  }

  return Number.POSITIVE_INFINITY;
}

function getBuckets() {
  const todayTasks = [];
  const upcomingTasks = [];
  const completedTasks = [];

  state.tasks
    .filter(taskMatchesCurrentFilters)
    .forEach((task) => {
      const offset = getDayOffset(task.dueDate);

      if (task.completed) {
        if (state.dateFilter === "all" || offset <= getUpcomingLimit()) {
          completedTasks.push(task);
        }
        return;
      }

      if (offset <= 0) {
        todayTasks.push(task);
        return;
      }

      if (offset <= getUpcomingLimit()) {
        upcomingTasks.push(task);
      }
    });

  todayTasks.sort(sortTasks);
  upcomingTasks.sort(sortTasks);
  completedTasks.sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0) || sortTasks(a, b));

  return { todayTasks, upcomingTasks, completedTasks };
}

function sortTasks(a, b) {
  const offsetDiff = getDayOffset(a.dueDate) - getDayOffset(b.dueDate);

  if (offsetDiff !== 0) {
    return offsetDiff;
  }

  return a.createdAt - b.createdAt;
}

function render() {
  const { todayTasks, upcomingTasks, completedTasks } = getBuckets();
  const visibleTasks = state.tasks.filter(taskMatchesCurrentFilters);
  const visibleOpenTasks = visibleTasks.filter((task) => !task.completed);
  const sharedVisibleCount = visibleTasks.filter((task) => task.visibility === "group").length;

  renderList(todayList, todayTasks, "No tasks are due in the current focus window.");
  renderList(upcomingList, upcomingTasks, "No upcoming tasks are waiting beyond today.");
  renderList(completedList, completedTasks, "Nothing completed yet in this view.");

  itemsLeft.textContent = String(todayTasks.filter((task) => !task.completed).length);
  itemsDone.textContent = String(completedTasks.length);
  upcomingCount.textContent = String(upcomingTasks.length);
  sharedCount.textContent = String(sharedVisibleCount);

  if (visibleTasks.length === 0) {
    statusLine.textContent = "No tasks match the current space or search. Try adding one.";
    progressCopy.textContent = "Your board is empty for this view, so this is a great moment to capture the next task.";
  } else if (todayTasks.length === 0 && visibleOpenTasks.length > 0) {
    statusLine.textContent = "Nothing is due today. Your next work is sitting in the upcoming lane.";
    progressCopy.textContent = `${visibleOpenTasks.length} open task${visibleOpenTasks.length === 1 ? "" : "s"} remain in this view.`;
  } else if (todayTasks.length > 0) {
    statusLine.textContent = `${todayTasks.length} task${todayTasks.length === 1 ? "" : "s"} need attention today or are already overdue.`;
    progressCopy.textContent = `${completedTasks.length} completed, ${upcomingTasks.length} upcoming, and ${sharedVisibleCount} shared task${sharedVisibleCount === 1 ? "" : "s"} visible.`;
  } else {
    statusLine.textContent = "Everything in this view is complete. Nicely done.";
    progressCopy.textContent = "Use the form to add the next assignment, exam, or reminder.";
  }

  clearCompletedButton.disabled = completedTasks.length === 0;

  viewButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.view === state.view);
  });
}

function renderList(container, tasks, emptyMessage) {
  container.replaceChildren();

  if (tasks.length === 0) {
    const emptyNode = emptyStateTemplate.content.cloneNode(true);
    emptyNode.querySelector("p").textContent = emptyMessage;
    container.append(emptyNode);
    return;
  }

  tasks.forEach((task) => {
    container.append(createTaskElement(task));
  });
}

function createTaskElement(task) {
  const fragment = taskTemplate.content.cloneNode(true);
  const item = fragment.querySelector(".task-item");
  const checkbox = fragment.querySelector(".checkbox-button");
  const text = fragment.querySelector(".task-text");
  const typeBadge = fragment.querySelector('[data-role="type"]');
  const spaceBadge = fragment.querySelector('[data-role="space"]');
  const duePill = fragment.querySelector('[data-role="due"]');
  const categoryPill = fragment.querySelector('[data-role="category"]');
  const groupPill = fragment.querySelector('[data-role="group"]');
  const editButton = fragment.querySelector('[data-action="edit"]');
  const deleteButton = fragment.querySelector('[data-action="delete"]');
  const dueLabel = getDueLabel(task);

  item.classList.toggle("is-complete", task.completed);
  item.classList.toggle("is-overdue", !task.completed && dueLabel.tone === "overdue");
  checkbox.classList.toggle("is-complete", task.completed);
  checkbox.setAttribute("aria-label", task.completed ? `Mark "${task.title}" as active` : `Mark "${task.title}" as complete`);

  text.textContent = task.title;
  typeBadge.textContent = task.taskType;
  spaceBadge.textContent = task.visibility === "group" ? "group" : "personal";
  if (task.visibility === "group") {
    spaceBadge.dataset.tone = "group";
  }

  duePill.textContent = `${formatDueDate(task.dueDate)} - ${dueLabel.text}`;
  duePill.classList.add(`is-${dueLabel.tone}`);
  categoryPill.textContent = task.category || "No category";
  groupPill.textContent = task.visibility === "group" ? task.groupName : "Private";

  checkbox.addEventListener("click", () => toggleTask(task.id));
  editButton.addEventListener("click", () => editTask(task.id));
  deleteButton.addEventListener("click", () => deleteTask(task.id));

  return fragment;
}

function toggleTask(taskId) {
  state.tasks = state.tasks.map((task) =>
    task.id === taskId
      ? { ...task, completed: !task.completed, completedAt: task.completed ? null : Date.now() }
      : task
  );

  saveTasks();
  render();
}

function deleteTask(taskId) {
  state.tasks = state.tasks.filter((task) => task.id !== taskId);
  saveTasks();
  render();
}

function editTask(taskId) {
  const currentTask = state.tasks.find((task) => task.id === taskId);

  if (!currentTask) {
    return;
  }

  const nextTitle = window.prompt("Update task title", currentTask.title);
  if (nextTitle === null) {
    return;
  }

  const trimmedTitle = nextTitle.trim();
  if (!trimmedTitle) {
    window.alert("Task title cannot be empty.");
    return;
  }

  const nextCategory = window.prompt("Update category", currentTask.category);
  if (nextCategory === null) {
    return;
  }

  const nextDueDate = window.prompt("Update due date (YYYY-MM-DD)", currentTask.dueDate);
  if (nextDueDate === null) {
    return;
  }

  if (!isValidDateKey(nextDueDate.trim())) {
    window.alert("Please enter the date in YYYY-MM-DD format.");
    return;
  }

  state.tasks = state.tasks.map((task) =>
    task.id === taskId
      ? {
          ...task,
          title: trimmedTitle,
          category: nextCategory.trim(),
          dueDate: nextDueDate.trim()
        }
      : task
  );

  saveTasks();
  render();
}

function syncGroupFieldState() {
  const isGroup = visibilitySelect.value === "group";
  groupInput.disabled = !isGroup;
  groupInput.placeholder = isGroup ? "Study Group Alpha" : "Only used for group tasks";
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!taskInput.value.trim()) {
    taskInput.focus();
    return;
  }

  if (!isValidDateKey(dueDateInput.value)) {
    dueDateInput.focus();
    return;
  }

  const nextTask = createTask();
  state.tasks = [...state.tasks, nextTask];
  saveTasks();
  render();

  form.reset();
  dueDateInput.value = getTodayKey();
  taskTypeSelect.value = "assignment";
  visibilitySelect.value = "personal";
  syncGroupFieldState();
  taskInput.focus();
});

searchInput.addEventListener("input", () => {
  state.search = searchInput.value;
  render();
});

dateFilter.addEventListener("change", () => {
  state.dateFilter = dateFilter.value;
  render();
});

visibilitySelect.addEventListener("change", syncGroupFieldState);

viewButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.view = button.dataset.view;
    render();
  });
});

clearCompletedButton.addEventListener("click", () => {
  state.tasks = state.tasks.filter((task) => !task.completed);
  saveTasks();
  render();
});

dueDateInput.value = getTodayKey();
formatToday();
syncGroupFieldState();
render();
