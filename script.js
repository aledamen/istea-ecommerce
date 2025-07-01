'use strict';

const productList = document.getElementById('productList');
const searchInput = document.getElementById('searchInput');
const productModal = new bootstrap.Modal(document.getElementById('productModal'));
const productModalLabel = document.getElementById('productModalLabel');
const productModalImage = document.getElementById('productModalImage');
const productModalDescription = document.getElementById('productModalDescription');
const productModalPrice = document.getElementById('productModalPrice');
const addToCartBtn = document.getElementById('addToCartBtn');

const cartBtn = document.getElementById('cartBtn');
const cartCount = document.getElementById('cartCount');
const cartSidebarEl = document.getElementById('cartSidebar');
const cartSidebar = new bootstrap.Offcanvas(cartSidebarEl);
const cartItems = document.getElementById('cartItems');
const clearCartBtn = document.getElementById('clearCartBtn');
const checkoutBtn = document.getElementById('checkoutBtn');

let products = [];
let filteredProducts = [];
let cart = {};
let currentModalProductId = null;

async function fetchProducts() {
  try {
    const res = await fetch('https://fakestoreapi.com/products');
    products = await res.json();
    filteredProducts = products;
    renderProducts(filteredProducts);
  } catch (error) {
    Swal.fire('Error', 'No se pudieron cargar los productos', 'error');
  }
}

function renderProducts(productsToRender) {
  productList.innerHTML = '';

  if (productsToRender.length === 0) {
    productList.innerHTML = '<p class="text-center fs-5">No se encontraron productos.</p>';
    return;
  }

  productsToRender.forEach(product => {
    const card = document.createElement('article');
    card.className = 'card';
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `Ver detalles del producto ${product.title}`);

    card.innerHTML = `
      <img src="${product.image}" alt="${product.title}" loading="lazy" />
      <div class="card-body">
        <h3 class="card-title">${product.title}</h3>
        <p class="card-text">${product.description.substring(0, 60)}...</p>
        <p class="price">$${product.price.toFixed(2)}</p>
      </div>
    `;

    card.addEventListener('click', () => openProductModal(product.id));
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openProductModal(product.id);
      }
    });

    productList.appendChild(card);
  });
}

function openProductModal(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;

  currentModalProductId = productId;
  productModalLabel.textContent = product.title;
  productModalImage.src = product.image;
  productModalImage.alt = product.title;
  productModalDescription.textContent = product.description;
  productModalPrice.textContent = `$${product.price.toFixed(2)}`;
  addToCartBtn.focus();
  productModal.show();
}

function loadCart() {
  const savedCart = localStorage.getItem('cart');
  if (savedCart) {
    try {
      cart = JSON.parse(savedCart);
    } catch {
      cart = {};
    }
  }
  updateCartCount();
  renderCartItems();
}

function saveCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
}

function addToCart(productId) {
  if (!cart[productId]) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    cart[productId] = {
      id: product.id,
      title: product.title,
      price: product.price,
      image: product.image,
      quantity: 1
    };
  } else {
    cart[productId].quantity++;
  }

  saveCart();
  updateCartCount();
  Swal.fire({
    icon: 'success',
    title: '¡Producto agregado!',
    text: `${cart[productId].title} se agregó al carrito.`,
    timer: 1500,
    showConfirmButton: false,
    toast: true,
    position: 'top-end'
  });
  renderCartItems();
}

function updateCartCount() {
  const count = Object.values(cart).reduce((acc, item) => acc + item.quantity, 0);
  cartCount.textContent = count;
  cartCount.style.display = count > 0 ? 'inline-block' : 'none';
}

