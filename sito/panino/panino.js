const API_ORIGIN =
  window.BOURMET_API_URL ||
  (location.port === "5500" ? "http://localhost:3000" : location.origin);
const apiUrl = (path) => `${API_ORIGIN}${path}`;
const fallbackImage = "../../images/Locale/logo-bourmet.svg";
let galleryIndex = 0;
let galleryImages = [];
let galleryTouchStartX = 0;
let galleryTouchCurrentX = 0;
let galleryDragging = false;

const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

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
  if (!toggle || !nav) return;
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

function galleryImageUrl(image) {
  return image?.path
    ? apiUrl(`/${image.path.replace(/^\/+/, "")}`)
    : fallbackImage;
}

function showGalleryImage(index, animate = true) {
  if (!galleryImages.length) return;
  galleryIndex = Math.max(0, Math.min(galleryImages.length - 1, index));
  const track = document.querySelector("#product-gallery-track");
  track.style.transition = animate ? "" : "none";
  track.style.transform = `translate3d(-${galleryIndex * 100}%, 0, 0)`;
  document
    .querySelectorAll(".gallery-thumbnail")
    .forEach((thumbnail, thumbnailIndex) => {
      thumbnail.classList.toggle("active", thumbnailIndex === galleryIndex);
      thumbnail.setAttribute(
        "aria-current",
        thumbnailIndex === galleryIndex ? "true" : "false",
      );
    });
  document.querySelector("#gallery-prev").disabled = galleryIndex === 0;
  document.querySelector("#gallery-next").disabled =
    galleryIndex === galleryImages.length - 1;
}

function renderGallery(images, productName) {
  galleryImages = images.length
    ? images
    : [{ path: null, alt: `${productName} senza immagine` }];
  galleryIndex = 0;
  const track = document.querySelector("#product-gallery-track");
  track.innerHTML = galleryImages
    .map(
      (image, index) => `
        <img src="${escapeHtml(galleryImageUrl(image))}"
          alt="${escapeHtml(image.alt || `${productName}, foto ${index + 1}`)}"
          ${index < 2 ? 'loading="eager"' : 'loading="lazy"'}
          onerror="this.onerror=null;this.src='${fallbackImage}'" />`,
    )
    .join("");

  const multiple = galleryImages.length > 1;
  document.querySelector("#gallery-prev").hidden = !multiple;
  document.querySelector("#gallery-next").hidden = !multiple;
  document.querySelector("#product-gallery-thumbnails").innerHTML = multiple
    ? galleryImages
        .map(
          (image, index) => `
            <button class="gallery-thumbnail ${index === 0 ? "active" : ""}"
              type="button" data-gallery-index="${index}"
              aria-label="Mostra foto ${index + 1}">
              <img src="${escapeHtml(galleryImageUrl(image))}" alt="" />
            </button>`,
        )
        .join("")
    : "";
  showGalleryImage(0, false);
  requestAnimationFrame(() => {
    track.style.transition = "";
  });
}

function renderProduct(product) {
  const theme = detectTheme(product);
  const content = themeContent[theme];
  document.body.classList.add(`product-theme-${theme}`);
  document.title = `${product.name} | Bourmet`;

  renderGallery(product.images || [], product.name);

  document.querySelector("#product-label").textContent =
    product.categories[0]?.name || "Bourmet selection";
  document.querySelector("#product-name").textContent = product.name;
  document.querySelector("#product-availability").hidden = product.isAvailable;
  document.querySelector("#product-description").textContent =
    product.description || "Scopri questo prodotto della cucina Bourmet.";
  document.querySelector("#product-price").textContent = Number(
    product.price,
  ).toLocaleString("it-IT", {
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
  window.dispatchEvent(
    new CustomEvent("bourmet:product-loaded", { detail: product }),
  );
}

document.querySelector("#gallery-prev").addEventListener("click", () => {
  showGalleryImage(galleryIndex - 1);
});
document.querySelector("#gallery-next").addEventListener("click", () => {
  showGalleryImage(galleryIndex + 1);
});
document
  .querySelector("#product-gallery-thumbnails")
  .addEventListener("click", (event) => {
    const thumbnail = event.target.closest(".gallery-thumbnail");
    if (thumbnail) showGalleryImage(Number(thumbnail.dataset.galleryIndex));
  });

const galleryViewport = document.querySelector("#product-gallery-viewport");
galleryViewport.addEventListener(
  "touchstart",
  (event) => {
    if (galleryImages.length < 2) return;
    galleryTouchStartX = event.touches[0].clientX;
    galleryTouchCurrentX = galleryTouchStartX;
    galleryDragging = false;
  },
  { passive: true },
);
galleryViewport.addEventListener(
  "touchmove",
  (event) => {
    if (galleryImages.length < 2) return;
    const distance = event.touches[0].clientX - galleryTouchStartX;
    if (Math.abs(distance) < 5 && !galleryDragging) return;
    galleryDragging = true;
    galleryTouchCurrentX = event.touches[0].clientX;
    event.preventDefault();
    const width = galleryViewport.getBoundingClientRect().width;
    let movement = distance;
    if (
      (galleryIndex === 0 && distance > 0) ||
      (galleryIndex === galleryImages.length - 1 && distance < 0)
    ) {
      movement *= 0.25;
    }
    const track = document.querySelector("#product-gallery-track");
    track.style.transition = "none";
    track.style.transform = `translate3d(${-galleryIndex * width + movement}px, 0, 0)`;
  },
  { passive: false },
);

function finishGallerySwipe() {
  if (!galleryDragging) return;
  const distance = galleryTouchCurrentX - galleryTouchStartX;
  const threshold = galleryViewport.getBoundingClientRect().width * 0.16;
  const nextIndex =
    Math.abs(distance) > threshold
      ? galleryIndex + (distance < 0 ? 1 : -1)
      : galleryIndex;
  document.querySelector("#product-gallery-track").style.transition = "";
  galleryDragging = false;
  showGalleryImage(nextIndex);
}

galleryViewport.addEventListener("touchend", (event) => {
  if (event.changedTouches[0]) {
    galleryTouchCurrentX = event.changedTouches[0].clientX;
  }
  finishGallerySwipe();
});
galleryViewport.addEventListener("touchcancel", finishGallerySwipe);

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
      throw new Error(
        response.status === 404
          ? "not-found"
          : response.status === 503
            ? "database-unavailable"
            : "server",
      );
    }
    renderProduct(await response.json());
  } catch (error) {
    console.error("Impossibile caricare il prodotto:", error);
    showError(
      error.message === "not-found"
        ? "Questo prodotto non è più presente nel menu."
        : error.message === "database-unavailable"
          ? "Il prodotto non è disponibile perché il database è temporaneamente offline. Riprova tra poco."
        : "Verifica che il server NestJS sia avviato e riprova.",
    );
  }
}

setupNavigation();
loadProduct();
