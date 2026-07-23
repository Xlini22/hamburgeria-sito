const API_ORIGIN = window.BOURMET_API_URL || (location.port === "5500" ? "http://localhost:3000" : location.origin);
const apiUrl = (path) => `${API_ORIGIN}${path}`;
const fallbackImage = "../../images/Locale/logo-bourmet.svg";
const palette = ["#bf3d29", "#ce7138", "#d2a18c", "#b96a46", "#c88b69"];
const themeColors = { burgers: "#bf3d29", sides: "#ce7138", desserts: "#d2a18c", drinks: "#637f91" };
const products = new Map();
let cart = readCart();
let guestSession = null;
let sharedCart = null;
let orderHistory = [];
let submittingOrder = false;

const escapeHtml = (value = "") => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
const imageUrl = (image) => image?.path ? apiUrl(`/${image.path.replace(/^\/+/, "")}`) : fallbackImage;
const money = (value) => Number(value).toLocaleString("it-IT", { style: "currency", currency: "EUR" });
const categoryColor = (category, index) => themeColors[category.theme] || palette[index % palette.length];

function readCart() {
  try { return JSON.parse(sessionStorage.getItem("bourmet-order-cart")) || {}; }
  catch { return {}; }
}
function saveCart() {
  sessionStorage.setItem("bourmet-order-cart", JSON.stringify(cart));
  sharedCart = null;
  renderCart();
}
function cartItem(id) {
  const saved = cart[id];
  return typeof saved === "number"
    ? { quantity: saved, preference: "" }
    : { quantity: Number(saved?.quantity) || 0, preference: saved?.preference || "" };
}
function changeQuantity(id, delta) {
  const item = cartItem(id);
  item.quantity = Math.max(0, item.quantity + delta);
  if (item.quantity) cart[id] = item;
  else delete cart[id];
  saveCart();
  syncCartItem(id);
}

async function syncCartItem(id) {
  if (!guestSession) return;
  const item = cartItem(id);
  try {
    const response = await fetch(apiUrl(`/api/guest/cart/items/${id}`), {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });
    if (response.status === 401 || response.status === 403) {
      showTableAccessGate(true);
      return;
    }
    if (response.ok) await refreshSharedOrder();
  } catch {
    // Il carrello locale resta utilizzabile e verrà risincronizzato al prossimo cambio.
  }
}

async function loadGuestCart() {
  const response = await fetch(apiUrl("/api/guest/cart"), {
    credentials: "include",
  });
  if (!response.ok) return;
  const saved = await response.json();
  cart = Object.fromEntries(
    saved.items.map((item) => [
      String(item.productId),
      { quantity: item.quantity, preference: item.preference || "" },
    ]),
  );
  sessionStorage.setItem("bourmet-order-cart", JSON.stringify(cart));
}

function productCard(product) {
  products.set(String(product.id), product);
  const canOrder = product.isAvailable && guestSession;
  return `<article class="menu-product order-product ${product.isAvailable ? "" : "unavailable"}">
    <a class="order-product-link" href="order-product.html?slug=${encodeURIComponent(product.slug)}" aria-label="Apri ${escapeHtml(product.name)}">
      <img src="${escapeHtml(imageUrl(product.image))}" alt="${escapeHtml(product.image?.alt || product.name)}" onerror="this.onerror=null;this.src='${fallbackImage}'" />
      <div class="menu-product-copy"><h3>${escapeHtml(product.name)}</h3><span>${money(product.price)}</span>${product.isAvailable ? "" : '<strong class="availability-badge">Non disponibile</strong>'}</div>
    </a>
    <div class="product-quantity" aria-label="Quantità di ${escapeHtml(product.name)}">
      <button type="button" data-product-delta="-1" data-product-id="${product.id}" ${canOrder ? "" : "disabled"} aria-label="Riduci quantità">−</button>
      <strong data-product-quantity="${product.id}">0</strong>
      <button type="button" data-product-delta="1" data-product-id="${product.id}" ${canOrder ? "" : "disabled"} aria-label="Aumenta quantità">+</button>
    </div>
  </article>`;
}

