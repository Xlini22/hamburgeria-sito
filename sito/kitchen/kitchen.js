const API_ORIGIN = window.BOURMET_API_URL || (location.port === "5500" ? "http://localhost:3000" : location.origin);
const apiUrl = (path) => `${API_ORIGIN}${path}`;
const TOKEN_KEY = "bourmet_kitchen_access_token";
const statusConfig = {
  new: { label: "Nuovo", next: "preparing", action: "Avvia preparazione" },
  preparing: { label: "In preparazione", next: "ready", action: "Segna come pronto" },
  ready: { label: "Pronto", next: "delivered", action: "Segna come consegnato" },
  delivered: { label: "Consegnato" },
  cancelled: { label: "Annullato" },
};
const kitchenView = document.querySelector("#kitchen-view");
const boardMessage = document.querySelector("#board-message");
const logoutButton = document.querySelector("#logout-button");
let knownOrderIds = null;
let soundEnabled = true;
let loading = false;

const escapeHtml = (value = "") => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
const money = (value) => Number(value).toLocaleString("it-IT", { style: "currency", currency: "EUR" });
const dateTime = (value) => new Date(value).toLocaleString("it-IT", { dateStyle: "short", timeStyle: "short" });

function saveToken(body) {
  sessionStorage.setItem(TOKEN_KEY, body.access_token);
}
function clearToken() {
  sessionStorage.removeItem(TOKEN_KEY);
}
async function refreshSession() {
  const response = await fetch(apiUrl("/api/auth/refresh"), { method: "POST", credentials: "include" });
  if (!response.ok) return false;
  saveToken(await response.json());
  return true;
}
async function authenticatedFetch(path, options = {}, retry = true) {
  const response = await fetch(apiUrl(path), {
    ...options,
    headers: { ...options.headers, Authorization: `Bearer ${sessionStorage.getItem(TOKEN_KEY) || ""}` },
  });
  if (response.status === 401 && retry && await refreshSession()) return authenticatedFetch(path, options, false);
  return response;
}
function goToLogin() {
  clearToken();
  window.location.replace("../admin/index.html");
}
async function openKitchen() {
  const response = await authenticatedFetch("/api/auth/me");
  if (!response.ok) {
    goToLogin();
    return;
  }
  const user = await response.json();
  if (!["admin", "kitchen"].includes(user.role)) {
    window.location.replace("../admin/index.html");
    return;
  }
  kitchenView.hidden = false;
  logoutButton.hidden = false;
  document.querySelector("#connection-state").textContent = `Connesso: ${user.username}`;
  await loadOrders();
}

logoutButton.addEventListener("click", async () => {
  await fetch(apiUrl("/api/auth/logout"), { method: "POST", credentials: "include" }).catch(() => undefined);
  clearToken();
  knownOrderIds = null;
  goToLogin();
});

async function loadOrders(manual = false) {
  if (loading || kitchenView.hidden || document.hidden) return;
  loading = true;
  if (manual) boardMessage.textContent = "Aggiornamento…";
  try {
    const response = await authenticatedFetch("/api/kitchen/orders");
    if (response.status === 403) {
      goToLogin();
      return;
    }
    if (!response.ok) throw new Error("load");
    const orders = await response.json();
    notifyNewOrders(orders);
    renderOrders(orders);
    document.querySelector("#connection-state").textContent = "Aggiornato ora";
    boardMessage.textContent = "";
  } catch {
    boardMessage.textContent = "Impossibile aggiornare gli ordini. Nuovo tentativo automatico tra pochi secondi.";
    document.querySelector("#connection-state").textContent = "Connessione assente";
  } finally {
    loading = false;
  }
}

function notifyNewOrders(orders) {
  const current = new Set(orders.filter((order) => order.status === "new").map((order) => order.id));
  if (knownOrderIds !== null && [...current].some((id) => !knownOrderIds.has(id))) {
    document.body.classList.add("new-order-alert");
    setTimeout(() => document.body.classList.remove("new-order-alert"), 1200);
    playAlert();
  }
  knownOrderIds = current;
}

function renderOrders(orders) {
  for (const status of ["new", "preparing", "ready"]) {
    const filtered = orders.filter((order) => order.status === status);
    document.querySelector(`#${status}-count`).textContent = filtered.length;
    document.querySelector(`#${status}-orders`).innerHTML = filtered.length
      ? filtered.map(renderOrderCard).join("")
      : '<p class="empty-column">Nessun ordine in questa fase.</p>';
  }
}

