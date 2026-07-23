const API_ORIGIN =
  window.BOURMET_API_URL ||
  (location.port === "5500" ? "http://localhost:3000" : location.origin);
const apiUrl = (path) => `${API_ORIGIN}${path}`;
const ACCESS_TOKEN_KEY = "bourmet_admin_access_token";
const LEGACY_REFRESH_TOKEN_KEY = "bourmet_admin_refresh_token";

const loginView = document.querySelector("#login-view");
const dashboardView = document.querySelector("#dashboard-view");
const loginForm = document.querySelector("#login-form");
const loginButton = document.querySelector("#login-button");
const loginMessage = document.querySelector("#login-message");
const logoutButton = document.querySelector("#logout-button");
const productsManager = document.querySelector("#products-manager");
const categoriesManager = document.querySelector("#categories-manager");
const bestSellersManager = document.querySelector("#best-sellers-manager");
const usersManager = document.querySelector("#users-manager");
const tablesManager = document.querySelector("#tables-manager");
const auditManager = document.querySelector("#audit-manager");
const managerSections = [
  productsManager,
  categoriesManager,
  bestSellersManager,
  usersManager,
  tablesManager,
  auditManager,
];
const managerButtons = [
  document.querySelector("#open-products"),
  document.querySelector("#open-categories"),
  document.querySelector("#open-best-sellers"),
  document.querySelector("#open-users"),
  document.querySelector("#open-tables"),
  document.querySelector("#open-audit"),
];
const productsList = document.querySelector("#products-list");
const categoriesList = document.querySelector("#categories-list");
const productsMessage = document.querySelector("#products-message");
const productDialog = document.querySelector("#product-dialog");
const productForm = document.querySelector("#product-form");
const ingredientDialog = document.querySelector("#ingredient-dialog");
const ingredientForm = document.querySelector("#ingredient-form");
const allergenDialog = document.querySelector("#allergen-dialog");
const allergenForm = document.querySelector("#allergen-form");
const categoryDialog = document.querySelector("#category-dialog");
const categoryForm = document.querySelector("#category-form");
const userDialog = document.querySelector("#user-dialog");
const userForm = document.querySelector("#user-form");
let adminProducts = [];
let adminCategories = [];
let adminIngredients = [];
let adminAllergens = [];
let previewObjectUrl = null;
let bestSellerDraft = [];
let currentImageHistory = [];
let adminUsers = [];
let adminTables = [];
let allergenSelectionTarget = "new";
let currentUserRole = "";
const auditPageSize = 20;
let auditOffset = 0;
let auditTotal = 0;
const categoryThemeColors = {
  burgers: "#bf3d29",
  sides: "#ce7138",
  desserts: "#d2a18c",
  drinks: "#637f91",
};

function saveTokens(tokens) {
  sessionStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token);
  localStorage.removeItem(LEGACY_REFRESH_TOKEN_KEY);
}

function clearTokens() {
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(LEGACY_REFRESH_TOKEN_KEY);
}

async function refreshSession() {
  const response = await fetch(apiUrl("/api/auth/refresh"), {
    method: "POST",
    credentials: "include",
  });
  if (!response.ok) return false;
  saveTokens(await response.json());
  return true;
}

async function authenticatedFetch(path, options = {}, canRefresh = true) {
  const token = sessionStorage.getItem(ACCESS_TOKEN_KEY);
  const response = await fetch(apiUrl(path), {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });
  if (response.status === 401 && canRefresh && (await refreshSession())) {
    return authenticatedFetch(path, options, false);
  }
  return response;
}

function showLogin(message = "") {
  dashboardView.hidden = true;
  closeManagers();
  loginView.hidden = false;
  logoutButton.hidden = true;
  loginMessage.textContent = message;
  loginMessage.classList.toggle("error", Boolean(message));
}

function closeManagers() {
  managerSections.forEach((manager) => {
    manager.hidden = true;
  });
  managerButtons.forEach((button) => {
    button.setAttribute("aria-expanded", "false");
    button.closest("article")?.classList.remove("manager-active");
  });
}

function openManager(manager, button) {
  closeManagers();
  manager.hidden = false;
  button.setAttribute("aria-expanded", "true");
  button.closest("article")?.classList.add("manager-active");
  manager.scrollIntoView({ behavior: "smooth", block: "start" });
}

const auditActionLabels = {
  "product.create": "Prodotto creato",
  "product.update": "Prodotto modificato",
  "category.create": "Categoria creata",
  "category.update": "Categoria modificata",
  "category.delete": "Categoria eliminata",
  "ingredient.create": "Ingrediente creato",
  "ingredient.update": "Ingrediente modificato",
  "ingredient.delete": "Ingrediente eliminato",
  "allergen.create": "Allergene creato",
  "allergen.delete": "Allergene eliminato",
  "user.create": "Utente creato",
  "user.update": "Utente modificato",
  "table.create": "Tavolo creato",
  "table.update": "Tavolo modificato",
  "table.session-open": "Sessione tavolo aperta",
  "table.session-close": "Sessione tavolo chiusa",
  "table.token-regenerate": "QR del tavolo rigenerato",
  "best-sellers.update": "Best seller aggiornati",
  "image.upload": "Immagine caricata",
  "image.primary": "Immagine principale cambiata",
  "image.visibility": "Visibilità immagine modificata",
  "images.reorder": "Immagini riordinate",
  "image.delete": "Immagine eliminata",
  "audit.restore": "Modifica ripristinata",
};

const auditResourceLabels = {
  product: "Prodotto",
  category: "Categoria",
  ingredient: "Ingrediente",
  allergen: "Allergene",
  user: "Utente",
  table: "Tavolo",
  "best-sellers": "Best seller",
};

const auditFieldLabels = {
  name: "Nome",
  username: "Username",
  slug: "Indirizzo (slug)",
  description: "Descrizione",
  base_price: "Prezzo base",
  sale_price: "Prezzo scontato",
  is_active: "Stato",
  is_available: "Disponibilità",
  is_best_seller: "Presenza nei best seller",
  best_seller_order: "Posizione nei best seller",
  display_order: "Ordine nel menu",
  role: "Ruolo",
  tableNumber: "Numero tavolo",
  openSessionId: "Sessione aperta",
  openedAt: "Aperta il",
  theme: "Stile della categoria",
  sort_order: "Posizione immagine",
  is_visible: "Visibilità immagine",
  alt_text: "Testo alternativo",
  image_path: "File immagine",
};

function auditResourceName(entry) {
  if (entry.resourceType === "best-sellers") return "Carosello della homepage";
  return entry.after?.name || entry.after?.username || entry.before?.name ||
    entry.before?.username || null;
}

function auditResourceTitle(entry) {
  const type =
    auditResourceLabels[entry.resourceType] || entry.resourceType || "Risorsa";
  const name = auditResourceName(entry);
  const id = entry.resourceId ? `#${entry.resourceId}` : "";
  return name ? `${type}: ${name} ${id}`.trim() : `${type} ${id}`.trim();
}

function auditBooleanValue(field, value) {
  const enabled = Boolean(Number(value));
  if (field === "is_available")
    return enabled ? "Disponibile" : "Non disponibile";
  if (field === "is_best_seller")
    return enabled ? "Presente" : "Non presente";
  if (field === "is_visible") return enabled ? "Visibile" : "Nascosta";
  return enabled ? "Attivo" : "Disattivato";
}

function auditValue(field, value) {
  if (value === null || value === undefined || value === "") return "Nessuno";
  if (["is_active", "is_available", "is_best_seller", "is_visible"].includes(field)) {
    return auditBooleanValue(field, value);
  }
  if (["base_price", "sale_price"].includes(field)) return formatPrice(value);
  if (field === "role") {
    return (
      { admin: "Amministratore", editor: "Editor", viewer: "Visualizzatore" }[
        value
      ] || String(value)
    );
  }
  if (field === "theme") {
    return (
      {
        burgers: "Hamburger",
        sides: "Fritti e insalate",
        desserts: "Dolci",
        drinks: "Bevande",
      }[value] || String(value)
    );
  }
  return String(value);
}

function auditItemName(item) {
  if (typeof item !== "object" || item === null) return String(item);
  return item.name || item.alt_text || item.image_path || `Elemento #${item.id}`;
}

function auditArrayChanges(label, before = [], after = []) {
  const beforeNames = before.map(auditItemName);
  const afterNames = after.map(auditItemName);
  const added = afterNames.filter((name) => !beforeNames.includes(name));
  const removed = beforeNames.filter((name) => !afterNames.includes(name));
  const changes = [
    ...added.map((name) => ({
      label,
      kind: "added",
      message: `Aggiunto: ${name}`,
    })),
    ...removed.map((name) => ({
      label,
      kind: "removed",
      message: `Rimosso: ${name}`,
    })),
  ];
  if (
    !added.length &&
    !removed.length &&
    beforeNames.join("|") !== afterNames.join("|")
  ) {
    changes.push({
      label,
      kind: "changed",
      message: `Ordine modificato: ${afterNames.join(", ")}`,
    });
  }
  return changes;
}

function auditImageChanges(before = [], after = []) {
  const changes = auditArrayChanges("Immagini", before, after);
  const beforeById = new Map(before.map((image) => [image.id, image]));
  after.forEach((image) => {
    const previous = beforeById.get(image.id);
    if (!previous) return;
    ["sort_order", "is_visible", "alt_text", "image_path"].forEach((field) => {
      if (previous[field] === image[field]) return;
      changes.push({
        label: `Immagine “${auditItemName(image)}” · ${auditFieldLabels[field]}`,
        kind: "changed",
        before: auditValue(field, previous[field]),
        after: auditValue(field, image[field]),
      });
    });
  });
  return changes;
}

