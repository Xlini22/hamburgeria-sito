let orderedProduct = null;
const cartKey = "bourmet-order-cart";
const quantityElement = document.querySelector("#detail-quantity");
const minusButton = document.querySelector("#detail-minus");
const plusButton = document.querySelector("#detail-plus");
const preferenceInput = document.querySelector("#product-preference");
const preferenceStatus = document.querySelector("#preference-status");
let preferenceTimer = null;
const orderProductCatalog = new Map();

const orderEscape = (value = "") => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
const orderMoney = (value) => Number(value).toLocaleString("it-IT", { style: "currency", currency: "EUR" });
const orderImage = (product) => {
  const image = product?.image || product?.images?.[0];
  return image?.path ? apiUrl(`/${image.path.replace(/^\/+/, "")}`) : "../../images/Locale/logo-bourmet.svg";
};

function readOrderCart() {
  try { return JSON.parse(sessionStorage.getItem(cartKey)) || {}; }
  catch { return {}; }
}
function currentItem() {
  if (!orderedProduct) return { quantity: 0, preference: "" };
  const saved = readOrderCart()[orderedProduct.id];
  return typeof saved === "number" ? { quantity: saved, preference: "" } : { quantity: Number(saved?.quantity) || 0, preference: saved?.preference || "" };
}
function saveItem(item) {
  if (!orderedProduct) return;
  const cart = readOrderCart();
  if (item.quantity > 0 || item.preference.trim()) cart[orderedProduct.id] = item;
  else delete cart[orderedProduct.id];
  sessionStorage.setItem(cartKey, JSON.stringify(cart));
  quantityElement.textContent = item.quantity;
  renderOrderCart();
}
function changeQuantity(delta) {
  const item = currentItem();
  item.quantity = Math.max(0, item.quantity + delta);
  saveItem(item);
}

window.addEventListener("bourmet:product-loaded", (event) => {
  orderedProduct = event.detail;
  orderProductCatalog.set(String(orderedProduct.id), orderedProduct);
  const item = currentItem();
  quantityElement.textContent = item.quantity;
  preferenceInput.value = item.preference;
  const enabled = orderedProduct.isAvailable;
  minusButton.disabled = !enabled;
  plusButton.disabled = !enabled;
  preferenceInput.disabled = !enabled;
  if (!enabled) preferenceStatus.textContent = "Il prodotto non è attualmente ordinabile.";
  renderOrderCart();
  loadOrderCatalog();
});
minusButton.addEventListener("click", () => changeQuantity(-1));
plusButton.addEventListener("click", () => changeQuantity(1));
preferenceInput.addEventListener("input", () => {
  const item = currentItem();
  item.preference = preferenceInput.value;
  saveItem(item);
  preferenceStatus.textContent = "Salvataggio…";
  clearTimeout(preferenceTimer);
  preferenceTimer = setTimeout(() => { preferenceStatus.textContent = "Preferenza salvata nel carrello."; }, 350);
});

function renderOrderCart() {
  const cart = readOrderCart();
  const entries = Object.keys(cart).map((id) => [id, typeof cart[id] === "number" ? { quantity: cart[id], preference: "" } : cart[id]]).filter(([, item]) => Number(item?.quantity) > 0);
  const visibleEntries = entries.filter(([id]) => orderProductCatalog.has(String(id)));
  const count = entries.reduce((sum, [, item]) => sum + Number(item.quantity), 0);
  const total = visibleEntries.reduce((sum, [id, item]) => sum + Number(orderProductCatalog.get(String(id)).price) * Number(item.quantity), 0);
  document.querySelector("#cart-count").textContent = count;
  document.querySelector("#cart-total").textContent = orderMoney(total);
  document.querySelector("#cart-items").innerHTML = visibleEntries.length
    ? visibleEntries.map(([id, item]) => {
        const product = orderProductCatalog.get(String(id));
        return `<article class="cart-item"><img src="${orderEscape(orderImage(product))}" alt="" /><div><h3>${orderEscape(product.name)}</h3><span class="cart-item-price">${orderMoney(product.price)}</span>${item.preference ? `<small class="cart-preference">${orderEscape(item.preference)}</small>` : ""}</div><div class="quantity-control"><button type="button" data-cart-change="${id}" data-delta="-1" aria-label="Rimuovi una quantità">−</button><strong>${Number(item.quantity)}</strong><button type="button" data-cart-change="${id}" data-delta="1" aria-label="Aggiungi una quantità">+</button></div></article>`;
      }).join("")
    : '<p class="empty-cart">Non hai ancora aggiunto prodotti.</p>';
}

async function loadOrderCatalog() {
  try {
    const response = await fetch(apiUrl("/api/menu"));
    if (!response.ok) return;
    const data = await response.json();
    (data.categories || []).forEach((category) => category.products.forEach((product) => orderProductCatalog.set(String(product.id), product)));
    renderOrderCart();
  } catch {
    renderOrderCart();
  }
}

function setOrderCartOpen(open) {
  document.body.classList.toggle("cart-open", open);
  document.querySelector("#order-cart").setAttribute("aria-hidden", String(!open));
  document.querySelector(".cart-trigger").setAttribute("aria-expanded", String(open));
}
document.querySelector(".cart-trigger").addEventListener("click", () => setOrderCartOpen(true));
document.querySelectorAll("[data-close-cart]").forEach((element) => element.addEventListener("click", () => setOrderCartOpen(false)));
document.querySelector("#cart-items").addEventListener("click", (event) => {
  const button = event.target.closest("[data-cart-change]");
  if (!button) return;
  const cart = readOrderCart();
  const id = button.dataset.cartChange;
  const saved = typeof cart[id] === "number" ? { quantity: cart[id], preference: "" } : { quantity: Number(cart[id]?.quantity) || 0, preference: cart[id]?.preference || "" };
  saved.quantity = Math.max(0, saved.quantity + Number(button.dataset.delta));
  if (saved.quantity) cart[id] = saved;
  else delete cart[id];
  sessionStorage.setItem(cartKey, JSON.stringify(cart));
  if (orderedProduct && String(orderedProduct.id) === id) quantityElement.textContent = saved.quantity;
  renderOrderCart();
});
document.addEventListener("keydown", (event) => { if (event.key === "Escape") setOrderCartOpen(false); });
