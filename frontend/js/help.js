(function () {
    const searchInput = document.getElementById('help-search');
    const faqItems = document.querySelectorAll('.faq-item');
    const tabs = document.querySelectorAll('.help-tab');
    const emptyState = document.getElementById('faq-empty');

    let activeCategory = 'all';

    function showItem(item) { item.style.display = ''; }
    function hideItem(item) { item.style.display = 'none'; }

    function applyFilter() {
        const query = searchInput.value.trim().toLowerCase();
        let visibleCount = 0;

        faqItems.forEach(item => {
            const qText = item.querySelector('.faq-q').textContent.toLowerCase();
            const aText = item.querySelector('.faq-a').textContent.toLowerCase();
            const category = item.dataset.category;

            const matchesCategory = activeCategory === 'all' || category === activeCategory;
            const matchesSearch = !query || qText.includes(query) || aText.includes(query);

            if (matchesCategory && matchesSearch) {
                showItem(item);
                if (query) {
                    item.classList.add('open');
                }
                visibleCount++;
            } else {
                hideItem(item);
                if (query) {
                    item.classList.remove('open');
                }
            }
        });

        emptyState.style.display = visibleCount === 0 ? 'flex' : 'none';
    }

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            activeCategory = tab.dataset.category;
            applyFilter();
        });
    });

    searchInput.addEventListener('input', () => {
        if (!searchInput.value.trim()) {
            faqItems.forEach(item => item.classList.remove('open'));
        }
        applyFilter();
    });

    faqItems.forEach(item => {
        item.querySelector('.faq-q').addEventListener('click', () => {
            item.classList.toggle('open');
        });
    });
})();