function describeAuditChanges(entry) {
  if (entry.before === null && entry.after !== null) {
    return [
      {
        label: auditResourceLabels[entry.resourceType] || "Risorsa",
        kind: "added",
        message: `Creato: ${auditResourceName(entry) || `#${entry.resourceId}`}`,
      },
    ];
  }
  if (entry.before !== null && entry.after === null) {
    return [
      {
        label: auditResourceLabels[entry.resourceType] || "Risorsa",
        kind: "removed",
        message: `Eliminato: ${auditResourceName(entry) || `#${entry.resourceId}`}`,
      },
    ];
  }
  if (!entry.before || !entry.after) return [];

  if (Array.isArray(entry.before) && Array.isArray(entry.after)) {
    return auditArrayChanges("Best seller", entry.before, entry.after);
  }

  const changes = [];
  const arrayFields = {
    categories: "Categorie",
    ingredients: "Ingredienti",
    allergens: "Allergeni",
    products: "Prodotti collegati",
  };
  Object.entries(arrayFields).forEach(([field, label]) => {
    changes.push(
      ...auditArrayChanges(label, entry.before[field], entry.after[field]),
    );
  });
  changes.push(
    ...auditImageChanges(entry.before.images || [], entry.after.images || []),
  );

  const ignoredFields = new Set([
    "id",
    "created_at",
    "updated_at",
    "product_count",
    ...Object.keys(arrayFields),
    "images",
  ]);
  const fields = new Set([
    ...Object.keys(entry.before),
    ...Object.keys(entry.after),
  ]);
  fields.forEach((field) => {
    if (ignoredFields.has(field)) return;
    if (JSON.stringify(entry.before[field]) === JSON.stringify(entry.after[field]))
      return;
    changes.push({
      label: auditFieldLabels[field] || field,
      kind: "changed",
      before: auditValue(field, entry.before[field]),
      after: auditValue(field, entry.after[field]),
    });
  });
  return changes;
}

function renderAuditChanges(entry) {
  const changes = describeAuditChanges(entry);
  if (!changes.length) {
    return '<p class="audit-no-change">Nessuna variazione visibile nei dati principali.</p>';
  }
  return `<ul class="audit-change-list">${changes
    .map(
      (change) => `
        <li class="audit-change audit-change-${change.kind}">
          <strong>${escapeHtml(change.label)}</strong>
          ${
            change.message
              ? `<span>${escapeHtml(change.message)}</span>`
              : `<span>
                  da <del>${escapeHtml(change.before)}</del>
                  a <ins>${escapeHtml(change.after)}</ins>
                </span>`
          }
        </li>`,
    )
    .join("")}</ul>`;
}

function auditSnapshot(value) {
  return value === null
    ? "Nessun valore"
    : JSON.stringify(value, null, 2);
}

function renderAuditLog(entries) {
  const list = document.querySelector("#audit-list");
  list.innerHTML = entries.length
    ? entries
        .map(
          (entry) => `
            <article class="audit-row">
              <div class="audit-row-heading">
                <div>
                  <strong>${escapeHtml(auditActionLabels[entry.action] || entry.action)}</strong>
                  <span>${escapeHtml(auditResourceTitle(entry))}</span>
                </div>
                <time datetime="${escapeHtml(entry.createdAt)}">
                  ${escapeHtml(new Date(entry.createdAt).toLocaleString("it-IT"))}
                </time>
              </div>
              <p>
                Eseguito da <b>${escapeHtml(entry.username)}</b>
                (${escapeHtml(entry.userRole)})
                ${entry.ipAddress ? ` · IP ${escapeHtml(entry.ipAddress)}` : ""}
              </p>
              <div class="audit-actions">
                ${
                  entry.source === "archive"
                    ? '<span class="audit-archived">Archiviata</span>'
                    : ""
                }
                ${
                  entry.restoredAt
                    ? `<span class="audit-restored">
                        Ripristinata il ${escapeHtml(
                          new Date(entry.restoredAt).toLocaleString("it-IT"),
                        )}
                      </span>`
                    : entry.canRestore
                      ? `<button
                          class="audit-restore-button"
                          type="button"
                          data-audit-id="${entry.id}"
                          data-resource="${escapeHtml(auditResourceTitle(entry))}">
                          Ripristina stato precedente
                        </button>`
                      : ""
                }
              </div>
              <div class="audit-change-summary">
                <h3>Cosa è cambiato</h3>
                ${renderAuditChanges(entry)}
              </div>
              <details>
                <summary>Mostra dettagli tecnici completi</summary>
                <div class="audit-comparison">
                  <section>
                    <h3>Prima</h3>
                    <pre>${escapeHtml(auditSnapshot(entry.before))}</pre>
                  </section>
                  <section>
                    <h3>Dopo</h3>
                    <pre>${escapeHtml(auditSnapshot(entry.after))}</pre>
                  </section>
                </div>
              </details>
            </article>`,
        )
        .join("")
    : '<p class="manager-message">Non sono ancora state registrate modifiche.</p>';
}

async function loadAuditLog() {
  const message = document.querySelector("#audit-message");
  message.textContent = "Caricamento cronologia…";
  const params = new URLSearchParams({
    limit: String(auditPageSize),
    offset: String(auditOffset),
    source: document.querySelector("#audit-source-filter").value,
  });
  const filters = {
    username: document.querySelector("#audit-user-filter").value.trim(),
    product: document.querySelector("#audit-product-filter").value.trim(),
    action: document.querySelector("#audit-action-filter").value,
    dateFrom: document.querySelector("#audit-date-from").value,
    dateTo: document.querySelector("#audit-date-to").value,
  };
  Object.entries(filters).forEach(([key, value]) => {
    if (!value) return;
    if (key === "dateFrom") params.set(key, `${value}T00:00:00`);
    else if (key === "dateTo") params.set(key, `${value}T23:59:59.999`);
    else params.set(key, value);
  });
  const response = await authenticatedFetch(`/api/admin/audit?${params}`);
  if (!response.ok) throw new Error("Impossibile caricare la cronologia");
  const data = await response.json();
  auditTotal = data.total;
  const first = data.total ? auditOffset + 1 : 0;
  const last = Math.min(auditOffset + data.items.length, data.total);
  message.textContent = `${data.total} modifiche trovate · visualizzate ${first}–${last}`;
  renderAuditLog(data.items || []);
  const page = Math.floor(auditOffset / auditPageSize) + 1;
  const pages = Math.max(1, Math.ceil(data.total / auditPageSize));
  document.querySelector("#audit-page-label").textContent =
    `Pagina ${page} di ${pages}`;
  document.querySelector("#audit-previous-page").disabled = auditOffset === 0;
  document.querySelector("#audit-next-page").disabled = !data.hasMore;
}

document.querySelector("#audit-list").addEventListener("click", async (event) => {
  const button = event.target.closest(".audit-restore-button");
  if (!button) return;
  const resource = button.dataset.resource || "questa risorsa";
  if (
    !confirm(
      `Vuoi ripristinare lo stato precedente di “${resource}”?\n\nIl ripristino verrà registrato nella cronologia.`,
    )
  ) {
    return;
  }

  const message = document.querySelector("#audit-message");
  button.disabled = true;
  message.textContent = "Ripristino in corso…";
  try {
    const response = await authenticatedFetch(
      `/api/admin/audit/${button.dataset.auditId}/restore`,
      { method: "POST" },
    );
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || "Impossibile ripristinare la modifica");
    }
    await loadAuditLog();
    message.textContent = "Stato precedente ripristinato correttamente";
  } catch (error) {
    message.textContent = error.message;
    button.disabled = false;
  }
});

const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const formatPrice = (value) =>
  Number(value).toLocaleString("it-IT", {
    style: "currency",
    currency: "EUR",
  });

function adminImageUrl(path) {
  return path
    ? apiUrl(`/${path.replace(/^\/+/, "")}`)
    : "/images/Locale/logo-bourmet.svg";
}

function updateLocalProductImage(productId, imagePath) {
  const product = adminProducts.find((item) => item.id === productId);
  if (product) product.imagePath = imagePath;
  document.querySelector("#product-image-preview").src =
    adminImageUrl(imagePath);
  renderProducts();
}

function renderImageHistory(images) {
  currentImageHistory = images;
  const container = document.querySelector("#image-history");
  const message = document.querySelector("#image-history-message");
  if (!images.length) {
    message.textContent = "Nessuna immagine salvata per questo prodotto.";
    container.innerHTML = "";
    return;
  }
  message.textContent = `${images.length} ${images.length === 1 ? "immagine salvata" : "immagini salvate"}.`;
  container.innerHTML = images
    .map((image) => {
      const date = image.createdAt
        ? new Date(image.createdAt).toLocaleDateString("it-IT")
        : "Immagine originale";
      return `
        <article class="history-image ${image.isPrimary ? "primary" : ""} ${image.isVisible ? "" : "hidden-image"}"
          draggable="true" data-image-id="${image.id}">
          <img src="${escapeHtml(adminImageUrl(image.path))}" alt="${escapeHtml(image.alt || "")}" />
          <span class="history-image-status">${
            image.isPrimary
              ? "Foto principale"
              : image.isVisible
                ? escapeHtml(date)
                : "Nascosta dal sito"
          }</span>
          <div class="history-image-actions">
            ${
              image.isPrimary
                ? ""
                : `<button class="restore-history-image" type="button" data-image-id="${image.id}">Ripristina</button>`
            }
            <button class="toggle-history-image" type="button"
              data-image-id="${image.id}">${image.isVisible ? "Nascondi" : "Mostra"}</button>
            <button class="move-history-image-up" type="button"
              data-image-id="${image.id}" aria-label="Sposta indietro">←</button>
            <button class="move-history-image-down" type="button"
              data-image-id="${image.id}" aria-label="Sposta avanti">→</button>
            <button class="remove-history-image" type="button"
              data-image-id="${image.id}" aria-label="Rimuovi immagine">×</button>
          </div>
        </article>`;
    })
    .join("");
}