function renderMenu(categories) {
  const container = document.querySelector("#menu-accordions");
  if (!categories.length) { container.innerHTML = '<p class="menu-status">Nessun prodotto disponibile al momento.</p>'; return; }
  container.innerHTML = categories.map((category, index) => {
    const color = categoryColor(category, index);
    const previous = index ? categoryColor(categories[index - 1], index - 1) : color;
    const panelId = `order-panel-${category.slug}`;
    return `<article class="menu-category" style="--category-color:${escapeHtml(color)};--previous-color:${escapeHtml(previous)}">
      <button class="category-toggle" type="button" aria-expanded="false" aria-controls="${escapeHtml(panelId)}"><span>${escapeHtml(category.name)}</span><i aria-hidden="true"></i></button>
      <div class="category-panel" id="${escapeHtml(panelId)}"><div class="category-panel-inner"><div class="menu-products">${category.products.map(productCard).join("")}</div></div></div>
    </article>`;
  }).join("");
  container.querySelectorAll(".category-toggle").forEach((button) => button.addEventListener("click", () => {
    const category = button.closest(".menu-category");
    const open = !category.classList.contains("open");
    category.classList.toggle("open", open);
    button.setAttribute("aria-expanded", String(open));
  }));
  container.addEventListener("click", (event) => {
    const button = event.target.closest("[data-product-delta]");
    if (!button) return;
    changeQuantity(button.dataset.productId, Number(button.dataset.productDelta));
  });
  renderCart();
}

function renderCart() {
  const entries = Object.keys(cart).map((id) => [id, cartItem(id)]).filter(([id, item]) => item.quantity > 0 && products.has(id));
  const count = entries.reduce((sum, [, item]) => sum + item.quantity, 0);
  document.querySelector("#cart-count").textContent = count;
  document.querySelectorAll("[data-product-quantity]").forEach((element) => { element.textContent = cartItem(element.dataset.productQuantity).quantity; });
  if (!sharedCart) {
    const total = entries.reduce((sum, [id, item]) => sum + Number(products.get(id).price) * item.quantity, 0);
    document.querySelector("#cart-total").textContent = money(total);
    document.querySelector("#cart-items").innerHTML = entries.length
      ? renderLocalItems(entries)
      : '<p class="empty-cart">Non hai ancora aggiunto prodotti.</p>';
    updateOrderButtons(false, false);
    return;
  }
  const guests = [...sharedCart.guests].sort((a, b) => Number(b.isCurrent) - Number(a.isCurrent));
  document.querySelector("#cart-total").textContent = money(sharedCart.total);
  const guestMarkup = guests.map((guest) => {
    const items = guest.items.length
      ? guest.items.map((item) => renderSharedItem(item, guest.isCurrent)).join("")
      : '<p class="empty-cart">Nessun prodotto nel carrello.</p>';
    return `<section class="guest-cart">
      <div class="guest-cart-heading"><h3>${guest.isCurrent ? "Il tuo carrello" : escapeHtml(guest.name)}</h3>
        <span class="guest-state ${guest.ready ? "ready" : ""}">${guest.ready ? "Pronto" : "Sta scegliendo"}</span>
      </div>
      ${items}
      <p class="guest-subtotal"><span>Subtotale</span><strong>${money(guest.total)}</strong></p>
    </section>`;
  }).join("");
  document.querySelector("#cart-items").innerHTML =
    guestMarkup + renderOrderHistory();
  const current = guests.find((guest) => guest.isCurrent);
  updateOrderButtons(Boolean(current?.items.length), Boolean(current?.ready));
}

function renderLocalItems(entries) {
  return entries.map(([id, item]) => {
    const product = products.get(id);
    return `<article class="cart-item"><img src="${escapeHtml(imageUrl(product.image))}" alt="" /><div><h3>${escapeHtml(product.name)}</h3><span class="cart-item-price">${money(product.price)}</span>${item.preference ? `<small class="cart-preference">${escapeHtml(item.preference)}</small>` : ""}</div><div class="quantity-control"><button type="button" data-cart-change="${id}" data-delta="-1" ${guestSession ? "" : "disabled"} aria-label="Rimuovi una quantità">−</button><strong>${item.quantity}</strong><button type="button" data-cart-change="${id}" data-delta="1" ${guestSession ? "" : "disabled"} aria-label="Aggiungi una quantità">+</button></div></article>`;
  }).join("");
}

function renderSharedItem(item, editable) {
  const image = item.imagePath ? apiUrl(`/${String(item.imagePath).replace(/^\/+/, "")}`) : fallbackImage;
  return `<article class="cart-item"><img src="${escapeHtml(image)}" alt="" /><div><h3>${escapeHtml(item.name)}</h3><span class="cart-item-price">${money(item.unitPrice)}</span>${item.preference ? `<small class="cart-preference">${escapeHtml(item.preference)}</small>` : ""}</div>${editable ? `<div class="quantity-control"><button type="button" data-cart-change="${item.productId}" data-delta="-1" aria-label="Rimuovi una quantità">−</button><strong>${item.quantity}</strong><button type="button" data-cart-change="${item.productId}" data-delta="1" aria-label="Aggiungi una quantità">+</button></div>` : `<strong>× ${item.quantity}</strong>`}</article>`;
}

