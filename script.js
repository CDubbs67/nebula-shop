let shopItems = [];

async function loadShopItems() {
    try {
        const response = await fetch('/api/items');
        shopItems = await response.json();
        renderShop();
    } catch (err) {
        console.error("Failed to fetch items from uplink:", err);
        shopGrid.innerHTML = '<div style="color: #ff4d4d; grid-column: 1/-1;">Critical Error: Failed to connect to Nebula Uplink.</div>';
    }
}

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

let pendingPurchaseItemId = null;

const simpleNamePrompt = document.getElementById('simple-name-prompt');
const simpleNameInput = document.getElementById('simple-name-input');
const simpleNameSubmit = document.getElementById('simple-name-submit');
const simpleNameCancel = document.getElementById('simple-name-cancel');

simpleNameSubmit.addEventListener('click', () => {
    const buyerName = simpleNameInput.value.trim();
    if (!buyerName) {
        showNotification("Name is required to purchase.", true);
        return;
    }

    simpleNamePrompt.style.display = 'none';
    finalizePurchase(pendingPurchaseItemId, buyerName);
});

simpleNameCancel.addEventListener('click', () => {
    simpleNamePrompt.style.display = 'none';
    pendingPurchaseItemId = null;
    console.log("Transaction aborted by user.");
});

function buyItem(itemId) {
    console.log("Transaction initiated for item ID:", itemId);
    const item = shopItems.find(i => i.id === itemId);

    if (!item) {
        console.error("Item not found in shop index!");
        return;
    }

    if (balance >= item.price) {
        console.log("Sufficient balance. Showing HTML identity prompt...");
        pendingPurchaseItemId = itemId;
        simpleNameInput.value = "";
        simpleNamePrompt.style.display = 'flex';
        simpleNameInput.focus();
    } else {
        showNotification("Insufficient tokens!", true);
        console.warn("Transaction failed: Insufficient tokens.");
    }
}

function finalizePurchase(itemId, buyerName) {
    const item = shopItems.find(i => i.id === itemId);
    if (!item) return;

    balance -= item.price;
    const purchase = {
        ...item,
        buyerName: buyerName,
        purchaseId: Date.now() + Math.random(),
        purchaseTime: Date.now()
    };

    inventory.push(purchase);
    updateBalanceDisplay();
    showNotification(`Acquired: ${item.name}!`);
    console.log("Transaction complete. Owner registered:", buyerName);
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

    inventory.forEach(item => {
        const card = document.createElement('div');
        card.className = 'item-card';
        card.innerHTML = `
            <div class="item-image">
                <img src="${item.image}" alt="${item.name}" onerror="this.src='https://via.placeholder.com/300?text=Item'">
            </div>
            <div class="item-info">
                <div class="item-name">${item.name}</div>
                <!-- The timer script will populate this text -->
                <div class="item-desc countdown-timer" id="timer-${item.purchaseId}" style="color: var(--primary-light)"></div>
            </div>
            <div class="item-footer">
                <div class="item-price">
                    <span>✦</span> ${item.price}
                </div>
                <!-- The return button state is also managed by the timer script if it expires -->
                <button class="return-btn" id="return-btn-${item.purchaseId}" onclick="returnItem(${item.purchaseId})">Return</button>
            </div>
        `;
        inventoryGrid.appendChild(card);
    });

    // Initial call to set the times immediately
    updateCountdowns();
}

function updateCountdowns() {
    const twentyFourHours = 24 * 60 * 60 * 1000;
    const now = Date.now();

    inventory.forEach(item => {
        const timeElapsed = now - (item.purchaseTime || now);
        const canReturn = timeElapsed < twentyFourHours;
        const timerElement = document.getElementById(`timer-${item.purchaseId}`);
        const returnBtn = document.getElementById(`return-btn-${item.purchaseId}`);

        if (!timerElement || !returnBtn) return;

        if (canReturn) {
            const timeLeftMs = Math.max(0, twentyFourHours - timeElapsed);
            const hoursLeft = Math.floor(timeLeftMs / (1000 * 60 * 60));
            const minsLeft = Math.floor((timeLeftMs % (1000 * 60 * 60)) / (1000 * 60));
            const secsLeft = Math.floor((timeLeftMs % (1000 * 60)) / 1000);

            timerElement.textContent = `Return expires in: ${hoursLeft}h ${minsLeft}m ${secsLeft}s`;
            timerElement.style.color = "var(--primary-light)";
            returnBtn.disabled = false;
            returnBtn.style.opacity = "1";
            returnBtn.style.cursor = "pointer";
            returnBtn.textContent = "Return";
        } else {
            timerElement.textContent = "Owner verified. Non-returnable.";
            timerElement.style.color = "#666";
            returnBtn.disabled = true;
            returnBtn.style.opacity = "0.3";
            returnBtn.style.cursor = "not-allowed";
            returnBtn.textContent = "Permanent";
        }
    });
}

// Update countdown text every second locally
setInterval(() => {
    if (inventory.length > 0) {
        updateCountdowns();
    }
}, 1000);

// Initial render
updateBalanceDisplay();
loadShopItems();

