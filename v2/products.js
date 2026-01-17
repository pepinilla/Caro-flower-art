// Products.js - Load all products from JSON

// Format price
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

// Category names
function getCategoryName(category) {
    const names = {
        'hortensias': 'Hortensias',
        'tulipanes': 'Tulipanes / Tulips',
        'rosas': 'Rosas / Roses',
        'otras': 'Otras Flores / Other Flowers',
        'wedding': 'Wedding Bouquets / Ramos de Boda',
        'mini': 'Ramos Mini / Mini Bouquets',
        'ocasion': 'Cualquier Ocasión / Any Occasion'
    };
    return names[category] || category;
}

// Load products data
async function loadProducts() {
    try {
        const response = await fetch('data/products.json');
        if (!response.ok) throw new Error('Error loading products');
        return await response.json();
    } catch (error) {
        console.error('Error:', error);
        return { flores: [], bouquets: [] };
    }
}

// Render flowers catalog
async function renderFlowersCatalog() {
    const container = document.getElementById('flowersCatalog');
    if (!container) return;
    
    const data = await loadProducts();
    const flowers = data.flores || [];
    
    container.innerHTML = flowers.map(product => `
        <div class="catalog-item">
            <div class="catalog-image">
                <img src="${product.image}" alt="${product.name}" loading="lazy">
                ${product.badge ? `<span class="catalog-badge">${product.badge}</span>` : ''}
            </div>
            <div class="catalog-content">
                <div class="catalog-category">${getCategoryName(product.category)}</div>
                <h3 class="catalog-title">${product.name}</h3>
                <p class="catalog-description">${product.description}</p>
                <div class="catalog-price">${formatPrice(product.price, product.currency)}</div>
                <div class="catalog-footer">
                    <a href="https://wa.me/573209781661?text=Hi, I'm interested in ${product.name} - ${formatPrice(product.price, product.currency)}" 
                       target="_blank" 
                       class="catalog-btn">
                        <i class="fab fa-whatsapp"></i> Request Quote / Pedir Cotización
                    </a>
                </div>
            </div>
        </div>
    `).join('');
}

// Render roses catalog (filter by roses category)
async function renderRosesCatalog() {
    const container = document.getElementById('rosesCatalog');
    if (!container) return;
    
    const data = await loadProducts();
    const roses = (data.flores || []).filter(p => p.category === 'rosas');
    
    container.innerHTML = roses.map(product => `
        <div class="catalog-item">
            <div class="catalog-image">
                <img src="${product.image}" alt="${product.name}" loading="lazy">
                ${product.badge ? `<span class="catalog-badge">${product.badge}</span>` : ''}
            </div>
            <div class="catalog-content">
                <div class="catalog-category">Rosas / Roses</div>
                <h3 class="catalog-title">${product.name}</h3>
                <p class="catalog-description">${product.description}</p>
                <div class="catalog-price">${formatPrice(product.price, product.currency)}</div>
                <div class="catalog-footer">
                    <a href="https://wa.me/573209781661?text=Hi, I'm interested in ${product.name} - ${formatPrice(product.price, product.currency)}" 
                       target="_blank" 
                       class="catalog-btn">
                        <i class="fab fa-whatsapp"></i> Request Quote / Pedir Cotización
                    </a>
                </div>
            </div>
        </div>
    `).join('');
}

// Render gallery grid
async function renderGallery() {
    const container = document.getElementById('galleryGrid');
    if (!container) return;
    
    const data = await loadProducts();
    const allProducts = [...(data.flores || []), ...(data.bouquets || [])];
    
    container.innerHTML = allProducts.map(product => `
        <div class="gallery-item" data-category="${product.category}">
            <img src="${product.image}" alt="${product.name}" loading="lazy">
            <div class="gallery-item-overlay">
                <h3 class="gallery-item-title">${product.name}</h3>
            </div>
        </div>
    `).join('');
    
    // Filter functionality
    initGalleryFilters();
}

// Gallery filter tabs
function initGalleryFilters() {
    const tabs = document.querySelectorAll('.tab-btn');
    const items = document.querySelectorAll('.gallery-item');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const filter = tab.dataset.filter;
            
            // Update active tab
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Filter items
            items.forEach(item => {
                if (filter === 'all') {
                    item.style.display = 'block';
                } else if (filter === 'flowers') {
                    // Show all flores categories
                    const isFlower = ['hortensias', 'tulipanes', 'rosas', 'otras'].includes(item.dataset.category);
                    item.style.display = isFlower ? 'block' : 'none';
                } else if (filter === 'bouquets') {
                    // Show all bouquet categories
                    const isBouquet = ['wedding', 'mini', 'ocasion'].includes(item.dataset.category);
                    item.style.display = isBouquet ? 'block' : 'none';
                }
            });
        });
    });
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    renderGallery();
    renderFlowersCatalog();
    renderRosesCatalog();
});
