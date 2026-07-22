const API_ORIGIN = window.BOURMET_API_URL || (location.port === "5500" ? "http://localhost:3000" : location.origin);
const apiUrl = (path) => `${API_ORIGIN}${path}`;
const fallbackImage = "../../images/Locale/logo-bourmet.svg";
const palette = ["#bf3d29", "#ce7138", "#d2a18c", "#b96a46", "#c88b69"];
const themeColors = { burgers: "#bf3d29", sides: "#ce7138", desserts: "#d2a18c", drinks: "#637f91" };
const products = new Map();
let cart = readCart();

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
}

function productCard(product) {
  products.set(String(product.id), product);
  return `<article class="menu-product order-product ${product.isAvailable ? "" : "unavailable"}">
    <a class="order-product-link" href="order-product.html?slug=${encodeURIComponent(product.slug)}" aria-label="Apri ${escapeHtml(product.name)}">
      <img src="${escapeHtml(imageUrl(product.image))}" alt="${escapeHtml(product.image?.alt || product.name)}" onerror="this.onerror=null;this.src='${fallbackImage}'" />
      <div class="menu-product-copy"><h3>${escapeHtml(product.name)}</h3><span>${money(product.price)}</span>${product.isAvailable ? "" : '<strong class="availability-badge">Non disponibile</strong>'}</div>
    </a>
    <div class="product-quantity" aria-label="Quantità di ${escapeHtml(product.name)}">
      <button type="button" data-product-delta="-1" data-product-id="${product.id}" ${product.isAvailable ? "" : "disabled"} aria-label="Riduci quantità">−</button>
      <strong data-product-quantity="${product.id}">0</strong>
      <button type="button" data-product-delta="1" data-product-id="${product.id}" ${product.isAvailable ? "" : "disabled"} aria-label="Aumenta quantità">+</button>
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
  const total = entries.reduce((sum, [id, item]) => sum + Number(products.get(id).price) * item.quantity, 0);
  document.querySelector("#cart-count").textContent = count;
  document.querySelector("#cart-total").textContent = money(total);
  document.querySelectorAll("[data-product-quantity]").forEach((element) => { element.textContent = cartItem(element.dataset.productQuantity).quantity; });
  document.querySelector("#cart-items").innerHTML = entries.length ? entries.map(([id, item]) => {
    const product = products.get(id);
    return `<article class="cart-item"><img src="${escapeHtml(imageUrl(product.image))}" alt="" /><div><h3>${escapeHtml(product.name)}</h3><span class="cart-item-price">${money(product.price)}</span>${item.preference ? `<small class="cart-preference">${escapeHtml(item.preference)}</small>` : ""}</div><div class="quantity-control"><button type="button" data-cart-change="${id}" data-delta="-1" aria-label="Rimuovi una quantità">−</button><strong>${item.quantity}</strong><button type="button" data-cart-change="${id}" data-delta="1" aria-label="Aggiungi una quantità">+</button></div></article>`;
  }).join("") : '<p class="empty-cart">Non hai ancora aggiunto prodotti.</p>';
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
document.addEventListener("keydown", (event) => { if (event.key === "Escape") setCartOpen(false); });

fetch(apiUrl("/api/menu"))
  .then((response) => { if (!response.ok) throw new Error(response.status === 503 ? "database" : "server"); return response.json(); })
  .then((data) => renderMenu(data.categories || []))
  .catch((error) => {
    document.querySelector("#menu-accordions").innerHTML = `<p class="menu-status menu-status-error">${error.message === "database" ? "Il database è temporaneamente offline." : "Il menu non è disponibile in questo momento."}</p>`;
  });
