// IT Study Planner AI — логика приложения.

// При запуске пытаемся восстановить задачи из localStorage.
const STORAGE_KEY = "itStudyPlannerTasks";
let tasks = loadTasks();
let currentStatusFilter = "all";

const taskForm = document.querySelector("#taskForm");
const taskInput = document.querySelector("#taskInput");
const categorySelect = document.querySelector("#categorySelect");
const prioritySelect = document.querySelector("#prioritySelect");
const categoryFilter = document.querySelector("#categoryFilter");
const sortSelect = document.querySelector("#sortSelect");
const taskList = document.querySelector("#taskList");
const emptyState = document.querySelector("#emptyState");
const formMessage = document.querySelector("#formMessage");
const clearButton = document.querySelector("#clearButton");
const exportButton = document.querySelector("#exportButton");
const totalCount = document.querySelector("#totalCount");
const completedCount = document.querySelector("#completedCount");
const remainingCount = document.querySelector("#remainingCount");
const progressPercent = document.querySelector("#progressPercent");
const progressFill = document.querySelector("#progressFill");
const progressTrack = document.querySelector("#progressTrack");

const priorityRank = { high: 3, medium: 2, low: 1 };
const priorityNames = { high: "Высокий", medium: "Средний", low: "Низкий" };

// Чтение и проверка сохранённых данных.
function loadTasks() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(saved)) return [];
    // Добавляем значения по умолчанию для задач, созданных в предыдущей версии.
    return saved.map((task, index) => ({
      id: task.id || `old-${index}-${Date.now()}`,
      title: String(task.title || "Задача без названия"),
      category: task.category || "Другое",
      completed: Boolean(task.completed),
      priority: priorityRank[task.priority] ? task.priority : "medium",
      createdAt: Number(task.createdAt) || Date.now() + index
    }));
  } catch (error) {
    console.warn("Не удалось загрузить задачи:", error);
    return [];
  }
}

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (error) {
    formMessage.textContent = "Не удалось сохранить данные в браузере.";
    formMessage.classList.add("error");
    console.error(error);
  }
}

// Добавление задачи с категорией и приоритетом.
taskForm.addEventListener("submit", function (event) {
  event.preventDefault();
  const title = taskInput.value.trim();

  if (!title) {
    showMessage("Введите название задачи.", true);
    taskInput.focus();
    return;
  }

  tasks.push({
    id: (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now() + Math.random()),
    title,
    category: categorySelect.value,
    completed: false,
    priority: prioritySelect.value,
    createdAt: Date.now()
  });

  saveTasks();
  taskForm.reset();
  prioritySelect.value = "medium";
  showMessage("Задача добавлена в план.");
  taskInput.focus();
  renderTasks();
});

function showMessage(message, isError = false) {
  formMessage.textContent = message;
  formMessage.classList.toggle("error", isError);
}

// Обработка отметки о выполнении.
taskList.addEventListener("change", function (event) {
  if (!event.target.matches(".task-check")) return;
  const task = tasks.find(item => item.id === event.target.dataset.id);
  if (!task) return;
  task.completed = event.target.checked;
  saveTasks();
  renderTasks();
});

// Удаление отдельной задачи.
taskList.addEventListener("click", function (event) {
  const button = event.target.closest(".delete-btn");
  if (!button) return;
  tasks = tasks.filter(task => task.id !== button.dataset.id);
  saveTasks();
  renderTasks();
  showMessage("Задача удалена.");
});

// Фильтр по статусу выполнения.
document.querySelectorAll(".filter-btn").forEach(button => {
  button.addEventListener("click", function () {
    currentStatusFilter = button.dataset.filter;
    document.querySelectorAll(".filter-btn").forEach(item => {
      const active = item === button;
      item.classList.toggle("active", active);
      item.setAttribute("aria-pressed", String(active));
    });
    renderTasks();
  });
});

// Фильтрация по выбранной категории.
categoryFilter.addEventListener("change", renderTasks);