async function saveImageHistoryOrder(productId, imageIds) {
  const response = await authenticatedFetch(
    `/api/admin/products/${productId}/images-order`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageIds }),
    },
  );
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Impossibile riordinare le immagini");
  }
  const result = await response.json();
  updateLocalProductImage(productId, result.imagePath);
  await loadImageHistory(productId);
}

async function moveHistoryImage(productId, imageId, offset) {
  const ids = currentImageHistory.map((image) => image.id);
  const index = ids.indexOf(imageId);
  const target = index + offset;
  if (index < 0 || target < 0 || target >= ids.length) return;
  [ids[index], ids[target]] = [ids[target], ids[index]];
  await saveImageHistoryOrder(productId, ids);
}

async function loadImageHistory(productId) {
  const message = document.querySelector("#image-history-message");
  const container = document.querySelector("#image-history");
  if (!productId) {
    message.textContent =
      "La cronologia sarà disponibile dopo il primo salvataggio.";
    container.innerHTML = "";
    return;
  }
  message.textContent = "Caricamento cronologia…";
  container.innerHTML = "";
  try {
    const response = await authenticatedFetch(
      `/api/admin/products/${productId}/images`,
    );
    if (!response.ok) throw new Error("Cronologia non disponibile");
    const images = await response.json();
    if (Number(document.querySelector("#product-id").value) !== productId)
      return;
    renderImageHistory(images);
  } catch (error) {
    message.textContent = error.message;
  }
}

function updateDashboardCounts() {
  document.querySelector("#products-count").textContent = adminProducts.filter(
    (product) => product.isActive,
  ).length;
  document.querySelector("#best-sellers-count").textContent =
    adminProducts.filter(
      (product) => product.isActive && product.isBestSeller,
    ).length;
}

function renderProducts() {
  const query = document
    .querySelector("#product-search")
    .value.trim()
    .toLowerCase();
  const showInactive = document.querySelector("#show-inactive").checked;
  const filtered = adminProducts.filter((product) => {
    if (!showInactive && !product.isActive) return false;
    const searchable =
      `${product.name} ${product.slug} ${product.categoryNames.join(" ")}`.toLowerCase();
    return searchable.includes(query);
  });

  if (!filtered.length) {
    productsList.innerHTML =
      '<p class="manager-message">Nessun prodotto corrisponde alla ricerca.</p>';
    return;
  }

  productsList.innerHTML = filtered
    .map(
      (product) => `
        <article class="product-row ${product.isActive ? "" : "inactive"}">
          <img class="product-thumbnail"
            src="${escapeHtml(adminImageUrl(product.imagePath))}"
            alt="" onerror="this.onerror=null;this.src='/images/Locale/logo-bourmet.svg'" />
          <div class="product-row-copy">
            <h3>${escapeHtml(product.name)}</h3>
            <p>${escapeHtml(product.categoryNames.join(" · ") || "Senza sezione")} · ${escapeHtml(product.slug)}</p>
          </div>
          <div class="product-badges">
            ${product.isBestSeller ? '<span class="best-badge">Best seller</span>' : ""}
            ${product.isAvailable ? "" : "<span>Non disponibile</span>"}
            ${product.isActive ? "" : "<span>Disattivato</span>"}
          </div>
          <strong class="product-row-price">${formatPrice(product.salePrice || product.basePrice)}</strong>
          ${
            currentUserRole === "viewer"
              ? ""
              : `<button class="edit-product" type="button" data-product-id="${product.id}">
                  Modifica
                </button>`
          }
        </article>`,
    )
    .join("");
}

async function loadAdminProducts() {
  productsMessage.textContent = "Caricamento catalogo…";
  const [
    productsResponse,
    categoriesResponse,
    ingredientsResponse,
    allergensResponse,
  ] = await Promise.all([
    authenticatedFetch("/api/admin/products"),
    authenticatedFetch("/api/admin/categories"),
    authenticatedFetch("/api/admin/ingredients"),
    authenticatedFetch("/api/admin/allergens"),
  ]);
  if (
    !productsResponse.ok ||
    !categoriesResponse.ok ||
    !ingredientsResponse.ok ||
    !allergensResponse.ok
  ) {
    throw new Error("Impossibile caricare il catalogo");
  }
  [adminProducts, adminCategories, adminIngredients, adminAllergens] =
    await Promise.all([
      productsResponse.json(),
      categoriesResponse.json(),
      ingredientsResponse.json(),
      allergensResponse.json(),
    ]);
  productsMessage.textContent = `${adminProducts.length} prodotti nel database`;
  document.querySelector("#categories-count").textContent =
    adminCategories.filter((category) => category.isActive).length;
  updateDashboardCounts();
  renderProducts();
}

function renderCategoryOptions(selectedIds = []) {
  document.querySelector("#product-categories").innerHTML = adminCategories
    .map(
      (category) => `
        <label>
          <input type="checkbox" name="category" value="${category.id}"
            ${selectedIds.includes(category.id) ? "checked" : ""} />
          ${escapeHtml(category.name)}${category.isActive ? "" : " (disattivata)"}
        </label>`,
    )
    .join("");
}

function renderCategories() {
  if (!adminCategories.length) {
    categoriesList.innerHTML =
      '<p class="manager-message">Nessuna categoria del menu.</p>';
    return;
  }
  categoriesList.innerHTML = adminCategories
    .map(
      (category) => `
        <article class="category-row ${category.isActive ? "" : "inactive"}"
          style="--category-preview:${categoryThemeColors[category.theme] || "#bf3d29"}">
          <span class="category-color" aria-hidden="true"></span>
          <div>
            <h3>${escapeHtml(category.name)}</h3>
            <p>${escapeHtml(category.slug)}</p>
            <p>${category.productCount} prodotti · ordine ${category.displayOrder}</p>
            ${category.isActive ? "" : '<span class="best-badge">Disattivata</span>'}
          </div>
          <button class="edit-product edit-category" type="button"
            data-category-id="${category.id}">Modifica</button>
        </article>`,
    )
    .join("");
}

function bestSellerProducts() {
  return bestSellerDraft
    .map((id) => adminProducts.find((product) => product.id === id))
    .filter(Boolean);
}

function updateBestSellerMessage(customMessage = "") {
  const message = document.querySelector("#best-sellers-message");
  if (customMessage) {
    message.textContent = customMessage;
    return;
  }
  const count = bestSellerDraft.length;
  if (!count) {
    message.textContent =
      "Nessun best seller selezionato: la home mostrerà lo stato vuoto.";
  } else if (count % 4 !== 0) {
    message.textContent = `${count} prodotti selezionati. L’ultima slide conterrà ${count % 4} prodotti.`;
  } else {
    message.textContent = `${count} prodotti selezionati, divisi in ${count / 4} slide complete.`;
  }
}

function renderBestSellers() {
  const selectedContainer = document.querySelector("#selected-best-sellers");
  const selected = bestSellerProducts();
  selectedContainer.innerHTML = selected.length
    ? selected
        .map(
          (product, index) => `
            <article class="best-seller-card" draggable="true"
              data-product-id="${product.id}">
              <span class="best-seller-position">${index + 1}</span>
              <img src="${escapeHtml(adminImageUrl(product.imagePath))}" alt=""
                onerror="this.onerror=null;this.src='/images/Locale/logo-bourmet.svg'" />
              <h4>${escapeHtml(product.name)}</h4>
              <div class="best-seller-controls">
                <button class="move-best-seller-up" type="button"
                  aria-label="Sposta indietro" ${index === 0 ? "disabled" : ""}>←</button>
                <button class="move-best-seller-down" type="button"
                  aria-label="Sposta avanti"
                  ${index === selected.length - 1 ? "disabled" : ""}>→</button>
                <button class="remove-best-seller" type="button">Rimuovi</button>
              </div>
            </article>`,
        )
        .join("")
    : '<p class="empty-best-sellers">Aggiungi i prodotti da mostrare nella home.</p>';

  const query = document
    .querySelector("#best-seller-search")
    .value.trim()
    .toLowerCase();
  const available = adminProducts.filter(
    (product) =>
      product.isActive &&
      !bestSellerDraft.includes(product.id) &&
      `${product.name} ${product.categoryNames.join(" ")}`
        .toLowerCase()
        .includes(query),
  );
  document.querySelector("#available-best-sellers").innerHTML = available.length
    ? available
        .map(
          (product) => `
            <article class="available-best-seller">
              <img src="${escapeHtml(adminImageUrl(product.imagePath))}" alt="" />
              <span>${escapeHtml(product.name)}</span>
              <button class="add-best-seller" type="button"
                data-product-id="${product.id}">Aggiungi</button>
            </article>`,
        )
        .join("")
    : '<p class="manager-message">Nessun altro prodotto disponibile.</p>';
  updateBestSellerMessage();
}

async function loadBestSellerManager() {
  const response = await authenticatedFetch("/api/admin/products");
  if (!response.ok) throw new Error("Impossibile caricare i prodotti");
  adminProducts = await response.json();
  bestSellerDraft = adminProducts
    .filter((product) => product.isActive && product.isBestSeller)
    .sort(
      (first, second) =>
        first.bestSellerOrder - second.bestSellerOrder ||
        first.name.localeCompare(second.name),
    )
    .map((product) => product.id);
  renderBestSellers();
}

function moveBestSeller(productId, offset) {
  const index = bestSellerDraft.indexOf(productId);
  const targetIndex = index + offset;
  if (index < 0 || targetIndex < 0 || targetIndex >= bestSellerDraft.length)
    return;
  [bestSellerDraft[index], bestSellerDraft[targetIndex]] = [
    bestSellerDraft[targetIndex],
    bestSellerDraft[index],
  ];
  renderBestSellers();
}

