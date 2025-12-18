// Sistema de Carrinho Funcional - LocalStorage
class ShoppingCart {
  constructor() {
    this.storageKey = 'teodorofit_cart';
    this.cart = this.loadCart();
  }

  // Carregar carrinho do localStorage
  loadCart() {
    const stored = localStorage.getItem(this.storageKey);
    return stored ? JSON.parse(stored) : [];
  }

  // Salvar carrinho no localStorage
  saveCart() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.cart));
    this.notifyCartChange();
  }

  // Adicionar produto ao carrinho
  addProduct(product) {
    // Verificar se produto já existe no carrinho
    const existingProduct = this.cart.find(item => item.id === product.id);

    if (existingProduct) {
      existingProduct.quantity += product.quantity || 1;
    } else {
      this.cart.push({
        id: product.id,
        title: product.title,
        price: product.price,
        image: product.image,
        quantity: product.quantity || 1
      });
    }

    this.saveCart();
  }

  // Remover produto do carrinho
  removeProduct(productId) {
    this.cart = this.cart.filter(item => item.id !== productId);
    this.saveCart();
  }

  // Atualizar quantidade do produto
  updateQuantity(productId, quantity) {
    const product = this.cart.find(item => item.id === productId);
    if (product) {
      if (quantity <= 0) {
        this.removeProduct(productId);
      } else {
        product.quantity = quantity;
        this.saveCart();
      }
    }
  }

  // Limpar carrinho
  clearCart() {
    this.cart = [];
    this.saveCart();
  }

  // Obter total do carrinho
  getTotal() {
    return this.cart.reduce((total, item) => {
      const itemPrice = parseFloat(item.price.replace(/[^0-9.]/g, ''));
      return total + (itemPrice * item.quantity);
    }, 0);
  }

  // Obter quantidade de itens
  getItemCount() {
    return this.cart.reduce((count, item) => count + item.quantity, 0);
  }

  // Obter carrinho
  getCart() {
    return this.cart;
  }

  // Verificar se carrinho está vazio
  isEmpty() {
    return this.cart.length === 0;
  }

  // Notificar mudanças no carrinho
  notifyCartChange() {
    // Disparar evento customizado
    window.dispatchEvent(new CustomEvent('cartUpdated', {
      detail: {
        cart: this.cart,
        total: this.getTotal(),
        itemCount: this.getItemCount()
      }
    }));

    // Atualizar ícone do carrinho na navbar
    this.updateCartIcon();
  }

  // Atualizar ícone do carrinho
  updateCartIcon() {
    const cartIcon = document.querySelector('.navbar-cta .nav-link img');
    const itemCount = this.getItemCount();

    if (itemCount > 0) {
      // Adicionar badge com quantidade
      let badge = document.getElementById('cart-badge');
      if (!badge) {
        badge = document.createElement('span');
        badge.id = 'cart-badge';
        badge.style.cssText = `
          position: absolute;
          top: -8px;
          right: -8px;
          background-color: #ef5734;
          color: white;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: bold;
        `;
        const cartLink = document.querySelector('.navbar-cta .nav-link');
        if (cartLink) {
          cartLink.style.position = 'relative';
          cartLink.appendChild(badge);
        }
      }
      badge.textContent = itemCount;
    }
  }

  // Exportar carrinho para objeto formatado
  exportCart() {
    return {
      items: this.cart,
      total: this.getTotal().toFixed(2),
      itemCount: this.getItemCount(),
      timestamp: new Date().toISOString()
    };
  }
}

// Inicializar carrinho globalmente
const cart = new ShoppingCart();

// Sincronizar carrinho entre abas
window.addEventListener('storage', (event) => {
  if (event.key === cart.storageKey) {
    console.log('🔄 Carrinho atualizado em outra aba');
    cart.cart = cart.loadCart();
    cart.notifyCartChange();
  }
});

// Atualizar ícone ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
  cart.updateCartIcon();
});

// ============ FUNÇÕES AUXILIARES ============

// Adicionar produto ao carrinho (chamada do HTML)
function addToCart(productId, title, price, image, quantity = 1) {
  console.log(`🛒 Tentando adicionar: ${title} (${productId}) - Preço: ${price} - Qtd: ${quantity}`);

  cart.addProduct({
    id: productId,
    title: title,
    price: price,
    image: image,
    quantity: quantity
  });

  // Mostrar mensagem de sucesso
  showCartNotification(`"${title}" adicionado ao carrinho!`);
}

// Mostrar notificação
function showCartNotification(message, type = 'success') {
  const notification = document.createElement('div');
  const bgClass = type === 'error' ? 'alert-danger' : 'alert-success';
  notification.className = `alert ${bgClass} alert-dismissible fade show`;
  notification.role = 'alert';
  notification.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 9999;
    max-width: 400px;
    animation: slideIn 0.3s ease-in-out;
  `;

  document.body.appendChild(notification);

  // Remove após 4 segundos
  setTimeout(() => {
    notification.remove();
  }, 4000);
}

// Adicionar estilos para animação
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }

  .alert-dismissible.fade {
    animation: slideOut 0.3s ease-in-out forwards;
  }

  .alert-dismissible.fade.show {
    animation: slideIn 0.3s ease-in-out forwards;
  }
`;
document.head.appendChild(style);
