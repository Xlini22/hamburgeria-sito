const toggle = document.querySelector('.nav-toggle');
const nav = document.querySelector('.nav');

toggle.addEventListener('click', () => {
  const isOpen = nav.classList.toggle('open');
  toggle.setAttribute('aria-expanded', String(isOpen));
});

nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  nav.classList.remove('open');
  toggle.setAttribute('aria-expanded', 'false');
}));

const productTrack = document.querySelector('.product-track');
const productPages = document.querySelectorAll('.product-track .product-grid');
const previousProducts = document.querySelector('.carousel-prev');
const nextProducts = document.querySelector('.carousel-next');
let currentProductPage = 0;

function showProductPage(page) {
  currentProductPage = (page + productPages.length) % productPages.length;
  productTrack.style.transform = `translateX(-${currentProductPage * 100}%)`;
}

previousProducts.addEventListener('click', () => showProductPage(currentProductPage - 1));
nextProducts.addEventListener('click', () => showProductPage(currentProductPage + 1));
