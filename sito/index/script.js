const API_ORIGIN =
  window.BOURMET_API_URL ||
  (location.port === "5500" ? "http://localhost:3000" : location.origin);
const apiUrl = (path) => `${API_ORIGIN}${path}`;
const fallbackImage = "../../images/Locale/logo-bourmet.svg";

const toggle = document.querySelector(".nav-toggle");
const nav = document.querySelector(".nav");
toggle.addEventListener("click", () => {
  const isOpen = nav.classList.toggle("open");
  toggle.setAttribute("aria-expanded", String(isOpen));
});
nav.querySelectorAll("a").forEach((link) =>
  link.addEventListener("click", () => {
    nav.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
  }),
);

const productTrack = document.querySelector(".product-track");
const previousProducts = document.querySelector(".carousel-prev");
const nextProducts = document.querySelector(".carousel-next");
const sliderButtons = document.querySelector(".slider-buttons");
let productPages = [];
let currentProductPage = 0;
let touchStartX = 0;
let touchStartY = 0;
let touchCurrentX = 0;
let touchStartTime = 0;
let isDraggingProducts = false;
let suppressProductClick = false;

const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

function imageUrl(image) {
  return image?.path
    ? apiUrl(`/${image.path.replace(/^\/+/, "")}`)
    : fallbackImage;
}

function productCard(product) {
  return `
    <a class="product-card ${product.isAvailable ? "" : "unavailable"}" href="../panino/panino.html?slug=${encodeURIComponent(product.slug)}">
      ${product.isAvailable ? "" : '<span class="best-seller-availability">Non disponibile</span>'}
      <div class="food">
        <img src="${escapeHtml(imageUrl(product.image))}"
          alt="${escapeHtml(product.image?.alt || product.name)}"
          onerror="this.onerror=null;this.src='${fallbackImage}'" />
      </div>
      <h3>${escapeHtml(product.name)}</h3>
      <p>${escapeHtml(product.description || "Scopri il prodotto")}</p>
    </a>`;
}

function showProductPage(page) {
  if (!productPages.length) return;
  currentProductPage = Math.max(0, Math.min(productPages.length - 1, page));
  productTrack.style.transform = `translateX(-${currentProductPage * 100}%)`;
  updateCarouselControls();
}

function updateCarouselControls() {
  const isFirstPage = currentProductPage === 0;
  const isLastPage = currentProductPage === productPages.length - 1;
  sliderButtons.hidden = productPages.length <= 1;
  previousProducts.classList.toggle("is-hidden", isFirstPage);
  previousProducts.tabIndex = isFirstPage ? -1 : 0;
  nextProducts.classList.toggle("return-start", isLastPage);
  nextProducts.setAttribute(
    "aria-label",
    isLastPage
      ? "Torna ai primi quattro prodotti"
      : "Mostra i quattro prodotti successivi",
  );
}

function renderBestSellers(products) {
  if (!products.length) {
    productTrack.innerHTML =
      '<p class="carousel-status">I best seller verranno scelti presto. Nel frattempo scopri il menu completo.</p>';
    sliderButtons.hidden = true;
    return;
  }

  const pages = [];
  for (let index = 0; index < products.length; index += 4) {
    pages.push(products.slice(index, index + 4));
  }
  productTrack.innerHTML = pages
    .map(
      (productsOnPage) =>
        `<div class="product-grid">${productsOnPage.map(productCard).join("")}</div>`,
    )
    .join("");
  productPages = [...productTrack.querySelectorAll(".product-grid")];
  currentProductPage = 0;
  showProductPage(0);
}

previousProducts.addEventListener("click", () =>
  showProductPage(currentProductPage - 1),
);
nextProducts.addEventListener("click", () => {
  const isLastPage = currentProductPage === productPages.length - 1;
  showProductPage(isLastPage ? 0 : currentProductPage + 1);
});

productTrack.addEventListener(
  "touchstart",
  (event) => {
    if (
      !window.matchMedia("(max-width: 720px)").matches ||
      productPages.length <= 1
    )
      return;
    const touch = event.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    touchCurrentX = touch.clientX;
    touchStartTime = performance.now();
    isDraggingProducts = false;
  },
  { passive: true },
);

productTrack.addEventListener(
  "touchmove",
  (event) => {
    if (
      !window.matchMedia("(max-width: 720px)").matches ||
      productPages.length <= 1
    )
      return;
    const touch = event.touches[0];
    const distanceX = touch.clientX - touchStartX;
    const distanceY = touch.clientY - touchStartY;
    if (!isDraggingProducts && Math.abs(distanceX) <= Math.abs(distanceY))
      return;

    isDraggingProducts = true;
    touchCurrentX = touch.clientX;
    event.preventDefault();
    const pageWidth = productTrack.getBoundingClientRect().width;
    let dragDistance = distanceX;
    const isBeyondFirst = currentProductPage === 0 && distanceX > 0;
    const isBeyondLast =
      currentProductPage === productPages.length - 1 && distanceX < 0;
    if (isBeyondFirst || isBeyondLast) dragDistance *= 0.28;
    productTrack.style.transition = "none";
    productTrack.style.transform = `translate3d(${-currentProductPage * pageWidth + dragDistance}px, 0, 0)`;
  },
  { passive: false },
);

function finishProductDrag() {
  if (!isDraggingProducts) return;
  const distanceX = touchCurrentX - touchStartX;
  const pageWidth = productTrack.getBoundingClientRect().width;
  const elapsed = Math.max(performance.now() - touchStartTime, 1);
  const velocity = Math.abs(distanceX) / elapsed;
  const shouldChangePage =
    Math.abs(distanceX) > pageWidth * 0.18 || velocity > 0.45;
  let targetPage = currentProductPage;
  if (shouldChangePage) targetPage += distanceX < 0 ? 1 : -1;
  targetPage = Math.max(0, Math.min(productPages.length - 1, targetPage));
  productTrack.style.transition = "";
  suppressProductClick = true;
  showProductPage(targetPage);
  isDraggingProducts = false;
  window.setTimeout(() => {
    suppressProductClick = false;
  }, 350);
}

productTrack.addEventListener("touchend", (event) => {
  if (!window.matchMedia("(max-width: 720px)").matches) return;
  if (event.changedTouches[0]) touchCurrentX = event.changedTouches[0].clientX;
  finishProductDrag();
});
productTrack.addEventListener("touchcancel", finishProductDrag);
productTrack.addEventListener(
  "click",
  (event) => {
    if (suppressProductClick) event.preventDefault();
  },
  true,
);

async function loadBestSellers() {
  try {
    const response = await fetch(apiUrl("/api/products/best-sellers"));
    if (!response.ok) {
      throw new Error(
        response.status === 503 ? "database-unavailable" : "server-error",
      );
    }
    renderBestSellers(await response.json());
  } catch (error) {
    console.error("Impossibile caricare i best seller:", error);
    productTrack.innerHTML =
      `<p class="carousel-status">${
        error.message === "database-unavailable"
          ? "I prodotti non sono disponibili perché il database è temporaneamente offline. Riprova tra poco."
          : "I prodotti non sono disponibili. Verifica che il server NestJS sia avviato."
      }</p>`;
    sliderButtons.hidden = true;
  }
}

loadBestSellers();