async function loadAdminCategories() {
  const message = document.querySelector("#categories-message");
  message.textContent = "Caricamento categorie…";
  const response = await authenticatedFetch("/api/admin/categories");
  if (!response.ok) throw new Error("Impossibile caricare le categorie");
  adminCategories = await response.json();
  message.textContent = `${adminCategories.length} categorie del menu`;
  document.querySelector("#categories-count").textContent =
    adminCategories.filter((category) => category.isActive).length;
  renderCategories();
}

function openCategoryForm(category = null) {
  categoryForm.reset();
  document.querySelector("#category-id").value = category?.id || "";
  document.querySelector("#category-form-title").textContent = category
    ? "Modifica categoria"
    : "Nuova categoria";
  document.querySelector("#category-name").value = category?.name || "";
  document.querySelector("#category-slug").value = category?.slug || "";
  document.querySelector("#category-theme").value =
    category?.theme || "burgers";
  document.querySelector("#category-order").value = category?.displayOrder ?? 0;
  document.querySelector("#category-active").checked =
    category?.isActive ?? true;
  document.querySelector("#category-usage").textContent = category
    ? `${category.productCount} prodotti associati.`
    : "La nuova categoria è ancora vuota.";
  const deleteButton = document.querySelector("#delete-category");
  deleteButton.hidden = !category;
  deleteButton.disabled = Boolean(category?.productCount);
  deleteButton.title = category?.productCount
    ? "Sposta o rimuovi prima tutti i prodotti associati."
    : "";
  document.querySelector("#category-form-message").textContent = "";
  categoryDialog.showModal();
}

function closeCategoryForm() {
  categoryDialog.close();
}

function renderIngredientOptions(selectedIds = []) {
  document.querySelector("#product-ingredients").innerHTML = adminIngredients
    .map(
      (ingredient) => `
        <div class="ingredient-option"
          data-ingredient-name="${escapeHtml(ingredient.name.toLowerCase())}">
          <label>
            <input type="checkbox" name="ingredient" value="${ingredient.id}"
              ${selectedIds.includes(ingredient.id) ? "checked" : ""} />
            <span>
              ${escapeHtml(ingredient.name)}
              ${
                ingredient.allergenNames.length
                  ? `<small>${escapeHtml(ingredient.allergenNames.join(", "))}</small>`
                  : ""
              }
            </span>
          </label>
          <button class="edit-ingredient" type="button"
            data-ingredient-id="${ingredient.id}">Modifica</button>
        </div>`,
    )
    .join("");
  updateAllergenSummary();
}

function renderNewIngredientAllergens() {
  document.querySelector("#new-ingredient-allergens").innerHTML = adminAllergens
    .map(
      (allergen) => `
          <label>
            <input type="checkbox" name="new-ingredient-allergen" value="${allergen.id}" />
            ${escapeHtml(allergen.name)}
          </label>`,
    )
    .join("");
}

function renderEditIngredientAllergens(selectedIds) {
  document.querySelector("#edit-ingredient-allergens").innerHTML =
    adminAllergens
      .map(
        (allergen) => `
          <label>
            <input type="checkbox" name="edit-ingredient-allergen"
              value="${allergen.id}" ${selectedIds.includes(allergen.id) ? "checked" : ""} />
            ${escapeHtml(allergen.name)}
          </label>`,
      )
      .join("");
}

function selectedAllergenIds(inputName) {
  return [
    ...document.querySelectorAll(`input[name="${inputName}"]:checked`),
  ].map((input) => Number(input.value));
}

function renderAllergensManager() {
  document.querySelector("#allergens-list").innerHTML = adminAllergens.length
    ? adminAllergens
        .map(
          (allergen) => `
            <article class="allergen-row">
              <div class="allergen-row-copy">
                <strong>${escapeHtml(allergen.name)}</strong>
                <small>
                  ${allergen.ingredientCount} ingredienti ·
                  ${allergen.productCount} prodotti collegati
                </small>
              </div>
              <button class="delete-allergen" type="button"
                data-allergen-id="${allergen.id}">Elimina</button>
            </article>`,
        )
        .join("")
    : '<p class="manager-message">Nessun allergene configurato.</p>';
}

function openAllergenManager(target) {
  allergenSelectionTarget = target;
  allergenForm.reset();
  document.querySelector("#allergen-form-message").textContent = "";
  renderAllergensManager();
  allergenDialog.showModal();
}

async function refreshAllergens(newSelectedIds, editSelectedIds) {
  const response = await authenticatedFetch("/api/admin/allergens");
  if (!response.ok) throw new Error("Impossibile aggiornare gli allergeni");
  adminAllergens = await response.json();
  renderNewIngredientAllergens();
  renderEditIngredientAllergens(editSelectedIds);
  document
    .querySelectorAll('input[name="new-ingredient-allergen"]')
    .forEach((input) => {
      input.checked = newSelectedIds.includes(Number(input.value));
    });
  renderAllergensManager();
}

function openIngredientEditor(ingredient) {
  ingredientForm.reset();
  document.querySelector("#edit-ingredient-id").value = ingredient.id;
  document.querySelector("#edit-ingredient-name").value = ingredient.name;
  renderEditIngredientAllergens(ingredient.allergenIds);
  document.querySelector("#ingredient-usage").textContent =
    ingredient.productCount === 1
      ? "Utilizzato da 1 prodotto."
      : `Utilizzato da ${ingredient.productCount} prodotti.`;
  document.querySelector("#ingredient-form-message").textContent = "";
  ingredientDialog.showModal();
}

function closeIngredientEditor() {
  ingredientDialog.close();
}

async function refreshIngredients(selectedIds) {
  const response = await authenticatedFetch("/api/admin/ingredients");
  if (!response.ok) throw new Error("Impossibile aggiornare gli ingredienti");
  adminIngredients = await response.json();
  renderIngredientOptions(selectedIds);
}

function selectedIngredientIds() {
  return [
    ...document.querySelectorAll(
      '#product-ingredients input[name="ingredient"]:checked',
    ),
  ].map((input) => Number(input.value));
}

function updateAllergenSummary() {
  const allergenNames = new Set();
  selectedIngredientIds().forEach((ingredientId) => {
    const ingredient = adminIngredients.find(
      (item) => item.id === ingredientId,
    );
    ingredient?.allergenNames.forEach((name) => allergenNames.add(name));
  });
  document.querySelector("#product-allergen-summary").textContent =
    [...allergenNames].sort().join(", ") || "Nessuno";
}

function openProductForm(product = null) {
  if (previewObjectUrl) {
    URL.revokeObjectURL(previewObjectUrl);
    previewObjectUrl = null;
  }
  productForm.reset();
  document.querySelector("#product-id").value = product?.id || "";
  document.querySelector("#product-form-title").textContent = product
    ? "Modifica prodotto"
    : "Nuovo prodotto";
  document.querySelector("#product-name").value = product?.name || "";
  document.querySelector("#product-slug").value = product?.slug || "";
  document.querySelector("#product-description").value =
    product?.description || "";
  document.querySelector("#product-price").value = product?.basePrice ?? "";
  document.querySelector("#product-sale-price").value =
    product?.salePrice || "";
  document.querySelector("#product-order").value = product?.displayOrder ?? 0;
  document.querySelector("#product-active").checked = product?.isActive ?? true;
  document.querySelector("#product-available").checked =
    product?.isAvailable ?? true;
  document.querySelector("#product-best-seller").checked =
    product?.isBestSeller ?? false;
  document.querySelector("#product-image").value = "";
  document.querySelector("#product-image-preview").src = adminImageUrl(
    product?.imagePath,
  );
  document.querySelector("#current-image-note").textContent = product?.imagePath
    ? "Se scegli un nuovo file, sostituirà la foto principale."
    : "Questo prodotto non ha ancora una foto.";
  renderCategoryOptions(product?.categoryIds || []);
  renderIngredientOptions(product?.ingredientIds || []);
  renderNewIngredientAllergens();
  document.querySelector("#ingredient-search").value = "";
  document.querySelector("#new-ingredient-panel").hidden = true;
  document.querySelector("#new-ingredient-name").value = "";
  document.querySelector("#new-ingredient-message").textContent = "";
  loadImageHistory(product?.id || 0);
  document.querySelector("#product-form-message").textContent = "";
  productDialog.showModal();
}

function closeProductForm() {
  if (previewObjectUrl) {
    URL.revokeObjectURL(previewObjectUrl);
    previewObjectUrl = null;
  }
  productDialog.close();
}

async function showDashboard(user) {
  currentUserRole = user.role;
  loginView.hidden = true;
  dashboardView.hidden = false;
  logoutButton.hidden = false;
  document.querySelector("#admin-name").textContent = user.username;
  document.querySelectorAll(".admin-only").forEach((element) => {
    element.hidden = user.role !== "admin";
  });
  document.querySelector("#new-product").hidden = user.role === "viewer";
  document.querySelector("#open-products").textContent =
    user.role === "viewer" ? "Consulta prodotti" : "Gestisci prodotti";
  closeManagers();

  try {
    const [productsResponse, menuResponse, bestSellersResponse] =
      await Promise.all([
        fetch(apiUrl("/api/products")),
        fetch(apiUrl("/api/menu")),
        fetch(apiUrl("/api/products/best-sellers")),
      ]);
    const [products, menu, bestSellers] = await Promise.all([
      productsResponse.json(),
      menuResponse.json(),
      bestSellersResponse.json(),
    ]);
    document.querySelector("#products-count").textContent = products.length;
    document.querySelector("#categories-count").textContent =
      menu.categories?.length || 0;
    document.querySelector("#best-sellers-count").textContent =
      bestSellers.length;
  } catch {
    document.querySelectorAll(".stats strong").forEach((item) => {
      item.textContent = "!";
    });
  }
}