// Сортировка по приоритету, дате добавления или названию.
sortSelect.addEventListener("change", renderTasks);

function getVisibleTasks() {
  let result = tasks.filter(task => {
    if (currentStatusFilter === "active" && task.completed) return false;
    if (currentStatusFilter === "completed" && !task.completed) return false;
    if (categoryFilter.value !== "all" && task.category !== categoryFilter.value) return false;
    return true;
  });

  switch (sortSelect.value) {
    case "newest":
      result.sort((a, b) => b.createdAt - a.createdAt);
      break;
    case "oldest":
      result.sort((a, b) => a.createdAt - b.createdAt);
      break;
    case "name":
      result.sort((a, b) => a.title.localeCompare(b.title, "ru"));
      break;
    default:
      result.sort((a, b) => priorityRank[b.priority] - priorityRank[a.priority] || b.createdAt - a.createdAt);
  }
  return result;
}

function createTaskElement(task) {
  const li = document.createElement("li");
  li.className = "task-item" + (task.completed ? " done" : "");

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.className = "task-check";
  checkbox.checked = task.completed;
  checkbox.dataset.id = task.id;
  checkbox.setAttribute("aria-label", "Отметить задачу выполненной");

  const content = document.createElement("div");
  content.className = "task-content";

  const title = document.createElement("span");
  title.className = "task-title";
  title.textContent = task.title;

  const meta = document.createElement("div");
  meta.className = "task-meta";

  const category = document.createElement("span");
  category.className = "tag";
  category.textContent = task.category;

  const priority = document.createElement("span");
  priority.className = `tag priority-${task.priority}`;
  priority.textContent = `Приоритет: ${priorityNames[task.priority]}`;

  meta.append(category, priority);
  content.append(title, meta);

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "delete-btn";
  deleteButton.textContent = "Удалить";
  deleteButton.dataset.id = task.id;
  deleteButton.setAttribute("aria-label", `Удалить задачу: ${task.title}`);

  li.append(checkbox, content, deleteButton);
  return li;
}

function renderTasks() {
  taskList.replaceChildren();
  const visibleTasks = getVisibleTasks();
  visibleTasks.forEach(task => taskList.append(createTaskElement(task)));
  emptyState.hidden = visibleTasks.length > 0;

  // Статистика рассчитывается по всему списку, а не по отфильтрованным задачам.
  const total = tasks.length;
  const completed = tasks.filter(task => task.completed).length;
  const remaining = total - completed;
  const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

  totalCount.textContent = total;
  completedCount.textContent = completed;
  remainingCount.textContent = remaining;
  progressPercent.textContent = `${progress}%`;
  progressFill.style.width = `${progress}%`;
  progressTrack.setAttribute("aria-valuenow", String(progress));
}

// Очистка списка с обязательным подтверждением.
clearButton.addEventListener("click", function () {
  if (tasks.length === 0) {
    showMessage("Список уже пуст.");
    return;
  }
  if (!window.confirm("Удалить все задачи? Это действие нельзя отменить.")) return;
  tasks = [];
  saveTasks();
  renderTasks();
  showMessage("Список очищен.");
});

// Экспорт всего списка задач в CSV с корректным экранированием кавычек.
function csvCell(value) {
  const safe = String(value ?? "").replace(/"/g, '""');
  return `"${safe}"`;
}

exportButton.addEventListener("click", function () {
  if (tasks.length === 0) {
    showMessage("Нет задач для экспорта.", true);
    return;
  }

  const headers = ["Задача", "Категория", "Приоритет", "Статус"];
  const rows = tasks.map(task => [
    task.title,
    task.category,
    priorityNames[task.priority],
    task.completed ? "Выполнена" : "Активна"
  ]);
  const csv = "\uFEFF" + [headers, ...rows].map(row => row.map(csvCell).join(";")).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "it-study-planner-tasks.csv";
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showMessage("Список экспортирован в CSV.");
});

// Первичная отрисовка при открытии.
renderTasks();
