// Flores.js - Load flowers with filters

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
        'hortensias': 'Hydrangeas / Hortensias',
        'tulipanes': 'Tulips / Tulipanes',
        'rosas': 'Roses / Rosas',
        'otras': 'Other Flowers / Otras Flores'
    };
    return names[category] || category;
}

// Load and render flowers
async function renderFlowers() {
    const grid = document.getElementById('flowersGrid');
    if (!grid) return;
    
    try {
        grid.innerHTML = '<div class="loading">Loading flowers... / Cargando flores...</div>';
        
        const response = await fetch('data/products.json');
        if (!response.ok) throw new Error('Error loading products');
        
        const data = await response.json();
        const flores = data.flores || [];
        
        grid.innerHTML = flores.map(product => `
            <div class="catalog-item" data-category="${product.category}">
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
                        <a href="https://wa.me/573209781661?text=Hi, I'm interested in ${encodeURIComponent(product.name)} - ${formatPrice(product.price, product.currency)}" 
                           target="_blank" 
                           class="catalog-btn">
                            <i class="fab fa-whatsapp"></i> Request Quote
                        </a>
                    </div>
                </div>
            </div>
        `).join('');
        
        // Initialize filters
        initFilters();
        
    } catch (error) {
        console.error('Error:', error);
        grid.innerHTML = '<div class="error-message">Error loading flowers / Error al cargar flores</div>';
    }
}

// Filter functionality
function initFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const items = document.querySelectorAll('.catalog-item');
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active button
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const filter = btn.dataset.filter;
            
            // Filter items
            items.forEach(item => {
                if (filter === 'all' || item.dataset.category === filter) {
                    item.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', renderFlowers);