async function restoreSession() {
  if (
    !sessionStorage.getItem(ACCESS_TOKEN_KEY) &&
    !(await refreshSession().catch(() => false))
  ) {
    showLogin();
    return;
  }
  const response = await authenticatedFetch("/api/auth/me");
  if (!response.ok) {
    clearTokens();
    showLogin("La sessione è scaduta. Accedi nuovamente.");
    return;
  }
  showDashboard(await response.json());
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  loginButton.disabled = true;
  loginMessage.textContent = "Accesso in corso…";
  loginMessage.classList.remove("error");
  try {
    const response = await fetch(apiUrl("/api/auth/login"), {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: loginForm.username.value.trim(),
        password: loginForm.password.value,
      }),
    });
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(
        response.status === 429
          ? errorBody.message || "Troppi tentativi. Riprova più tardi."
          : "invalid-login",
      );
    }
    saveTokens(await response.json());
    const profileResponse = await authenticatedFetch("/api/auth/me");
    if (!profileResponse.ok) throw new Error("invalid-session");
    loginForm.reset();
    showDashboard(await profileResponse.json());
  } catch (error) {
    clearTokens();
    loginMessage.textContent =
      error.message.startsWith("Troppi tentativi")
        ? error.message
        : "Credenziali non valide oppure server non raggiungibile.";
    loginMessage.classList.add("error");
  } finally {
    loginButton.disabled = false;
  }
});

document
  .querySelector("#password-toggle")
  .addEventListener("click", (event) => {
    const password = document.querySelector("#password");
    const visible = password.type === "text";
    password.type = visible ? "password" : "text";
    event.currentTarget.textContent = visible ? "Mostra" : "Nascondi";
    event.currentTarget.setAttribute(
      "aria-label",
      visible ? "Mostra password" : "Nascondi password",
    );
  });

document.querySelector("#open-products").addEventListener("click", async () => {
  openManager(productsManager, document.querySelector("#open-products"));
  try {
    await loadAdminProducts();
  } catch (error) {
    productsMessage.textContent = error.message;
  }
});

document
  .querySelector("#open-categories")
  .addEventListener("click", async () => {
    openManager(
      categoriesManager,
      document.querySelector("#open-categories"),
    );
    try {
      await loadAdminCategories();
    } catch (error) {
      document.querySelector("#categories-message").textContent = error.message;
    }
  });

document
  .querySelector("#open-best-sellers")
  .addEventListener("click", async () => {
    openManager(
      bestSellersManager,
      document.querySelector("#open-best-sellers"),
    );
    updateBestSellerMessage("Caricamento best seller…");
    try {
      await loadBestSellerManager();
    } catch (error) {
      updateBestSellerMessage(error.message);
    }
  });

document.querySelector("#new-product").addEventListener("click", () => {
  openProductForm();
});

document
  .querySelector("#new-category")
  .addEventListener("click", () => openCategoryForm());

categoriesList.addEventListener("click", (event) => {
  const button = event.target.closest(".edit-category");
  if (!button) return;
  const category = adminCategories.find(
    (item) => item.id === Number(button.dataset.categoryId),
  );
  if (category) openCategoryForm(category);
});

document
  .querySelector("#available-best-sellers")
  .addEventListener("click", (event) => {
    const button = event.target.closest(".add-best-seller");
    if (!button) return;
    bestSellerDraft.push(Number(button.dataset.productId));
    renderBestSellers();
  });

document
  .querySelector("#selected-best-sellers")
  .addEventListener("click", (event) => {
    const card = event.target.closest(".best-seller-card");
    if (!card) return;
    const productId = Number(card.dataset.productId);
    if (event.target.closest(".remove-best-seller")) {
      bestSellerDraft = bestSellerDraft.filter((id) => id !== productId);
      renderBestSellers();
    } else if (event.target.closest(".move-best-seller-up")) {
      moveBestSeller(productId, -1);
    } else if (event.target.closest(".move-best-seller-down")) {
      moveBestSeller(productId, 1);
    }
  });

document
  .querySelector("#selected-best-sellers")
  .addEventListener("dragstart", (event) => {
    const card = event.target.closest(".best-seller-card");
    if (!card) return;
    card.classList.add("dragging");
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", card.dataset.productId);
  });

document
  .querySelector("#selected-best-sellers")
  .addEventListener("dragover", (event) => {
    const card = event.target.closest(".best-seller-card");
    if (!card) return;
    event.preventDefault();
    document
      .querySelectorAll(".best-seller-card.drag-target")
      .forEach((item) => item.classList.remove("drag-target"));
    card.classList.add("drag-target");
  });

document
  .querySelector("#selected-best-sellers")
  .addEventListener("drop", (event) => {
    const target = event.target.closest(".best-seller-card");
    if (!target) return;
    event.preventDefault();
    const draggedId = Number(event.dataTransfer.getData("text/plain"));
    const targetId = Number(target.dataset.productId);
    if (draggedId === targetId) return;
    bestSellerDraft = bestSellerDraft.filter((id) => id !== draggedId);
    const targetIndex = bestSellerDraft.indexOf(targetId);
    bestSellerDraft.splice(targetIndex, 0, draggedId);
    renderBestSellers();
  });

document
  .querySelector("#selected-best-sellers")
  .addEventListener("dragend", () => {
    document
      .querySelectorAll(".best-seller-card")
      .forEach((item) => item.classList.remove("dragging", "drag-target"));
  });

document
  .querySelector("#best-seller-search")
  .addEventListener("input", renderBestSellers);

document
  .querySelector("#save-best-sellers")
  .addEventListener("click", async () => {
    const button = document.querySelector("#save-best-sellers");
    button.disabled = true;
    updateBestSellerMessage("Salvataggio in corso…");
    try {
      const response = await authenticatedFetch("/api/admin/best-sellers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds: bestSellerDraft }),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || "Impossibile salvare i best seller");
      }
      await loadBestSellerManager();
      updateDashboardCounts();
      updateBestSellerMessage("Best seller salvati correttamente.");
    } catch (error) {
      updateBestSellerMessage(error.message);
    } finally {
      button.disabled = false;
    }
  });

productsList.addEventListener("click", (event) => {
  const button = event.target.closest(".edit-product");
  if (!button) return;
  const product = adminProducts.find(
    (item) => item.id === Number(button.dataset.productId),
  );
  if (product) openProductForm(product);
});

document
  .querySelector("#product-search")
  .addEventListener("input", renderProducts);
document
  .querySelector("#show-inactive")
  .addEventListener("change", renderProducts);

document
  .querySelector("#ingredient-search")
  .addEventListener("input", (event) => {
    const query = event.target.value.trim().toLowerCase();
    document
      .querySelectorAll("#product-ingredients > .ingredient-option")
      .forEach((label) => {
        label.classList.toggle(
          "is-filtered",
          !label.dataset.ingredientName.includes(query),
        );
      });
  });

document
  .querySelector("#product-ingredients")
  .addEventListener("change", updateAllergenSummary);

document
  .querySelector("#product-ingredients")
  .addEventListener("click", (event) => {
    const button = event.target.closest(".edit-ingredient");
    if (!button) return;
    const ingredient = adminIngredients.find(
      (item) => item.id === Number(button.dataset.ingredientId),
    );
    if (ingredient) openIngredientEditor(ingredient);
  });

document.querySelector("#show-new-ingredient").addEventListener("click", () => {
  document.querySelector("#new-ingredient-panel").hidden = false;
  document.querySelector("#new-ingredient-name").focus();
});

document
  .querySelector("#cancel-new-ingredient")
  .addEventListener("click", () => {
    document.querySelector("#new-ingredient-panel").hidden = true;
  });

document
  .querySelector("#manage-new-ingredient-allergens")
  .addEventListener("click", () => openAllergenManager("new"));

document
  .querySelector("#manage-edit-ingredient-allergens")
  .addEventListener("click", () => openAllergenManager("edit"));

document
  .querySelector("#close-allergen-dialog")
  .addEventListener("click", () => allergenDialog.close());

allergenForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const message = document.querySelector("#allergen-form-message");
  const submitButton = allergenForm.querySelector('button[type="submit"]');
  const newSelectedIds = selectedAllergenIds("new-ingredient-allergen");
  const editSelectedIds = selectedAllergenIds("edit-ingredient-allergen");
  const name = document.querySelector("#new-allergen-name").value.trim();
  submitButton.disabled = true;
  message.textContent = "Creazione in corso…";
  message.classList.remove("error");
  try {
    const response = await authenticatedFetch("/api/admin/allergens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        description:
          document.querySelector("#new-allergen-description").value.trim() ||
          null,
      }),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || "Impossibile creare l’allergene");
    }
    const created = await response.json();
    if (allergenSelectionTarget === "new") newSelectedIds.push(created.id);
    if (allergenSelectionTarget === "edit") editSelectedIds.push(created.id);
    await refreshAllergens(newSelectedIds, editSelectedIds);
    allergenForm.reset();
    message.textContent =
      "Allergene creato e selezionato per questo ingrediente.";
  } catch (error) {
    message.textContent = error.message;
    message.classList.add("error");
  } finally {
    submitButton.disabled = false;
  }
});

