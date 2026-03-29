const STORAGE_KEY = "northstar-task-board";

const form = document.querySelector("#task-form");
const input = document.querySelector("#task-input");
const prioritySelect = document.querySelector("#priority-select");
const searchInput = document.querySelector("#search-input");
const list = document.querySelector("#task-list");
const filters = Array.from(document.querySelectorAll(".filter-button"));
const itemsLeft = document.querySelector("#items-left");
const itemsDone = document.querySelector("#items-done");
const completionRate = document.querySelector("#completion-rate");
const progressCopy = document.querySelector("#progress-copy");
const statusLine = document.querySelector("#status-line");
const clearCompletedButton = document.querySelector("#clear-completed");
const todayLabel = document.querySelector("#today-label");
const taskTemplate = document.querySelector("#task-template");
const emptyStateTemplate = document.querySelector("#empty-state-template");

let state = {
  tasks: loadTasks(),
  filter: "all",
  search: ""
};

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((task) => task && typeof task.id === "string" && typeof task.text === "string")
      .map((task) => ({
        id: task.id,
        text: task.text.trim(),
        completed: Boolean(task.completed),
        priority: normalizePriority(task.priority),
        createdAt: typeof task.createdAt === "number" ? task.createdAt : Date.now()
      }));
  } catch {
    return [];
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tasks));
}

function normalizePriority(priority) {
  return ["high", "medium", "low"].includes(priority) ? priority : "medium";
}

function createTask(text, priority) {
  return {
    id: crypto.randomUUID(),
    text: text.trim(),
    priority: normalizePriority(priority),
    completed: false,
    createdAt: Date.now()
  };
}

function formatToday() {
  const formatter = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric"
  });

  todayLabel.textContent = formatter.format(new Date());
}

function formatTaskDate(timestamp) {
  const formatter = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });

  return formatter.format(new Date(timestamp));
}

function getVisibleTasks() {
  return state.tasks
    .filter((task) => {
      if (state.filter === "active") {
        return !task.completed;
      }

      if (state.filter === "completed") {
        return task.completed;
      }

      if (state.filter === "high") {
        return task.priority === "high";
      }

      return true;
    })
    .filter((task) => {
      const query = state.search.trim().toLowerCase();
      return query ? task.text.toLowerCase().includes(query) : true;
    })
    .sort((a, b) => {
      if (a.completed !== b.completed) {
        return Number(a.completed) - Number(b.completed);
      }

      const priorityOrder = { high: 0, medium: 1, low: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }

      return b.createdAt - a.createdAt;
    });
}

function render() {
  const visibleTasks = getVisibleTasks();
  const activeCount = state.tasks.filter((task) => !task.completed).length;
  const completedCount = state.tasks.length - activeCount;
  const highPriorityCount = state.tasks.filter((task) => task.priority === "high" && !task.completed).length;
  const completion = state.tasks.length === 0 ? 0 : Math.round((completedCount / state.tasks.length) * 100);

  list.replaceChildren();

  if (visibleTasks.length === 0) {
    list.append(emptyStateTemplate.content.cloneNode(true));
  } else {
    visibleTasks.forEach((task) => {
      list.append(createTaskElement(task));
    });
  }

  itemsLeft.textContent = String(activeCount);
  itemsDone.textContent = String(completedCount);
  completionRate.textContent = `${completion}%`;

  if (state.tasks.length === 0) {
    progressCopy.textContent = "Everything you add will show up here.";
    statusLine.textContent = "No tasks yet. Add one to get started.";
  } else if (activeCount === 0) {
    progressCopy.textContent = "The board is clear. Nice work.";
    statusLine.textContent = "All tasks are complete. You can coast for a minute.";
  } else {
    progressCopy.textContent = `${visibleTasks.length} showing out of ${state.tasks.length} saved tasks.`;
    statusLine.textContent =
      highPriorityCount > 0
        ? `${highPriorityCount} high-priority task${highPriorityCount === 1 ? "" : "s"} still need attention.`
        : `${activeCount} active task${activeCount === 1 ? "" : "s"} still in motion.`;
  }

  clearCompletedButton.disabled = completedCount === 0;

  filters.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.filter === state.filter);
  });
}

function createTaskElement(task) {
  const fragment = taskTemplate.content.cloneNode(true);
  const item = fragment.querySelector(".task-item");
  const checkbox = fragment.querySelector(".checkbox-button");
  const text = fragment.querySelector(".task-text");
  const meta = fragment.querySelector(".task-meta");
  const priorityPill = fragment.querySelector(".priority-pill");
  const editButton = fragment.querySelector('[data-action="edit"]');
  const deleteButton = fragment.querySelector('[data-action="delete"]');

  item.classList.toggle("is-complete", task.completed);
  checkbox.classList.toggle("is-complete", task.completed);
  checkbox.setAttribute("aria-label", task.completed ? `Mark "${task.text}" as active` : `Mark "${task.text}" as complete`);

  text.textContent = task.text;
  meta.textContent = `${task.completed ? "Completed" : "Added"} ${formatTaskDate(task.createdAt)}`;
  priorityPill.textContent = `${task.priority} priority`;
  priorityPill.dataset.priority = task.priority;

  checkbox.addEventListener("click", () => toggleTask(task.id));
  editButton.addEventListener("click", () => editTask(task.id));
  deleteButton.addEventListener("click", () => deleteTask(task.id));

  return fragment;
}

function addTask(text, priority) {
  const newTask = createTask(text, priority);
  state.tasks = [newTask, ...state.tasks];
  saveTasks();
  render();
}

function toggleTask(taskId) {
  state.tasks = state.tasks.map((task) =>
    task.id === taskId ? { ...task, completed: !task.completed } : task
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
  const existingTask = state.tasks.find((task) => task.id === taskId);

  if (!existingTask) {
    return;
  }

  const nextText = window.prompt("Update your task", existingTask.text);

  if (nextText === null) {
    return;
  }

  const trimmedText = nextText.trim();

  if (!trimmedText) {
    window.alert("Task text cannot be empty.");
    return;
  }

  state.tasks = state.tasks.map((task) =>
    task.id === taskId ? { ...task, text: trimmedText } : task
  );
  saveTasks();
  render();
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = input.value.trim();

  if (!text) {
    input.focus();
    return;
  }

  addTask(text, prioritySelect.value);
  form.reset();
  prioritySelect.value = "medium";
  input.focus();
});

searchInput.addEventListener("input", () => {
  state.search = searchInput.value;
  render();
});

filters.forEach((button) => {
  button.addEventListener("click", () => {
    state.filter = button.dataset.filter;
    render();
  });
});

clearCompletedButton.addEventListener("click", () => {
  state.tasks = state.tasks.filter((task) => !task.completed);
  saveTasks();
  render();
});

formatToday();
render();