function renderCartItems() {
  cartItems.innerHTML = '';

  if (Object.keys(cart).length === 0) {
    cartItems.innerHTML = `<p class="text-center mt-3">Tu carrito está vacío.</p>`;
    return;
  }

  Object.values(cart).forEach(item => {
    const div = document.createElement('div');
    div.className = 'list-group-item d-flex align-items-center gap-3';

    div.innerHTML = `
      <img src="${item.image}" alt="${item.title}" style="width: 60px; height: 60px; object-fit: contain; border-radius: 0.3rem;" />
      <div class="flex-grow-1">
        <h6 class="mb-1">${item.title}</h6>
        <p class="mb-1 price">$${item.price.toFixed(2)}</p>
        <div class="quantity-controls btn-group btn-group-sm" role="group" aria-label="Controles de cantidad para ${item.title}">
          <button class="btn btn-outline-secondary btn-decrease" aria-label="Disminuir cantidad" data-id="${item.id}">−</button>
          <span class="btn btn-outline-secondary disabled">${item.quantity}</span>
          <button class="btn btn-outline-secondary btn-increase" aria-label="Aumentar cantidad" data-id="${item.id}">+</button>
        </div>
      </div>
      <button class="btn btn-outline-danger btn-sm btn-remove" aria-label="Eliminar ${item.title} del carrito" data-id="${item.id}">
        <i class="bi bi-trash-fill"></i>
      </button>
    `;

    cartItems.appendChild(div);
  });

  cartItems.querySelectorAll('.btn-increase').forEach(btn =>
    btn.addEventListener('click', () => changeQuantity(btn.dataset.id, 1))
  );
  cartItems.querySelectorAll('.btn-decrease').forEach(btn =>
    btn.addEventListener('click', () => changeQuantity(btn.dataset.id, -1))
  );
  cartItems.querySelectorAll('.btn-remove').forEach(btn =>
    btn.addEventListener('click', () => removeFromCart(btn.dataset.id))
  );
}

function changeQuantity(productId, delta) {
  if (!cart[productId]) return;

  cart[productId].quantity += delta;
  if (cart[productId].quantity <= 0) {
    delete cart[productId];
  }
  saveCart();
  updateCartCount();
  renderCartItems();
}

function removeFromCart(productId) {
  if (!cart[productId]) return;
  delete cart[productId];
  saveCart();
  updateCartCount();
  renderCartItems();
}

function clearCart() {
  if (Object.keys(cart).length === 0) return;

  Swal.fire({
    title: '¿Estás seguro?',
    text: "Se eliminarán todos los productos del carrito.",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc3545',
    cancelButtonColor: '#6c757d',
    confirmButtonText: 'Sí, vaciar carrito',
    cancelButtonText: 'Cancelar'
  }).then(result => {
    if (result.isConfirmed) {
      cart = {};
      saveCart();
      updateCartCount();
      renderCartItems();
      Swal.fire('¡Listo!', 'El carrito ha sido vaciado.', 'success');
    }
  });
}

// Finalizar compra (simulación)
function checkout() {
  if (Object.keys(cart).length === 0) {
    Swal.fire('Carrito vacío', 'Agrega productos antes de finalizar la compra.', 'info');
    return;
  }

  Swal.fire({
    title: '¿Confirmar compra?',
    text: `Total: $${calculateTotal().toFixed(2)}`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Sí, comprar',
    cancelButtonText: 'Cancelar'
  }).then(result => {
    if (result.isConfirmed) {
      cart = {};
      saveCart();
      updateCartCount();
      renderCartItems();
      cartSidebar.hide();
      Swal.fire('¡Compra exitosa!', 'Gracias por tu compra.', 'success');
    }
  });
}

function calculateTotal() {
  return Object.values(cart).reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function handleSearch() {
  const term = searchInput.value.trim().toLowerCase();
  filteredProducts = products.filter(p =>
    p.title.toLowerCase().includes(term) || p.description.toLowerCase().includes(term)
  );
  renderProducts(filteredProducts);
}

function init() {
  fetchProducts();
  loadCart();

  searchInput.addEventListener('input', handleSearch);
  addToCartBtn.addEventListener('click', () => {
    if (currentModalProductId) {
      addToCart(currentModalProductId);
      productModal.hide();
    }
  });

  cartBtn.addEventListener('click', () => cartSidebar.toggle());
  clearCartBtn.addEventListener('click', clearCart);
  checkoutBtn.addEventListener('click', checkout);
}

init();