document.querySelector("#allergens-list").addEventListener("click", async (event) => {
  const button = event.target.closest(".delete-allergen");
  if (!button) return;
  const id = Number(button.dataset.allergenId);
  const message = document.querySelector("#allergen-form-message");
  button.disabled = true;
  message.textContent = "Controllo dei prodotti collegati…";
  message.classList.remove("error");
  try {
    const usageResponse = await authenticatedFetch(
      `/api/admin/allergens/${id}/usage`,
    );
    if (!usageResponse.ok) {
      throw new Error("Impossibile verificare l’utilizzo dell’allergene");
    }
    const usage = await usageResponse.json();
    const productList = usage.products.length
      ? `\n\nProdotti coinvolti (${usage.productCount}):\n${usage.products
          .map((product) => `• ${product.name}`)
          .join("\n")}`
      : "\n\nNessun prodotto utilizza questo allergene.";
    const ingredientList = usage.ingredients.length
      ? `\n\nVerrà scollegato anche da ${usage.ingredientCount} ingredienti:\n${usage.ingredients
          .map((ingredient) => `• ${ingredient.name}`)
          .join("\n")}`
      : "";
    const confirmed = window.confirm(
      `Vuoi eliminare definitivamente l’allergene “${usage.name}”?${productList}${ingredientList}`,
    );
    if (!confirmed) {
      message.textContent = "Eliminazione annullata.";
      return;
    }

    const newSelectedIds = selectedAllergenIds(
      "new-ingredient-allergen",
    ).filter((allergenId) => allergenId !== id);
    const editSelectedIds = selectedAllergenIds(
      "edit-ingredient-allergen",
    ).filter((allergenId) => allergenId !== id);
    const productIngredientIds = selectedIngredientIds();
    message.textContent = "Eliminazione in corso…";
    const deleteResponse = await authenticatedFetch(
      `/api/admin/allergens/${id}`,
      { method: "DELETE" },
    );
    if (!deleteResponse.ok) {
      const error = await deleteResponse.json().catch(() => ({}));
      throw new Error(error.message || "Impossibile eliminare l’allergene");
    }
    await refreshAllergens(newSelectedIds, editSelectedIds);
    await refreshIngredients(productIngredientIds);
    message.textContent = "Allergene eliminato correttamente.";
  } catch (error) {
    message.textContent = error.message;
    message.classList.add("error");
  } finally {
    button.disabled = false;
  }
});

document
  .querySelector("#save-new-ingredient")
  .addEventListener("click", async () => {
    const button = document.querySelector("#save-new-ingredient");
    const message = document.querySelector("#new-ingredient-message");
    const name = document.querySelector("#new-ingredient-name").value.trim();
    const previouslySelected = selectedIngredientIds();
    if (!name) {
      message.textContent = "Inserisci il nome dell’ingrediente.";
      message.classList.add("error");
      return;
    }
    button.disabled = true;
    message.textContent = "Creazione in corso…";
    message.classList.remove("error");
    try {
      const response = await authenticatedFetch("/api/admin/ingredients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          allergenIds: [
            ...document.querySelectorAll(
              'input[name="new-ingredient-allergen"]:checked',
            ),
          ].map((input) => Number(input.value)),
        }),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || "Impossibile creare l’ingrediente");
      }
      const created = await response.json();
      await refreshIngredients([...previouslySelected, created.id]);
      document.querySelector("#new-ingredient-panel").hidden = true;
      document.querySelector("#new-ingredient-name").value = "";
    } catch (error) {
      message.textContent = error.message;
      message.classList.add("error");
    } finally {
      button.disabled = false;
    }
  });

document
  .querySelector("#close-ingredient-dialog")
  .addEventListener("click", closeIngredientEditor);
document
  .querySelector("#cancel-ingredient-edit")
  .addEventListener("click", closeIngredientEditor);

document
  .querySelector("#close-category-dialog")
  .addEventListener("click", closeCategoryForm);
document
  .querySelector("#cancel-category-edit")
  .addEventListener("click", closeCategoryForm);

categoryForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const id = Number(document.querySelector("#category-id").value);
  const message = document.querySelector("#category-form-message");
  const submitButton = categoryForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  message.textContent = "Salvataggio in corso…";
  message.classList.remove("error");
  try {
    const response = await authenticatedFetch(
      id ? `/api/admin/categories/${id}` : "/api/admin/categories",
      {
        method: id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: document.querySelector("#category-name").value.trim(),
          slug:
            document.querySelector("#category-slug").value.trim() || undefined,
          theme: document.querySelector("#category-theme").value,
          displayOrder:
            Number(document.querySelector("#category-order").value) || 0,
          isActive: document.querySelector("#category-active").checked,
        }),
      },
    );
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || "Impossibile salvare la categoria");
    }
    await loadAdminCategories();
    closeCategoryForm();
  } catch (error) {
    message.textContent = error.message;
    message.classList.add("error");
  } finally {
    submitButton.disabled = false;
  }
});

document
  .querySelector("#delete-category")
  .addEventListener("click", async () => {
    const id = Number(document.querySelector("#category-id").value);
    const category = adminCategories.find((item) => item.id === id);
    if (!category || category.productCount > 0) return;
    if (!window.confirm(`Vuoi eliminare la categoria “${category.name}”?`))
      return;
    const message = document.querySelector("#category-form-message");
    message.textContent = "Eliminazione in corso…";
    try {
      const response = await authenticatedFetch(`/api/admin/categories/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || "Impossibile eliminare la categoria");
      }
      await loadAdminCategories();
      closeCategoryForm();
    } catch (error) {
      message.textContent = error.message;
      message.classList.add("error");
    }
  });

ingredientForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const id = Number(document.querySelector("#edit-ingredient-id").value);
  const message = document.querySelector("#ingredient-form-message");
  const submitButton = ingredientForm.querySelector('button[type="submit"]');
  const selectedIds = selectedIngredientIds();
  submitButton.disabled = true;
  message.textContent = "Salvataggio in corso…";
  message.classList.remove("error");
  try {
    const response = await authenticatedFetch(`/api/admin/ingredients/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: document.querySelector("#edit-ingredient-name").value.trim(),
        allergenIds: [
          ...document.querySelectorAll(
            'input[name="edit-ingredient-allergen"]:checked',
          ),
        ].map((input) => Number(input.value)),
      }),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || "Impossibile salvare l’ingrediente");
    }
    await refreshIngredients(selectedIds);
    closeIngredientEditor();
  } catch (error) {
    message.textContent = error.message;
    message.classList.add("error");
  } finally {
    submitButton.disabled = false;
  }
});

document
  .querySelector("#delete-ingredient")
  .addEventListener("click", async () => {
    const id = Number(document.querySelector("#edit-ingredient-id").value);
    const ingredient = adminIngredients.find((item) => item.id === id);
    if (!ingredient) return;
    const usage =
      ingredient.productCount > 0
        ? ` Verrà rimosso anche da ${ingredient.productCount} prodotti.`
        : "";
    if (
      !window.confirm(
        `Vuoi eliminare definitivamente “${ingredient.name}”?${usage}`,
      )
    )
      return;

    const message = document.querySelector("#ingredient-form-message");
    const selectedIds = selectedIngredientIds().filter(
      (itemId) => itemId !== id,
    );
    message.textContent = "Eliminazione in corso…";
    message.classList.remove("error");
    try {
      const response = await authenticatedFetch(
        `/api/admin/ingredients/${id}`,
        {
          method: "DELETE",
        },
      );
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || "Impossibile eliminare l’ingrediente");
      }
      await refreshIngredients(selectedIds);
      closeIngredientEditor();
    } catch (error) {
      message.textContent = error.message;
      message.classList.add("error");
    }
  });
document
  .querySelector("#close-product-dialog")
  .addEventListener("click", closeProductForm);
document
  .querySelector("#cancel-product")
  .addEventListener("click", closeProductForm);

document.querySelector("#product-image").addEventListener("change", (event) => {
  const file = event.target.files[0];
  const message = document.querySelector("#product-form-message");
  message.textContent = "";
  message.classList.remove("error");
  if (!file) return;
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type) || file.size > 5 * 1024 * 1024) {
    event.target.value = "";
    message.textContent =
      "Scegli un’immagine JPG, PNG o WebP più piccola di 5 MB.";
    message.classList.add("error");
    return;
  }
  if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
  previewObjectUrl = URL.createObjectURL(file);
  document.querySelector("#product-image-preview").src = previewObjectUrl;
  document.querySelector("#current-image-note").textContent =
    "Anteprima della nuova foto.";
});

document
  .querySelector("#image-history")
  .addEventListener("click", async (event) => {
    const restoreButton = event.target.closest(".restore-history-image");
    const removeButton = event.target.closest(".remove-history-image");
    const toggleButton = event.target.closest(".toggle-history-image");
    const moveUpButton = event.target.closest(".move-history-image-up");
    const moveDownButton = event.target.closest(".move-history-image-down");
    if (
      !restoreButton &&
      !removeButton &&
      !toggleButton &&
      !moveUpButton &&
      !moveDownButton
    )
      return;
    const productId = Number(document.querySelector("#product-id").value);
    const actionButton =
      restoreButton ||
      removeButton ||
      toggleButton ||
      moveUpButton ||
      moveDownButton;
    const imageId = Number(actionButton.dataset.imageId);
    const message = document.querySelector("#image-history-message");

    if (moveUpButton || moveDownButton) {
      try {
        message.textContent = "Riordinamento immagini…";
        await moveHistoryImage(productId, imageId, moveUpButton ? -1 : 1);
      } catch (error) {
        message.textContent = error.message;
      }
      return;
    }

    if (removeButton) {
      const confirmed = window.confirm(
        "Vuoi rimuovere questa immagine dalla cronologia?",
      );
      if (!confirmed) return;
    }

    message.textContent = restoreButton
      ? "Ripristino dell’immagine…"
      : toggleButton
        ? "Aggiornamento visibilità…"
        : "Rimozione dell’immagine…";
    try {
      const selectedImage = currentImageHistory.find(
        (image) => image.id === imageId,
      );
      const response = await authenticatedFetch(
        removeButton
          ? `/api/admin/products/${productId}/images/${imageId}`
          : toggleButton
            ? `/api/admin/products/${productId}/images/${imageId}/visibility`
            : `/api/admin/products/${productId}/images/${imageId}/primary`,
        {
          method: removeButton ? "DELETE" : "PATCH",
          headers: toggleButton
            ? { "Content-Type": "application/json" }
            : undefined,
          body: toggleButton
            ? JSON.stringify({ isVisible: !selectedImage.isVisible })
            : undefined,
        },
      );
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || "Operazione non riuscita");
      }
      const result = await response.json();
      updateLocalProductImage(productId, result.imagePath);
      await loadImageHistory(productId);
    } catch (error) {
      message.textContent = error.message;
    }
  });