function renderOrderHistory() {
  if (!orderHistory.length) return "";
  return `<section class="order-history"><h3>Ordini precedenti</h3>${orderHistory.map((order) =>
    `<details class="history-order"><summary>Ordine ${order.orderNumber} · ${money(order.total)} · ${escapeHtml(order.status)}</summary><ul>${order.items.map((item) =>
      `<li>${item.quantity}× ${escapeHtml(item.name)} — ${money(item.subtotal)}${item.preferences.map((entry) => `<small>${entry.quantity}× ${escapeHtml(entry.preference)}</small>`).join("")}</li>`
    ).join("")}</ul></details>`
  ).join("")}</section>`;
}

function updateOrderButtons(hasOwnItems, ready) {
  const readyButton = document.querySelector("#ready-order");
  const submitButton = document.querySelector("#submit-order");
  readyButton.disabled = !guestSession || !hasOwnItems || submittingOrder;
  readyButton.classList.toggle("is-ready", ready);
  readyButton.textContent = ready ? "Torna a scegliere" : "Sono pronto";
  submitButton.disabled = !guestSession || !sharedCart?.guests.some((guest) => guest.items.length) || submittingOrder;
}

async function refreshSharedOrder() {
  if (!guestSession) return;
  const [cartResponse, historyResponse] = await Promise.all([
    fetch(apiUrl("/api/guest/table-cart"), { credentials: "include" }),
    fetch(apiUrl("/api/guest/orders"), { credentials: "include" }),
  ]);
  if (cartResponse.status === 401 || cartResponse.status === 403) {
    showTableAccessGate(true);
    return;
  }
  if (!cartResponse.ok) return;
  sharedCart = await cartResponse.json();
  if (historyResponse.ok) orderHistory = await historyResponse.json();
  const own = sharedCart.guests.find((guest) => guest.isCurrent);
  if (own) {
    updateGuestNameInput(own.name);
    cart = Object.fromEntries(own.items.map((item) => [String(item.productId), {
      quantity: item.quantity,
      preference: item.preference || "",
    }]));
    sessionStorage.setItem("bourmet-order-cart", JSON.stringify(cart));
  }
  renderCart();
}

function setCartOpen(open) {
  document.body.classList.toggle("cart-open", open);
  document.querySelector("#order-cart").setAttribute("aria-hidden", String(!open));
  document.querySelector(".cart-trigger").setAttribute("aria-expanded", String(open));
}
document.querySelector(".cart-trigger").addEventListener("click", () => setCartOpen(true));
document.querySelectorAll("[data-close-cart]").forEach((element) => element.addEventListener("click", () => setCartOpen(false)));
document.querySelector("#cart-items").addEventListener("click", (event) => {
  const button = event.target.closest("[data-cart-change]");
  if (!button) return;
  const id = button.dataset.cartChange;
  changeQuantity(id, Number(button.dataset.delta));
});
document.querySelector("#ready-order").addEventListener("click", async () => {
  const current = sharedCart?.guests.find((guest) => guest.isCurrent);
  if (!current) return;
  setFeedback("");
  const response = await fetch(apiUrl("/api/guest/readiness"), {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ready: !current.ready }),
  });
  if (!response.ok) {
    setFeedback(await responseMessage(response));
    return;
  }
  sharedCart = await response.json();
  renderCart();
});
document.querySelector("#submit-order").addEventListener("click", () => submitTableOrder(false));
const guestNameInput = document.querySelector("#guest-name");
guestNameInput.addEventListener("input", () => {
  guestNameInput.dataset.dirty = String(guestNameInput.value !== guestNameInput.dataset.savedName);
});
document.querySelector("#guest-name-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const name = guestNameInput.value.trim().replace(/\s+/g, " ");
  if (!name) return;
  setFeedback("Salvataggio del nome…");
  const response = await fetch(apiUrl("/api/guest/name"), {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!response.ok) {
    setFeedback(await responseMessage(response));
    return;
  }
  const saved = await response.json();
  guestNameInput.value = saved.name;
  guestNameInput.dataset.savedName = saved.name;
  guestNameInput.dataset.dirty = "false";
  if (guestSession) guestSession.guestName = saved.name;
  setFeedback("Nome aggiornato.");
  await refreshSharedOrder();
});
document.addEventListener("keydown", (event) => { if (event.key === "Escape") setCartOpen(false); });

