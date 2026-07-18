const API_ORIGIN =
  window.BOURMET_API_URL ||
  (location.port === "3000" ? location.origin : "http://localhost:3000");
const apiUrl = (path) => `${API_ORIGIN}${path}`;
const fallbackImage = "../../images/Locale/logo-bourmet.svg";

const themeContent = {
  burgers: {
    serving: "Preparato al momento",
    title:
      "Carne selezionata.<br>Pane artigianale.<br><em>Gusto senza compromessi.</em>",
    copy: "Preparato espresso ogni giorno nella nostra cucina.",
  },
  sides: {
    serving: "Preparato al momento",
    title: "Dorato.<br>Croccante.<br><em>Tutto da condividere.</em>",
    copy: "Fritti e insalatone preparati al momento con ingredienti selezionati.",
  },
  desserts: {
    serving: "Fatto in casa",
    title: "Cremoso.<br>Goloso.<br><em>Irresistibile.</em>",
    copy: "Il finale perfetto, preparato con tutta la cura della nostra cucina.",
  },
  drinks: {
    serving: "Servita fresca",
    title: "Fresca.<br>Dissetante.<br><em>Perfetta con il tuo menu.</em>",
    copy: "La bevanda giusta per accompagnare ogni prodotto Bourmet.",
  },
};

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

function detectTheme(product) {
  const configuredTheme = product.categories.find((category) =>
    Object.hasOwn(themeContent, category.theme),
  )?.theme;
  if (configuredTheme) return configuredTheme;
  const words = product.categories
    .map((category) => `${category.slug} ${category.name}`.toLowerCase())
    .join(" ");
  if (/dolc|dessert|cake/.test(words)) return "desserts";
  if (/fritt|insalat|contorn/.test(words)) return "sides";
  if (/bibit|drink|bevande/.test(words)) return "drinks";
  return "burgers";
}

function renderList(selector, items, emptyLabel) {
  const list = document.querySelector(selector);
  list.replaceChildren();
  if (!items.length) {
    const item = document.createElement("li");
    item.textContent = emptyLabel;
    list.append(item);
    return;
  }
  items.forEach(({ name }) => {
    const item = document.createElement("li");
    item.textContent = name;
    list.append(item);
  });
}

function renderProduct(product) {
  const theme = detectTheme(product);
  const content = themeContent[theme];
  document.body.classList.add(`product-theme-${theme}`);
  document.title = `${product.name} | Bourmet`;

  const image = document.querySelector("#product-image");
  image.src = product.images[0]?.path
    ? apiUrl(`/${product.images[0].path.replace(/^\/+/, "")}`)
    : fallbackImage;
  image.alt = product.images[0]?.alt || product.name;
  image.onerror = () => {
    image.onerror = null;
    image.src = fallbackImage;
  };

  document.querySelector("#product-label").textContent =
    product.categories[0]?.name || "Bourmet selection";
  document.querySelector("#product-name").textContent = product.name;
  document.querySelector("#product-description").textContent =
    product.description || "Scopri questo prodotto della cucina Bourmet.";
  document.querySelector("#product-price").textContent =
    Number(product.price).toLocaleString("it-IT", {
      style: "currency",
      currency: "EUR",
    });
  renderList(
    "#product-ingredients",
    product.ingredients || [],
    "Ingredienti in aggiornamento",
  );
  renderList(
    "#product-allergens",
    product.allergens || [],
    "Allergeni non indicati",
  );
  document.querySelector("#product-serving").textContent = content.serving;
  document.querySelector("#product-note-title").innerHTML = content.title;
  document.querySelector("#product-note-copy").textContent = content.copy;
}

function showError(message) {
  document.title = "Prodotto non disponibile | Bourmet";
  document.querySelector("#product-label").textContent = "Bourmet";
  document.querySelector("#product-name").textContent =
    "Prodotto non disponibile";
  document.querySelector("#product-description").textContent = message;
  document.querySelector("#product-price").textContent = "";
  document.querySelector("#product-serving").textContent = "";
  renderList("#product-ingredients", [], "Nessuna informazione disponibile");
  renderList("#product-allergens", [], "Nessuna informazione disponibile");
}

async function loadProduct() {
  const params = new URLSearchParams(location.search);
  const slug = params.get("slug") || params.get("panino");
  if (!slug) {
    showError("Apri un prodotto dalla pagina del menu.");
    return;
  }

  try {
    const response = await fetch(
      apiUrl(`/api/products/${encodeURIComponent(slug)}`),
    );
    if (!response.ok) {
      throw new Error(response.status === 404 ? "not-found" : "server");
    }
    renderProduct(await response.json());
  } catch (error) {
    console.error("Impossibile caricare il prodotto:", error);
    showError(
      error.message === "not-found"
        ? "Questo prodotto non è più presente nel menu."
        : "Verifica che il server NestJS sia avviato e riprova.",
    );
  }
}

setupNavigation();
loadProduct();
