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
const productPages = document.querySelectorAll(".product-track .product-grid");
const previousProducts = document.querySelector(".carousel-prev");
const nextProducts = document.querySelector(".carousel-next");
let currentProductPage = 0;

function showProductPage(page) {
  currentProductPage = (page + productPages.length) % productPages.length;
  productTrack.style.transform = `translateX(-${currentProductPage * 100}%)`;
  updateCarouselControls();
}

previousProducts.addEventListener("click", () =>
  showProductPage(currentProductPage - 1),
);
nextProducts.addEventListener("click", () => {
  const isLastPage = currentProductPage === productPages.length - 1;
  showProductPage(isLastPage ? 0 : currentProductPage + 1);
});

function updateCarouselControls() {
  const isFirstPage = currentProductPage === 0;
  const isLastPage = currentProductPage === productPages.length - 1;

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

updateCarouselControls();

let touchStartX = 0;
let touchStartY = 0;
let touchCurrentX = 0;
let touchStartTime = 0;
let isDraggingProducts = false;
let suppressProductClick = false;

productTrack.addEventListener(
  "touchstart",
  (event) => {
    if (!window.matchMedia("(max-width: 720px)").matches) return;
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
    if (!window.matchMedia("(max-width: 720px)").matches) return;
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
