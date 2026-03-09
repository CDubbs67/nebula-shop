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

function showNotification(message, isError = false) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.style.borderColor = isError ? '#ff4d4d' : 'var(--primary)';
    notification.classList.add('show');
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

function adminSetBalance() {
    const val = document.getElementById('admin-set-balance').value;
    const balance = parseFloat(val);
    if (isNaN(balance)) {
        showNotification("Invalid balance.", true);
        return;
    }
    localStorage.setItem('nebula_balance', balance);
    showNotification(`Balance updated to ${balance}.`);
}

function renderItemList() {
    const itemList = document.getElementById('admin-item-list');
    itemList.innerHTML = '';

    const customItems = JSON.parse(localStorage.getItem('nebula_custom_items')) || [];
    const deletedIds = JSON.parse(localStorage.getItem('nebula_deleted_ids')) || [];

    // Combine all current items
    const allItems = [...defaultItems, ...customItems].filter(item => !deletedIds.includes(item.id));

    if (allItems.length === 0) {
        itemList.innerHTML = '<div style="opacity: 0.5;">No items in shop.</div>';
        return;
    }

    allItems.forEach(item => {
        const row = document.createElement('div');
        row.className = 'admin-item-row';
        row.innerHTML = `
            <div class="item-info">
                <img src="${item.image}" alt="${item.name}" onerror="this.src='https://via.placeholder.com/300?text=Item'">
                <div>
                    <div style="font-weight: 600;">${item.name}</div>
                    <div style="font-size: 0.8rem; opacity: 0.7;">✦ ${item.price}</div>
                </div>
            </div>
            <button class="delete-btn" onclick="adminDeleteItem(${item.id})">Delete</button>
        `;
        itemList.appendChild(row);
    });
}

function adminDeleteItem(itemId) {
    if (!confirm("Are you sure you want to delete this item?")) return;

    const customItems = JSON.parse(localStorage.getItem('nebula_custom_items')) || [];
    const customIndex = customItems.findIndex(i => i.id === itemId);

    if (customIndex !== -1) {
        // It's a custom item, remove it
        customItems.splice(customIndex, 1);
        localStorage.setItem('nebula_custom_items', JSON.stringify(customItems));
    } else {
        // It's a default item, add to deleted list
        const deletedIds = JSON.parse(localStorage.getItem('nebula_deleted_ids')) || [];
        if (!deletedIds.includes(itemId)) {
            deletedIds.push(itemId);
            localStorage.setItem('nebula_deleted_ids', JSON.stringify(deletedIds));
        }
    }

    renderItemList();
    showNotification("Item deleted from shop.");
}

function adminAddItem() {
    const name = document.getElementById('new-item-name').value;
    const desc = document.getElementById('new-item-desc').value;
    const price = parseInt(document.getElementById('new-item-price').value);
    const image = document.getElementById('new-item-image').value || 'https://via.placeholder.com/300?text=Item';

    if (!name || isNaN(price)) {
        showNotification("Please enter name and price.", true);
        return;
    }

    const customItems = JSON.parse(localStorage.getItem('nebula_custom_items')) || [];
    const newItem = {
        id: Date.now(),
        name,
        description: desc,
        price,
        image
    };

    customItems.push(newItem);
    localStorage.setItem('nebula_custom_items', JSON.stringify(customItems));
    showNotification(`Item "${name}" added to shop.`);

    // Clear inputs
    document.getElementById('new-item-name').value = '';
    document.getElementById('new-item-desc').value = '';
    document.getElementById('new-item-price').value = '';
    document.getElementById('new-item-image').value = '';

    renderItemList();
}

function adminResetAll() {
    if (confirm("Are you sure? This will reset your balance, inventory, custom items, and deletion history.")) {
        localStorage.clear();
        location.reload();
    }
}

// Load current balance into input on start
document.addEventListener('DOMContentLoaded', () => {
    const currentBalance = localStorage.getItem('nebula_balance') || 500;
    document.getElementById('admin-set-balance').value = currentBalance;
    renderItemList();
});
