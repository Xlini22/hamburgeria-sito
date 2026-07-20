const API_ORIGIN =
  window.BOURMET_API_URL ||
  (location.port === "5500" ? "http://localhost:3000" : location.origin);
const apiUrl = (path) => `${API_ORIGIN}${path}`;
const productImageUrl = (image) =>
  image?.path
    ? apiUrl(`/${image.path.replace(/^\/+/, "")}`)
    : "../../images/Locale/logo-bourmet.svg";
const palette = ["#bf3d29", "#ce7138", "#d2a18c", "#b96a46", "#c88b69"];
const themeColors = {
  burgers: "#bf3d29",
  sides: "#ce7138",
  desserts: "#d2a18c",
  drinks: "#637f91",
};
const categoryColor = (category, index) =>
  themeColors[category.theme] || palette[index % palette.length];

const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

function setupNavigation() {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".nav");
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
  });
  nav.querySelectorAll("a").forEach((link) =>
    link.addEventListener("click", () => {
      nav.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    }),
  );
}

function productCard(product) {
  const image = productImageUrl(product.image);
  const alt = product.image?.alt || product.name;
  return `
    <a class="menu-product ${product.isAvailable ? "" : "unavailable"}" href="../panino/panino.html?slug=${encodeURIComponent(product.slug)}">
      <img src="${escapeHtml(image)}" alt="${escapeHtml(alt)}" loading="eager"
        onerror="this.onerror=null;this.src='../../images/Locale/logo-bourmet.svg'" />
      <div class="menu-product-copy">
        <h3>${escapeHtml(product.name)}</h3>
        <span>${Number(product.price).toLocaleString("it-IT", {
          style: "currency",
          currency: "EUR",
        })}</span>
        ${product.isAvailable ? "" : '<strong class="availability-badge">Non disponibile</strong>'}
      </div>
    </a>`;
}

function renderMenu(categories) {
  const container = document.querySelector("#menu-accordions");
  if (!categories.length) {
    container.innerHTML =
      '<p class="menu-status">Nessun prodotto disponibile al momento.</p>';
    return;
  }

  container.innerHTML = categories
    .map((category, index) => {
      const color = categoryColor(category, index);
      const previousColor =
        index === 0 ? color : categoryColor(categories[index - 1], index - 1);
      const panelId = `panel-${category.slug}`;
      return `
        <article class="menu-category" style="--category-color:${escapeHtml(color)};--previous-color:${escapeHtml(previousColor)}">
          <button class="category-toggle" type="button" aria-expanded="false"
            aria-controls="${escapeHtml(panelId)}">
            <span>${escapeHtml(category.name)}</span><i aria-hidden="true"></i>
          </button>
          <div class="category-panel" id="${escapeHtml(panelId)}">
            <div class="category-panel-inner">
              <div class="menu-products">${category.products.map(productCard).join("")}</div>
            </div>
          </div>
        </article>`;
    })
    .join("");

  const last = categories.at(-1);
  const lastColor = categoryColor(last, categories.length - 1);
  document
    .querySelector(".menu-booking")
    .style.setProperty("--previous-color", lastColor);

  container.querySelectorAll(".category-toggle").forEach((button) =>
    button.addEventListener("click", () => {
      const category = button.closest(".menu-category");
      const open = !category.classList.contains("open");
      category.classList.toggle("open", open);
      button.setAttribute("aria-expanded", String(open));
    }),
  );
}

async function loadMenu() {
  try {
    const response = await fetch(apiUrl("/api/menu"));
    if (!response.ok) {
      throw new Error(
        response.status === 503 ? "database-unavailable" : "server-error",
      );
    }
    const data = await response.json();
    renderMenu(data.categories || []);
  } catch (error) {
    console.error("Impossibile caricare il menu:", error);
    document.querySelector("#menu-accordions").innerHTML =
      `<p class="menu-status menu-status-error">${
        error.message === "database-unavailable"
          ? "Il menu non è disponibile perché il database è temporaneamente offline. Riprova tra poco."
          : "Il menu non è disponibile. Verifica che il server NestJS sia avviato."
      }</p>`;
  }
}

setupNavigation();
loadMenu();