function renderOrderCard(order) {
  const config = statusConfig[order.status];
  return `<article class="order-card ${order.status}" data-order-id="${order.id}">
    <header class="order-card-head"><div><h3>Tavolo ${order.table.number}</h3><strong>Ordine ${order.orderNumber}</strong></div><span class="order-age" data-created-at="${escapeHtml(order.createdAt)}">${elapsed(order.createdAt)}</span></header>
    <ul class="order-items">${order.items.map((item) => `<li class="order-item">
      <div class="order-item-main"><b>${item.quantity}×</b><span>${escapeHtml(item.name)}</span></div>
      ${item.preferences.map((preference) => `<p class="preference">⚠ ${preference.quantity}× ${escapeHtml(preference.text)}</p>`).join("")}
    </li>`).join("")}</ul>
    <p class="order-total"><span>Totale</span><strong>${money(order.total)}</strong></p>
    <button class="advance-order" type="button" data-next-status="${config.next}">${config.action}</button>
  </article>`;
}

document.querySelector(".order-board").addEventListener("click", async (event) => {
  const button = event.target.closest(".advance-order");
  if (!button) return;
  const card = button.closest("[data-order-id]");
  button.disabled = true;
  boardMessage.textContent = "";
  const response = await authenticatedFetch(`/api/kitchen/orders/${card.dataset.orderId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: button.dataset.nextStatus }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    boardMessage.textContent = typeof body.message === "string" ? body.message : "Cambio di stato non riuscito.";
    button.disabled = false;
    return;
  }
  await loadOrders(true);
});

document.querySelector("#refresh-button").addEventListener("click", () => loadOrders(true));
document.querySelector("#sound-toggle").addEventListener("click", (event) => {
  soundEnabled = !soundEnabled;
  event.currentTarget.setAttribute("aria-pressed", String(soundEnabled));
  event.currentTarget.textContent = soundEnabled ? "Suono attivo" : "Suono disattivato";
  if (soundEnabled) playAlert();
});
document.querySelector("#history-toggle").addEventListener("click", async (event) => {
  const panel = document.querySelector("#history-panel");
  const open = panel.hidden;
  panel.hidden = !open;
  event.currentTarget.setAttribute("aria-expanded", String(open));
  event.currentTarget.querySelector("i").textContent = open ? "Chiudi" : "Apri";
  if (open) await loadHistory();
});

async function loadHistory() {
  const container = document.querySelector("#history-orders");
  container.innerHTML = '<p>Caricamento storico…</p>';
  const response = await authenticatedFetch("/api/kitchen/orders/history?limit=50");
  if (!response.ok) {
    container.innerHTML = '<p>Storico momentaneamente non disponibile.</p>';
    return;
  }
  const orders = await response.json();
  container.innerHTML = orders.length ? orders.map((order) => `<article class="history-card">
    <h3>Tavolo ${order.table.number} · Ordine ${order.orderNumber}</h3>
    <p>${dateTime(order.updatedAt)} · <strong>${escapeHtml(statusConfig[order.status]?.label || order.status)}</strong></p>
    <p>Totale: <strong>${money(order.total)}</strong></p>
    <details><summary>Mostra prodotti</summary><ul>${order.items.map((item) => `<li>${item.quantity}× ${escapeHtml(item.name)}${item.preferences.map((preference) => `<small> — ${preference.quantity}× ${escapeHtml(preference.text)}</small>`).join("")}</li>`).join("")}</ul></details>
  </article>`).join("") : "<p>Nessun ordine consegnato.</p>";
}

function elapsed(value) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  return minutes < 1 ? "Adesso" : `${minutes} min`;
}
function updateElapsedTimes() {
  document.querySelectorAll("[data-created-at]").forEach((element) => {
    element.textContent = elapsed(element.dataset.createdAt);
  });
}
function playAlert() {
  if (!soundEnabled) return;
  try {
    const Context = window.AudioContext || window.webkitAudioContext;
    const context = new Context();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(.15, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001, context.currentTime + .35);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + .35);
    oscillator.addEventListener("ended", () => context.close());
  } catch {}
}

setInterval(loadOrders, 4000);
setInterval(updateElapsedTimes, 30000);
if (sessionStorage.getItem(TOKEN_KEY)) openKitchen();
else refreshSession().then((refreshed) => refreshed ? openKitchen() : goToLogin()).catch(goToLogin);
