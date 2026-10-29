const form = document.querySelector("#subscriber-form");
const nameInput = document.querySelector("#subscriber-name");
const statusNode = document.querySelector("#form-status");
const listNode = document.querySelector("#subscriber-list");
const countNode = document.querySelector("#subscriber-count");
const emptyNode = document.querySelector("#empty-state");

function showStatus(message, kind = "info") {
  statusNode.textContent = message;
  statusNode.dataset.kind = kind;
}

function renderSubscribers(subscribers) {
  listNode.replaceChildren(
    ...subscribers.map(({ name }) => {
      const item = document.createElement("li");
      item.textContent = name;
      return item;
    }),
  );
  countNode.textContent = String(subscribers.length);
  emptyNode.hidden = subscribers.length > 0;
}

async function loadSubscribers() {
  const response = await fetch("/api/subscribers");
  if (!response.ok) {
    throw new Error("Не удалось загрузить список.");
  }
  const payload = await response.json();
  renderSubscribers(payload.subscribers);
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const name = nameInput.value;
  form.querySelector("button").disabled = true;
  showStatus("Добавляем…");

  try {
    const response = await fetch("/api/subscribers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error?.message ?? "Не удалось добавить подписчика.");
    }

    showStatus(
      payload.created ? `${payload.subscriber.name} добавлен(а).` : "Такой подписчик уже есть.",
      payload.created ? "success" : "info",
    );
    nameInput.value = "";
    await loadSubscribers();
    nameInput.focus();
  } catch (error) {
    showStatus(error.message, "error");
  } finally {
    form.querySelector("button").disabled = false;
  }
});

loadSubscribers().catch((error) => showStatus(error.message, "error"));

