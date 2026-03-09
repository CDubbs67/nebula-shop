const defaultItems = [
    {
        id: 1,
        name: "Cyber Pulse Blade",
        description: "A high-frequency vibration blade infused with cosmic energy. Deals massive damage to digital constructs.",
        price: 150,
        image: "assets/cyber_sword.png"
    },
    {
        id: 2,
        name: "Aegis Hex-Shield",
        description: "Deployable hexagonal barrier that absorbs incoming projectile energy and converts it to heat.",
        price: 120,
        image: "assets/energy_shield.png"
    },
    {
        id: 3,
        name: "Singularity Core",
        description: "A contained miniature black hole that provides endless power to advanced tech modules.",
        price: 300,
        image: "assets/power_core.png"
    }
];

let customItems = JSON.parse(localStorage.getItem('nebula_custom_items')) || [];
let deletedIds = JSON.parse(localStorage.getItem('nebula_deleted_ids')) || [];
let shopItems = [...defaultItems, ...customItems].filter(item => !deletedIds.includes(item.id));

let balance = parseInt(localStorage.getItem('nebula_balance')) || 500;
let inventory = JSON.parse(localStorage.getItem('nebula_inventory')) || [];

const adminPass = "admin123";
const balanceDisplay = document.getElementById('balance-display');
const shopGrid = document.getElementById('shop-grid');
const inventoryGrid = document.getElementById('inventory-grid');
const notification = document.getElementById('notification');
const adminPassInput = document.getElementById('admin-pass');
const adminLoginBtn = document.getElementById('admin-login-btn');
const adminLink = document.getElementById('admin-link');

function updateBalanceDisplay() {
    balanceDisplay.textContent = Math.floor(balance);
    balanceDisplay.parentElement.classList.remove('balance-update');
    void balanceDisplay.parentElement.offsetWidth; // Trigger reflow
    balanceDisplay.parentElement.classList.add('balance-update');

    localStorage.setItem('nebula_balance', balance);
    localStorage.setItem('nebula_inventory', JSON.stringify(inventory));

    renderShop();
    renderInventory();
}

function showNotification(message, isError = false) {
    notification.textContent = message;
    notification.style.borderColor = isError ? '#ff4d4d' : 'var(--primary)';
    notification.classList.add('show');
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Admin Redirection Logic
adminLoginBtn.addEventListener('click', () => {
    if (adminPassInput.value === adminPass) {
        showNotification("Welcome, Admin. Redirecting...");
        setTimeout(() => {
            window.location.href = 'admin.html';
        }, 1000);
    } else {
        showNotification("Invalid Admin Key.", true);
    }
});

function buyItem(itemId) {
    const item = shopItems.find(i => i.id === itemId);
    if (!item) return;

    if (balance >= item.price) {
        balance -= item.price;
        // Add to inventory with a unique instance ID and timestamp
        const purchase = {
            ...item,
            purchaseId: Date.now() + Math.random(),
            purchaseTime: Date.now() // Record purchase time
        };
        inventory.push(purchase);
        updateBalanceDisplay();
        showNotification(`Acquired: ${item.name}!`);
    } else {
        showNotification("Insufficient tokens!", true);
    }
}

function returnItem(purchaseId) {
    const index = inventory.findIndex(item => item.purchaseId === purchaseId);
    if (index === -1) return;

    const item = inventory[index];
    const twentyFourHours = 24 * 60 * 60 * 1000;
    const isReturnable = Date.now() - (item.purchaseTime || 0) < twentyFourHours;

    if (!isReturnable) {
        showNotification("Return window has expired (24h).", true);
        return;
    }

    balance += item.price;
    inventory.splice(index, 1);

    updateBalanceDisplay();
    showNotification(`Returned: ${item.name}. Tokens refunded.`);
}

function renderShop() {
    shopGrid.innerHTML = '';
    shopItems.forEach(item => {
        const canAfford = balance >= item.price;
        const card = document.createElement('div');
        card.className = 'item-card';
        card.innerHTML = `
            <div class="item-image">
                <img src="${item.image}" alt="${item.name}" onerror="this.src='https://via.placeholder.com/300?text=Item'">
            </div>
            <div class="item-info">
                <div class="item-name">${item.name}</div>
                <div class="item-desc">${item.description}</div>
            </div>
            <div class="item-footer">
                <div class="item-price">
                    <span>✦</span> ${item.price}
                </div>
                <button 
                    class="buy-btn" 
                    ${!canAfford ? 'disabled' : ''} 
                    onclick="buyItem(${item.id})">
                    ${canAfford ? 'Buy' : 'Locked'}
                </button>
            </div>
        `;
        shopGrid.appendChild(card);
    });
}

function renderInventory() {
    inventoryGrid.innerHTML = '';
    if (inventory.length === 0) {
        inventoryGrid.innerHTML = '<div class="empty-inventory">No items acquired yet.</div>';
        return;
    }

    const twentyFourHours = 24 * 60 * 60 * 1000;
    const now = Date.now();

    inventory.forEach(item => {
        const timeElapsed = now - (item.purchaseTime || now);
        const canReturn = timeElapsed < twentyFourHours;

        const timeLeftMs = Math.max(0, twentyFourHours - timeElapsed);
        const hoursLeft = Math.floor(timeLeftMs / (1000 * 60 * 60));
        const minsLeft = Math.floor((timeLeftMs % (1000 * 60 * 60)) / (1000 * 60));
        const secsLeft = Math.floor((timeLeftMs % (1000 * 60)) / 1000);

        const card = document.createElement('div');
        card.className = 'item-card';
        card.innerHTML = `
            <div class="item-image">
                <img src="${item.image}" alt="${item.name}" onerror="this.src='https://via.placeholder.com/300?text=Item'">
            </div>
            <div class="item-info">
                <div class="item-name">${item.name}</div>
                ${canReturn ?
                `<div class="item-desc" style="color: var(--primary-light)">Return expires in: ${hoursLeft}h ${minsLeft}m ${secsLeft}s</div>` :
                `<div class="item-desc" style="color: #666">Owner verified. Non-returnable.</div>`
            }
            </div>
            <div class="item-footer">
                <div class="item-price">
                    <span>✦</span> ${item.price}
                </div>
                ${canReturn ?
                `<button class="return-btn" onclick="returnItem(${item.purchaseId})">Return</button>` :
                `<button class="return-btn" disabled style="opacity: 0.3; cursor: not-allowed;">Permanent</button>`
            }
            </div>
        `;
        inventoryGrid.appendChild(card);
    });
}

// Update countdowns every second
setInterval(() => {
    if (inventory.length > 0) {
        renderInventory();
    }
}, 1000);

// Initial render
updateBalanceDisplay();
