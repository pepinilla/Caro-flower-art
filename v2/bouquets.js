// Bouquets.js - Carga productos de bouquets desde el JSON con precios

// Función para formatear precio
function formatPrice(price, currency = 'COP') {
    if (currency === 'COP') {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(price);
    }
    return `$${price.toLocaleString()}`;
}

// Función para obtener nombre de categoría
function getBouquetCategoryName(category) {
    const names = {
        'wedding': 'Wedding Bouquets',
        'mini': 'Ramos Mini',
        'ocasion': 'Cualquier Ocasión'
    };
    return names[category] || category;
}

// Función para renderizar bouquets
async function renderBouquets() {
    const grid = document.getElementById('bouquetsGrid');
    if (!grid) return;
    
    try {
        // Mostrar loading
        grid.innerHTML = '<div class="loading">Cargando productos...</div>';
        
        // Fetch productos desde JSON
        const response = await fetch('data/products.json');
        if (!response.ok) throw new Error('Error al cargar productos');
        
        const data = await response.json();
        const productos = data.bouquets;
        
        // Renderizar productos
        grid.innerHTML = productos.map(product => `
            <div class="product-card ${!product.available ? 'out-of-stock' : ''}" data-category="${product.category}">
                <div class="product-image">
                    <img src="${product.image}" alt="${product.name}" loading="lazy"
                         onerror="this.src='images/placeholder.jpg'">
                    ${product.badge ? `<span class="product-badge">${product.badge}</span>` : ''}
                    ${!product.available ? '<span class="product-badge out-of-stock-badge">Agotado</span>' : ''}
                </div>
                <div class="product-content">
                    <div class="product-category">${getBouquetCategoryName(product.category)}</div>
                    <h3 class="product-title">${product.name}</h3>
                    <p class="product-description">${product.description}</p>
                    <div class="product-price">
                        <span class="price">${formatPrice(product.price, product.currency)}</span>
                    </div>
                    <div class="product-footer">
                        <a href="https://instagram.com/caroflowerart" target="_blank">
                            <i class="fab fa-instagram"></i> Instagram
                        </a>
                        <a href="https://wa.me/573209781661?text=Hola, me interesa ${product.name} - ${formatPrice(product.price, product.currency)}" 
                           target="_blank"
                           class="${!product.available ? 'disabled' : ''}">
                            <i class="fab fa-whatsapp"></i> ${product.available ? 'Consultar' : 'Agotado'}
                        </a>
                    </div>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error:', error);
        grid.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <p>Error al cargar los productos. Por favor, intenta de nuevo más tarde.</p>
            </div>
        `;
    }
}

// Inicializar cuando el DOM esté listo
if (document.getElementById('bouquetsGrid')) {
    document.addEventListener('DOMContentLoaded', renderBouquets);
}
