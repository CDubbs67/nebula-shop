const API_URL = '/api';

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

async function renderItemList() {
    const itemList = document.getElementById('admin-item-list');
    itemList.innerHTML = '<div style="opacity: 0.5;">Loading inventory...</div>';

    try {
        const response = await fetch(`${API_URL}/items`);
        const allItems = await response.json();

        itemList.innerHTML = '';
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
    } catch (err) {
        itemList.innerHTML = '<div style="color: #ff4d4d;">Failed to load items. Is server running?</div>';
    }
}

async function adminDeleteItem(itemId) {
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
        const response = await fetch(`${API_URL}/items/delete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: itemId })
        });

        if (response.ok) {
            renderItemList();
            showNotification("Item deleted from shop for everyone.");
        }
    } catch (err) {
        showNotification("Failed to delete item.", true);
    }
}

async function adminAddItem() {
    const name = document.getElementById('new-item-name').value;
    const desc = document.getElementById('new-item-desc').value;
    const price = parseInt(document.getElementById('new-item-price').value);
    const image = document.getElementById('new-item-image').value || 'https://via.placeholder.com/300?text=Item';

    if (!name || isNaN(price)) {
        showNotification("Please enter name and price.", true);
        return;
    }

    const newItem = {
        id: Date.now(),
        name,
        description: desc,
        price,
        image
    };

    try {
        const response = await fetch(`${API_URL}/items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newItem)
        });

        if (response.ok) {
            showNotification(`Item "${name}" added to shop for everyone.`);
            document.getElementById('new-item-name').value = '';
            document.getElementById('new-item-desc').value = '';
            document.getElementById('new-item-price').value = '';
            document.getElementById('new-item-image').value = '';
            renderItemList();
        }
    } catch (err) {
        showNotification("Failed to add item.", true);
    }
}

function adminResetAll() {
    if (confirm("Are you sure? This will reset your personal data. Shared items remain on server.")) {
        localStorage.clear();
        location.reload();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const currentBalance = localStorage.getItem('nebula_balance') || 500;
    document.getElementById('admin-set-balance').value = currentBalance;
    renderItemList();
});