async function submitTableOrder(confirmNotReady) {
  if (submittingOrder) return;
  submittingOrder = true;
  setFeedback("Invio dell’ordine…");
  updateOrderButtons(false, false);
  try {
    const response = await fetch(apiUrl("/api/guest/orders"), {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        idempotencyKey: crypto.randomUUID(),
        confirmNotReady,
      }),
    });
    const body = await response.json().catch(() => ({}));
    const conflict = body.code === "GUESTS_NOT_READY" ? body : body.message;
    if (response.status === 409 && conflict?.code === "GUESTS_NOT_READY") {
      const guests = conflict.guests.join(", ");
      if (confirm(`${guests} ${conflict.guests.length === 1 ? "sta" : "stanno"} ancora scegliendo. Vuoi inviare comunque tutto l’ordine del tavolo?`)) {
        submittingOrder = false;
        return submitTableOrder(true);
      }
      setFeedback("Invio annullato.");
      return;
    }
    if (!response.ok) {
      setFeedback(typeof body.message === "string" ? body.message : "Non è stato possibile inviare l’ordine.");
      return;
    }
    cart = {};
    sharedCart = null;
    sessionStorage.removeItem("bourmet-order-cart");
    setFeedback(`Ordine ${body.orderNumber} inviato alla cucina.`);
    await refreshSharedOrder();
  } catch {
    setFeedback("Server non raggiungibile: l’ordine non è stato inviato.");
  } finally {
    submittingOrder = false;
    renderCart();
  }
}

function setFeedback(message) {
  document.querySelector("#cart-feedback").textContent = message;
}

async function responseMessage(response) {
  const body = await response.json().catch(() => ({}));
  return typeof body.message === "string" ? body.message : "Operazione non riuscita.";
}

function showTableAccessGate(clearCart = false) {
  guestSession = null;
  document.querySelector("#table-name").textContent = "QR richiesto";
  document.querySelector("#order-session-message").textContent =
    "Scansiona il QR del tavolo per ordinare";
  document.querySelector("#order-content").hidden = true;
  document.querySelector("#table-access-gate").hidden = false;
  document.body.classList.add("table-session-missing");
  setCartOpen(false);
  if (clearCart) {
    cart = {};
    sessionStorage.removeItem("bourmet-order-cart");
    renderCart();
  }
}

function showTableOrder(session) {
  guestSession = session;
  updateGuestNameInput(session.guestName);
  document.querySelector("#table-name").textContent =
    `Tavolo ${session.table.number}`;
  document.querySelector("#order-session-message").textContent =
    `Connesso al tavolo ${session.table.number}`;
  document.querySelector("#table-access-gate").hidden = true;
  document.querySelector("#order-content").hidden = false;
  document.body.classList.remove("table-session-missing");
}

function updateGuestNameInput(name) {
  const input = document.querySelector("#guest-name");
  if (!input || document.activeElement === input || input.dataset.dirty === "true") return;
  input.value = name || "";
  input.dataset.savedName = name || "";
  input.dataset.dirty = "false";
}

async function loadGuestSession() {
  try {
    const response = await fetch(apiUrl("/api/guest/session"), { credentials: "include" });
    if (response.status === 401 || response.status === 403) {
      showTableAccessGate(Boolean(guestSession));
      return false;
    }
    if (!response.ok) {
      if (!guestSession) showTableAccessGate();
      return false;
    }
    showTableOrder(await response.json());
    return true;
  } catch {
    if (!guestSession) showTableAccessGate();
    return false;
  }
}

loadGuestSession()
  .then(async (connected) => {
    if (!connected) return;
    await loadGuestCart();
    const response = await fetch(apiUrl("/api/menu"));
    if (!response.ok) {
      throw new Error(response.status === 503 ? "database" : "server");
    }
    const data = await response.json();
    renderMenu(data.categories || []);
    await refreshSharedOrder();
  })
  .catch((error) => {
    document.querySelector("#menu-accordions").innerHTML = `<p class="menu-status menu-status-error">${error.message === "database" ? "Il database è temporaneamente offline." : "Il menu non è disponibile in questo momento."}</p>`;
  });

setInterval(() => {
  if (guestSession && !document.hidden) {
    loadGuestSession();
    refreshSharedOrder().catch(() => undefined);
  }
}, 4000);
