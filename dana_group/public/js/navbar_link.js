window.addEventListener('load', function() {
    function addStockEntryLink() {
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
            stockLink.style.marginTop = '12px';
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