document
  .querySelector("#image-history")
  .addEventListener("dragstart", (event) => {
    const card = event.target.closest(".history-image");
    if (!card) return;
    card.classList.add("dragging");
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", card.dataset.imageId);
  });

document
  .querySelector("#image-history")
  .addEventListener("dragover", (event) => {
    const card = event.target.closest(".history-image");
    if (!card) return;
    event.preventDefault();
    document
      .querySelectorAll(".history-image.drag-target")
      .forEach((item) => item.classList.remove("drag-target"));
    card.classList.add("drag-target");
  });

document
  .querySelector("#image-history")
  .addEventListener("drop", async (event) => {
    const target = event.target.closest(".history-image");
    if (!target) return;
    event.preventDefault();
    const draggedId = Number(event.dataTransfer.getData("text/plain"));
    const targetId = Number(target.dataset.imageId);
    if (draggedId === targetId) return;
    const ids = currentImageHistory
      .map((image) => image.id)
      .filter((id) => id !== draggedId);
    ids.splice(ids.indexOf(targetId), 0, draggedId);
    const productId = Number(document.querySelector("#product-id").value);
    try {
      await saveImageHistoryOrder(productId, ids);
    } catch (error) {
      document.querySelector("#image-history-message").textContent =
        error.message;
    }
  });

document.querySelector("#image-history").addEventListener("dragend", () => {
  document
    .querySelectorAll(".history-image")
    .forEach((item) => item.classList.remove("dragging", "drag-target"));
});

productDialog.addEventListener("click", (event) => {
  if (event.target === productDialog) closeProductForm();
});

productForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const id = Number(document.querySelector("#product-id").value);
  const saveButton = document.querySelector("#save-product");
  const message = document.querySelector("#product-form-message");
  const body = {
    name: document.querySelector("#product-name").value.trim(),
    slug: document.querySelector("#product-slug").value.trim() || undefined,
    description:
      document.querySelector("#product-description").value.trim() || null,
    basePrice: Number(document.querySelector("#product-price").value),
    salePrice: Number(document.querySelector("#product-sale-price").value) || 0,
    displayOrder: Number(document.querySelector("#product-order").value) || 0,
    isActive: document.querySelector("#product-active").checked,
    isAvailable: document.querySelector("#product-available").checked,
    isBestSeller: document.querySelector("#product-best-seller").checked,
    categoryIds: [
      ...document.querySelectorAll(
        '#product-categories input[name="category"]:checked',
      ),
    ].map((input) => Number(input.value)),
    ingredientIds: selectedIngredientIds(),
  };

  saveButton.disabled = true;
  message.textContent = "Salvataggio in corso…";
  message.classList.remove("error");
  try {
    const response = await authenticatedFetch(
      id ? `/api/admin/products/${id}` : "/api/admin/products",
      {
        method: id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        Array.isArray(error.message)
          ? error.message.join(", ")
          : error.message || "Impossibile salvare il prodotto",
      );
    }
    const savedProduct = await response.json();
    const savedProductId = id || savedProduct.id;
    const imageFile = document.querySelector("#product-image").files[0];
    if (imageFile) {
      message.textContent = "Caricamento della foto…";
      const imageData = new FormData();
      imageData.append("image", imageFile);
      const imageResponse = await authenticatedFetch(
        `/api/admin/products/${savedProductId}/image`,
        { method: "POST", body: imageData },
      );
      if (!imageResponse.ok) {
        const imageError = await imageResponse.json().catch(() => ({}));
        throw new Error(
          imageError.message ||
            "Il prodotto è stato salvato, ma la foto non è stata caricata.",
        );
      }
    }
    await loadAdminProducts();
    closeProductForm();
  } catch (error) {
    message.textContent = error.message;
    message.classList.add("error");
  } finally {
    saveButton.disabled = false;
  }
});

const TABLE_LINKS_KEY = "bourmet_admin_table_links";

function storedTableLinks() {
  try {
    return JSON.parse(localStorage.getItem(TABLE_LINKS_KEY)) || {};
  } catch {
    return {};
  }
}

function rememberTableLink(tableId, accessPath) {
  const links = storedTableLinks();
  links[tableId] = `${API_ORIGIN}${accessPath}`;
  localStorage.setItem(TABLE_LINKS_KEY, JSON.stringify(links));
}

async function openTableQr(tableId, accessLink) {
  const table = adminTables.find((item) => item.id === tableId);
  const dialog = document.querySelector("#table-qr-dialog");
  const image = document.querySelector("#table-qr-image");
  const download = document.querySelector("#download-table-qr");
  const status = document.querySelector("#table-qr-message");
  document.querySelector("#table-qr-title").textContent =
    `QR tavolo ${table?.tableNumber || ""}`;
  document.querySelector("#table-qr-link").textContent = accessLink;
  dialog.dataset.tableId = String(tableId);
  dialog.dataset.accessLink = accessLink;
  document.querySelector("#copy-table-qr-link").dataset.link = accessLink;
  document.querySelector("#open-table-qr-link").href = accessLink;
  image.hidden = true;
  download.hidden = true;
  status.textContent = "Generazione QR…";
  if (!dialog.open) dialog.showModal();
  try {
    const token = new URL(accessLink).pathname.split("/").filter(Boolean).at(-1);
    const response = await authenticatedFetch(`/api/admin/tables/${tableId}/qr`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    if (!response.ok) throw new Error("QR non disponibile");
    const qr = await response.json();
    image.src = qr.dataUrl;
    image.hidden = false;
    download.href = qr.dataUrl;
    download.download = `bourmet-tavolo-${table?.tableNumber || tableId}.png`;
    download.hidden = false;
    status.textContent = "";
  } catch {
    status.textContent = "Impossibile generare l’anteprima del QR.";
  }
}

function renderTables() {
  const links = storedTableLinks();
  document.querySelector("#tables-list").innerHTML = adminTables.length
    ? adminTables
        .map((table) => {
          const accessLink = links[table.id];
          const session = table.session;
          return `<article class="table-row ${table.isActive ? "" : "inactive"}">
            <div>
              <h3>Tavolo ${table.tableNumber}</h3>
              <p>${escapeHtml(table.name)}</p>
              <span class="table-session-badge ${session ? "open" : ""}">
                ${
                  session
                    ? `Aperto · ${session.guestCount} ospiti collegati`
                    : "Nessuna sessione aperta"
                }
              </span>
            </div>
            <div class="table-actions">
              ${
                session
                  ? `<button class="close-session" data-table-id="${table.id}" type="button">Chiudi tavolo</button>`
                  : `<button class="open-session" data-table-id="${table.id}" type="button" ${table.isActive ? "" : "disabled"}>Apri tavolo</button>`
              }
              <button class="toggle-table" data-table-id="${table.id}" data-active="${table.isActive}" type="button">
                ${table.isActive ? "Disattiva" : "Riattiva"}
              </button>
              <button class="view-table-cart" data-table-id="${table.id}" type="button">Visualizza carrello</button>
            </div>
            <div class="table-link">
              ${
                accessLink
                  ? `<div class="table-link-actions">
                       <button class="show-table-qr" data-table-id="${table.id}" data-link="${escapeHtml(accessLink)}" type="button">Mostra QR</button>
                     </div>`
                  : `<p>Il token non è conservato in chiaro dal server. Se questo browser non ha il link, rigenera il QR e sostituisci quello eventualmente già stampato.</p>`
              }
            </div>
          </article>`;
        })
        .join("")
    : '<p class="manager-message">Non hai ancora creato tavoli.</p>';
}

async function openTableCart(tableId) {
  const dialog = document.querySelector("#table-cart-dialog");
  const content = document.querySelector("#table-cart-content");
  const message = document.querySelector("#table-cart-message");
  dialog.dataset.tableId = String(tableId);
  content.innerHTML = "";
  message.textContent = "Caricamento del carrello…";
  if (!dialog.open) dialog.showModal();
  const response = await authenticatedFetch(`/api/admin/tables/${tableId}/cart`);
  if (!response.ok) {
    message.textContent = "Impossibile caricare il carrello del tavolo.";
    return;
  }
  const cart = await response.json();
  document.querySelector("#table-cart-title").textContent =
    `Carrello tavolo ${cart.tableNumber}`;
  message.textContent = cart.session
    ? `${cart.guests.length} ospiti collegati`
    : "Il tavolo non ha una sessione aperta.";
  content.innerHTML = cart.guests.length
    ? `${cart.guests
        .map(
          (guest) => `<section class="admin-guest-cart">
            <div class="admin-guest-heading"><h3>${escapeHtml(guest.name)}</h3><strong>${formatPrice(guest.total)}</strong></div>
            ${
              guest.items.length
                ? guest.items
                    .map(
                      (item) => `<article class="admin-cart-item">
                        <img src="${escapeHtml(adminImageUrl(item.imagePath))}" alt="" />
                        <div><strong>${item.quantity} × ${escapeHtml(item.name)}</strong>${item.preference ? `<small>${escapeHtml(item.preference)}</small>` : ""}</div>
                        <span>${formatPrice(item.subtotal)}</span>
                      </article>`,
                    )
                    .join("")
                : '<p>Nessun prodotto aggiunto.</p>'
            }
          </section>`,
        )
        .join("")}
       <p class="admin-table-total"><span>Totale tavolo</span><strong>${formatPrice(cart.total)}</strong></p>`
    : '<p class="manager-message">Non ci sono ancora prodotti nel carrello del tavolo.</p>';
}

async function loadTables() {
  const response = await authenticatedFetch("/api/admin/tables");
  if (!response.ok) throw new Error("Impossibile caricare i tavoli");
  adminTables = await response.json();
  document.querySelector("#tables-message").textContent =
    `${adminTables.length} tavoli configurati`;
  renderTables();
}

async function tableAction(path, options = {}) {
  const response = await authenticatedFetch(path, options);
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      Array.isArray(error.message)
        ? error.message.join(", ")
        : error.message || "Operazione sul tavolo non riuscita",
    );
  }
  return response.json();
}

