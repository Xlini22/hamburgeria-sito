function getProductIdFromUrl() {
  const url = new URL(window.location.href);
  const idFromQuery = url.searchParams.get('id');

  if (idFromQuery) {
    return idFromQuery;
  }

  const hashParams = new URLSearchParams(window.location.hash.replace('#', ''));
  return hashParams.get('id');
}

async function loadProductDetail() {
  const productId = getProductIdFromUrl();
  const message = document.getElementById('product-message');
  const detail = document.getElementById('product-detail');

  if (!productId) {
    message.textContent = `Id prodotto mancante nell URL. URL letto: ${window.location.href}`;
    message.className = 'text-danger';
    return;
  }

  try {
    const response = await fetch(`http://localhost:3000/api/products/${productId}`);

    if (!response.ok) {
      throw new Error(`Errore HTTP ${response.status}`);
    }

    const product = await response.json();

    detail.querySelector('.product-name').textContent = product.name;
    detail.querySelector('.product-description').textContent = product.description;
    detail.querySelector('.product-base_price').textContent = `€${product.base_price}`;
    detail.querySelector('.product-image').src = product.image_path;

    message.classList.add('d-none');
    detail.classList.remove('d-none');
  } catch (error) {
    message.textContent = 'Errore nel caricamento del prodotto';
    message.className = 'text-danger';
  }
}

document.addEventListener('DOMContentLoaded', loadProductDetail);
