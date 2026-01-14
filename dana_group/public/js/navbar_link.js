window.addEventListener('load', function() {
    async function userHasRole(roleName) {
        try {
            const res = await fetch('/api/method/frappe.client.get', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    doctype: 'User',
                    name: frappe.session.user
                })
            });

            const data = await res.json();
            if (data.message && Array.isArray(data.message.roles)) {
                return data.message.roles.some(r => r.role === roleName);
            }
            return false;
        } catch (err) {
            console.error('Error checking roles:', err);
            return false;
        }
    }

    async function addStockEntryLink() {
        const hasRole = await userHasRole('v3'); // ✅ Check if user has "v3" role
        if (!hasRole) return;

        const brand = document.querySelector('a.navbar-brand.navbar-home');

        if (brand && !document.getElementById('stock-entry-link')) {
            const stockLink = document.createElement('a');
            stockLink.id = 'stock-entry-link';
            stockLink.href = '/stock_entry';
            stockLink.textContent = 'Stock Entry';
            stockLink.style.marginLeft = '15px';
            stockLink.style.padding = '6px 12px';
            stockLink.style.fontWeight = '500';
            stockLink.style.color = '#fff';
            stockLink.style.background = 'orange';
            stockLink.style.borderRadius = '4px';
            stockLink.style.textDecoration = 'none';
            stockLink.style.display = 'inline-block';
            stockLink.style.verticalAlign = 'middle';
            brand.parentNode.insertBefore(stockLink, brand.nextSibling);
        } else if (!brand) {
            setTimeout(addStockEntryLink, 300);
        }
    }

    addStockEntryLink();
});