async function loadUsers() {
  const response = await authenticatedFetch("/api/admin/users");
  if (!response.ok) throw new Error("Impossibile caricare gli utenti");
  adminUsers = await response.json();
  document.querySelector("#users-message").textContent =
    `${adminUsers.length} utenti configurati`;
  document.querySelector("#users-list").innerHTML = adminUsers
    .map(
      (
        user,
      ) => `<article class="category-row ${user.isActive ? "" : "inactive"}">
        <span class="category-color" style="--category-preview:${user.role === "admin" ? "#bf3d29" : "#637f91"}"></span>
        <div><h3>${escapeHtml(user.username)}</h3><p>${
          user.role === "admin"
            ? "Amministratore completo"
            : user.role === "viewer"
              ? "Visualizzatore"
              : "Editor prodotti"
        }</p><p>${user.isActive ? "Attivo" : "Disattivato"}</p></div>
        <button class="edit-product edit-user" data-user-id="${user.id}" type="button">Modifica</button>
      </article>`,
    )
    .join("");
}

function openUserForm(user = null) {
  userForm.reset();
  document.querySelector("#user-id").value = user?.id || "";
  document.querySelector("#user-form-title").textContent = user
    ? "Modifica utente"
    : "Nuovo utente";
  document.querySelector("#user-username").value = user?.username || "";
  document.querySelector("#user-password").required = !user;
  document.querySelector("#user-role").value = user?.role || "editor";
  document.querySelector("#user-active").checked = user?.isActive ?? true;
  document.querySelector("#user-form-message").textContent = "";
  userDialog.showModal();
}

document.querySelector("#open-users").addEventListener("click", async () => {
  openManager(usersManager, document.querySelector("#open-users"));
  try {
    await loadUsers();
  } catch (error) {
    document.querySelector("#users-message").textContent = error.message;
  }
});

document.querySelector("#open-tables").addEventListener("click", async () => {
  openManager(tablesManager, document.querySelector("#open-tables"));
  try {
    await loadTables();
  } catch (error) {
    document.querySelector("#tables-message").textContent = error.message;
  }
});

document.querySelector("#new-table").addEventListener("click", () => {
  document.querySelector("#new-table-form").hidden = false;
  document.querySelector("#table-number").focus();
});

document.querySelector("#cancel-new-table").addEventListener("click", () => {
  document.querySelector("#new-table-form").reset();
  document.querySelector("#new-table-form").hidden = true;
});

document.querySelector("#new-table-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const message = document.querySelector("#tables-message");
  try {
    const created = await tableAction("/api/admin/tables", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tableNumber: Number(document.querySelector("#table-number").value),
        name: document.querySelector("#table-name").value.trim(),
      }),
    });
    rememberTableLink(created.id, created.accessPath);
    form.reset();
    form.hidden = true;
    await loadTables();
    message.textContent = `Tavolo ${created.tableNumber} creato. Conserva e stampa il suo link QR permanente.`;
  } catch (error) {
    message.textContent = error.message;
  }
});

document.querySelector("#tables-list").addEventListener("click", async (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  const message = document.querySelector("#tables-message");
  const tableId = Number(button.dataset.tableId);
  let successMessage = "";
  try {
    if (button.classList.contains("show-table-qr")) {
      await openTableQr(tableId, button.dataset.link);
      return;
    }
    if (button.classList.contains("view-table-cart")) {
      await openTableCart(tableId);
      return;
    }
    if (button.classList.contains("copy-table-link")) {
      await navigator.clipboard.writeText(button.dataset.link);
      message.textContent = "Link QR copiato negli appunti.";
      return;
    }
    if (button.classList.contains("open-session")) {
      await tableAction(`/api/admin/tables/${tableId}/open-session`, {
        method: "POST",
      });
      successMessage = "Sessione del tavolo aperta: ora il QR può collegare gli ospiti.";
    } else if (button.classList.contains("close-session")) {
      if (!confirm("Chiudere il tavolo? Tutti gli ospiti collegati verranno disconnessi.")) return;
      await tableAction(`/api/admin/tables/${tableId}/close-session`, {
        method: "POST",
      });
      successMessage = "Sessione chiusa e ospiti disconnessi.";
    } else if (button.classList.contains("toggle-table")) {
      const active = button.dataset.active === "true";
      await tableAction(`/api/admin/tables/${tableId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !active }),
      });
      successMessage = active ? "Tavolo disattivato." : "Tavolo riattivato.";
    } else if (button.classList.contains("regenerate-table-token")) {
      if (!confirm("Rigenerare il QR? Il vecchio link smetterà immediatamente di funzionare e dovrà essere ristampato.")) return;
      const regenerated = await tableAction(
        `/api/admin/tables/${tableId}/regenerate-token`,
        { method: "POST" },
      );
      rememberTableLink(tableId, regenerated.accessPath);
      successMessage = "Nuovo link QR generato. Il precedente non è più valido.";
    } else {
      return;
    }
    await loadTables();
    message.textContent = successMessage;
  } catch (error) {
    message.textContent = error.message;
  }
});

document.querySelector("#close-table-qr-dialog").addEventListener("click", () => {
  document.querySelector("#table-qr-dialog").close();
});
document.querySelector("#copy-table-qr-link").addEventListener("click", async (event) => {
  await navigator.clipboard.writeText(event.currentTarget.dataset.link);
  document.querySelector("#table-qr-message").textContent =
    "Link QR copiato negli appunti.";
});
document
  .querySelector("#regenerate-dialog-table-token")
  .addEventListener("click", async () => {
    if (
      !confirm(
        "Rigenerare il QR? Il vecchio link smetterà immediatamente di funzionare e dovrà essere ristampato.",
      )
    )
      return;
    const dialog = document.querySelector("#table-qr-dialog");
    const tableId = Number(dialog.dataset.tableId);
    try {
      const regenerated = await tableAction(
        `/api/admin/tables/${tableId}/regenerate-token`,
        { method: "POST" },
      );
      rememberTableLink(tableId, regenerated.accessPath);
      const accessLink = `${API_ORIGIN}${regenerated.accessPath}`;
      await loadTables();
      await openTableQr(tableId, accessLink);
      document.querySelector("#table-qr-message").textContent =
        "Nuovo QR generato. Il precedente non è più valido.";
    } catch (error) {
      document.querySelector("#table-qr-message").textContent = error.message;
    }
  });
document.querySelector("#close-table-cart-dialog").addEventListener("click", () => {
  document.querySelector("#table-cart-dialog").close();
});
document.querySelector("#reload-table-cart").addEventListener("click", () => {
  const dialog = document.querySelector("#table-cart-dialog");
  openTableCart(Number(dialog.dataset.tableId));
});

document.querySelector("#open-audit").addEventListener("click", async () => {
  openManager(auditManager, document.querySelector("#open-audit"));
  try {
    await loadAuditLog();
  } catch (error) {
    document.querySelector("#audit-message").textContent = error.message;
  }
});

document.querySelector("#reload-audit").addEventListener("click", async () => {
  try {
    await loadAuditLog();
  } catch (error) {
    document.querySelector("#audit-message").textContent = error.message;
  }
});

document.querySelector("#audit-filters").addEventListener("submit", async (event) => {
  event.preventDefault();
  auditOffset = 0;
  await loadAuditLog().catch((error) => {
    document.querySelector("#audit-message").textContent = error.message;
  });
});

document.querySelector("#reset-audit-filters").addEventListener("click", async () => {
  document.querySelector("#audit-filters").reset();
  auditOffset = 0;
  await loadAuditLog().catch((error) => {
    document.querySelector("#audit-message").textContent = error.message;
  });
});

document.querySelector("#audit-previous-page").addEventListener("click", async () => {
  auditOffset = Math.max(0, auditOffset - auditPageSize);
  await loadAuditLog();
  auditManager.scrollIntoView({ behavior: "smooth", block: "start" });
});

document.querySelector("#audit-next-page").addEventListener("click", async () => {
  if (auditOffset + auditPageSize >= auditTotal) return;
  auditOffset += auditPageSize;
  await loadAuditLog();
  auditManager.scrollIntoView({ behavior: "smooth", block: "start" });
});

document
  .querySelector("#new-user")
  .addEventListener("click", () => openUserForm());
document.querySelector("#users-list").addEventListener("click", (event) => {
  const button = event.target.closest(".edit-user");
  if (!button) return;
  const user = adminUsers.find(
    (item) => item.id === Number(button.dataset.userId),
  );
  if (user) openUserForm(user);
});
document
  .querySelector("#close-user-dialog")
  .addEventListener("click", () => userDialog.close());
document
  .querySelector("#cancel-user-edit")
  .addEventListener("click", () => userDialog.close());
userForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const id = Number(document.querySelector("#user-id").value);
  const password = document.querySelector("#user-password").value;
  const message = document.querySelector("#user-form-message");
  try {
    const response = await authenticatedFetch(
      id ? `/api/admin/users/${id}` : "/api/admin/users",
      {
        method: id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: document.querySelector("#user-username").value.trim(),
          role: document.querySelector("#user-role").value,
          isActive: document.querySelector("#user-active").checked,
          ...(password ? { password } : {}),
        }),
      },
    );
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || "Impossibile salvare l’utente");
    }
    await loadUsers();
    userDialog.close();
  } catch (error) {
    message.textContent = error.message;
    message.classList.add("error");
  }
});

logoutButton.addEventListener("click", async () => {
  await fetch(apiUrl("/api/auth/logout"), {
    method: "POST",
    credentials: "include",
  }).catch(() => undefined);
  clearTokens();
  showLogin("Sessione terminata.");
});

restoreSession();
