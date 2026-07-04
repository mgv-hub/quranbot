class Scroll {
    constructor() {
        this.current = window.scrollY;
        this.target = window.scrollY;
        this.velocity = 0;
        this.isScrolling = false;
        this.isMobile = window.innerWidth < 1024;
        this.rafId = null;
        this.init();
    }
    init() {
        const blockedPages = ['privacy.html', 'terms.html'];
        const currentPage = window.location.pathname.split('/').pop();
        if (this.isMobile) return;
        if (blockedPages.includes(currentPage)) {
            return;
        }
        window.addEventListener(
            'wheel',
            (e) => {
                e.preventDefault();
                this.target += e.deltaY;
                const maxScroll = document.body.scrollHeight - window.innerHeight;
                this.target = Math.max(0, Math.min(this.target, maxScroll));
                if (!this.rafId) {
                    this.rafId = requestAnimationFrame(this.animate.bind(this));
                }
            },
            { passive: false },
        );
        window.addEventListener('scroll', () => {
            const diff = Math.abs(window.scrollY - this.current);
            if (diff > 2) {
                this.current = window.scrollY;
                this.target = window.scrollY;
            }
        });
    }
    l(start, end, factor) {
        return start + (end - start) * factor;
    }
    scrollTo(y) {
        this.target = Math.max(0, Math.min(y, document.body.scrollHeight - window.innerHeight));
        if (!this.rafId) {
            this.rafId = requestAnimationFrame(this.animate.bind(this));
        }
    }
    animate() {
        const diff = this.target - this.current;
        if (Math.abs(diff) < 0.5) {
            this.current = this.target;
            window.scrollTo(0, Math.round(this.current));
            this.rafId = null;
            return;
        }
        this.current = this.l(this.current, this.target, 0.18);
        window.scrollTo(0, Math.round(this.current));
        this.rafId = requestAnimationFrame(this.animate.bind(this));
    }
}

let smooth = null;
document.addEventListener('DOMContentLoaded', function () {
    smooth = new Scroll();
    const scrollTopBtn = document.querySelector('.scroll-top-btn');
    function toggleScrollButton() {
        const scrollPos = smooth ? smooth.current : window.scrollY;
        if (scrollPos > 400) {
            scrollTopBtn.classList.add('visible');
        } else {
            scrollTopBtn.classList.remove('visible');
        }
    }
    window.addEventListener('scroll', toggleScrollButton);
    scrollTopBtn.addEventListener('click', function () {
        if (smooth) {
            smooth.scrollTo(0);
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const target = document.querySelector(targetId);
            if (target) {
                const offsetTop = target.offsetTop;
                if (smooth) {
                    smooth.scrollTo(offsetTop);
                } else {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        });
    });
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    const Nav = document.querySelector('.header-nav');
    if (mobileToggle) {
        mobileToggle.addEventListener('click', function () {
            Nav.classList.toggle('active');
        });
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const recitersGrid = document.getElementById('reciters-grid');
    const radiosGrid = document.getElementById('radios-grid');
    const surahsGrid = document.getElementById('surahs-grid');
    const rewayahGrid = document.getElementById('rewayah-grid');
    const showMoreRecitersBtn = document.getElementById('show-more-reciters');
    const showMoreRadiosBtn = document.getElementById('show-more-radios');
    const showMoreSurahsBtn = document.getElementById('show-more-surahs');
    const showMoreRewayahBtn = document.getElementById('show-more-rewayah');
    const filterButtons = document.querySelectorAll('.filter-btn');
    let allReciters = [];
    let allRadios = [];
    let allSurahs = [];
    let allRewayah = [];
    let displayedRecitersCount = 0;
    let displayedRadiosCount = 0;
    let displayedSurahsCount = 0;
    let displayedRewayahCount = 0;
    const ITEMS_PER_PAGE = 6;
    const SURAH_REWAYAH_PER_PAGE = 20;
    let currentSurahFilter = 'all';
    function getReciterTags(reciter) {
        const tags = [];
        const moshaf = reciter.moshaf?.[0];
        if (moshaf) {
            const surahCount = moshaf.surah_list?.split(',').filter((s) => s.trim()).length || 0;
            if (surahCount >= 114) tags.push('Complete');
            else if (surahCount > 50) tags.push('Partial');
            else tags.push('Limited');
            if (moshaf.name?.includes('مجتود') || moshaf.name?.toLowerCase().includes('mujawwad')) {
                tags.push('Mujawwad');
            } else {
                tags.push('Murattal');
            }
        }
        return tags;
    }

    function createReciterCard(reciter) {
        const name = reciter.name || 'Unknown Reciter';
        const moshaf = reciter.moshaf?.[0];
        const surahCount = moshaf?.surah_list?.split(',').filter((s) => s.trim()).length || 0;
        const style = moshaf?.name || 'Hafs';
        const tags = getReciterTags(reciter);
        const letter = reciter.letter && reciter.letter.trim().length > 0 ? reciter.letter.trim() : '';
        const card = document.createElement('div');
        card.className = 'reciter-card';
        card.innerHTML = `
        <div class="reciter-avatar">
        <i class="fas fa-user"></i>
        </div>
        <div class="reciter-info">
        <h3 class="reciter-name">${name}</h3>
        <p class="reciter-style">${style} • ${surahCount} Surahs</p>
        <div class="reciter-tags">
        ${tags.map((tag) => `<span class="tag">${tag}</span>`).join('')}
        </div>
        </div>
`;
        return card;
    }

    function createRadioCard(radio) {
        const name = radio.name || 'Unknown Station';
        const url = radio.url || '#';
        const recentDate = radio.recent_date ? new Date(radio.recent_date).toLocaleDateString() : 'Unknown';
        const card = document.createElement('div');
        card.className = 'radio-card';
        card.innerHTML = `
        <div class="radio-icon">
        <i class="fas fa-broadcast-tower"></i>
        </div>
        <div class="radio-info">
        <h3 class="radio-name">${name}</h3>
        <a href="${url}" target="_blank" class="radio-link" title="Open Stream">
        <i class="fas fa-external-link-alt"></i>
        </a>
        </div>
`;
        return card;
    }

    function createSurahCard(surah) {
        const name = surah.name || 'Unknown';
        const id = surah.id || 0;
        const type = surah.makkia === 1 ? 'Makki' : 'Madani';
        const pages = `Pages ${surah.start_page}-${surah.end_page}`;
        const card = document.createElement('div');
        card.className = `surah-card ${surah.makkia === 1 ? 'makkia' : 'madania'}`;
        card.setAttribute('data-type', surah.makkia === 1 ? 'makkia' : 'madania');
        card.innerHTML = `
        <div class="surah-number">${id}</div>
        <div class="surah-content">
        <h3 class="surah-name">${name}</h3>
        <p class="surah-meta">${type} • ${pages}</p>
        </div>
`;
        return card;
    }

    function createRewayahCard(rewayah) {
        const name = rewayah.name || 'Unknown';
        const id = rewayah.id || 0;
        const card = document.createElement('div');
        card.className = 'rewayah-card';
        card.innerHTML = `
        <div class="rewayah-icon">
        <i class="fas fa-scroll"></i>
        </div>
        <div class="rewayah-info">
        <h3 class="rewayah-name">${name}</h3>
        <span class="rewayah-id">ID: ${id}</span>
        </div>
`;
        return card;
    }

    function renderReciters(count) {
        const loadingPlaceholder = recitersGrid.querySelector('.loading-placeholder');
        if (loadingPlaceholder) {
            loadingPlaceholder.remove();
        }
        const items = allReciters.slice(displayedRecitersCount, displayedRecitersCount + count);
        items.forEach((reciter) => {
            const card = createReciterCard(reciter);
            recitersGrid.appendChild(card);
        });
        displayedRecitersCount += count;
    }

    function renderRadios(count) {
        const loadingPlaceholder = radiosGrid.querySelector('.loading-placeholder');
        if (loadingPlaceholder) {
            loadingPlaceholder.remove();
        }

        const items = allRadios.slice(displayedRadiosCount, displayedRadiosCount + count);
        items.forEach((radio) => {
            const card = createRadioCard(radio);
            radiosGrid.appendChild(card);
        });
        displayedRadiosCount += count;
    }

    function renderSurahs(surahs, append = false) {
        if (!append) {
            surahsGrid.innerHTML = '';
            displayedSurahsCount = 0;
        }
        const items = surahs.slice(displayedSurahsCount, displayedSurahsCount + SURAH_REWAYAH_PER_PAGE);
        items.forEach((surah) => {
            const card = createSurahCard(surah);
            surahsGrid.appendChild(card);
        });
        displayedSurahsCount += items.length;
    }

    function renderRewayah(rewayahList, append = false) {
        if (!append) {
            rewayahGrid.innerHTML = '';
            displayedRewayahCount = 0;
        }
        const items = rewayahList.slice(displayedRewayahCount, displayedRewayahCount + SURAH_REWAYAH_PER_PAGE);
        items.forEach((item) => {
            const card = createRewayahCard(item);
            rewayahGrid.appendChild(card);
        });
        displayedRewayahCount += items.length;
    }

    function updateRecitersButton() {
        if (displayedRecitersCount >= allReciters.length) {
            showMoreRecitersBtn.style.display = 'none';
        } else {
            showMoreRecitersBtn.style.display = 'inline-flex';
        }
    }

    function updateRadiosButton() {
        if (displayedRadiosCount >= allRadios.length) {
            showMoreRadiosBtn.style.display = 'none';
        } else {
            showMoreRadiosBtn.style.display = 'inline-flex';
        }
    }

    function updateSurahsButton() {
        const filteredSurahs =
            currentSurahFilter === 'all'
                ? allSurahs
                : allSurahs.filter((s) => (currentSurahFilter === 'makkia' ? s.makkia === 1 : s.makkia === 0));
        if (displayedSurahsCount >= filteredSurahs.length) {
            showMoreSurahsBtn.style.display = 'none';
        } else {
            showMoreSurahsBtn.style.display = 'inline-flex';
        }
    }

    function updaterewayah() {
        if (displayedRewayahCount >= allRewayah.length) {
            showMoreRewayahBtn.style.display = 'none';
        } else {
            showMoreRewayahBtn.style.display = 'inline-flex';
        }
    }

    async function data() {
        try {
            const response = await fetch('https://raw.githubusercontent.com/hub-mgv/QuranBotData/main/data_quran.json');
            const data = await response.json();
            const cachedData = data.cached_data || data;
            const recitersArray = cachedData.reciters?.reciters || cachedData.reciters || [];
            allReciters = recitersArray
                .filter((r) => r.name && r.moshaf?.[0]?.server)
                .sort((a, b) => (a.letter || '').localeCompare(b.letter || '', 'ar'));
            const radiosArray = cachedData.radios?.radios || cachedData.radios || [];
            allRadios = radiosArray.filter((r) => r.name && r.url).sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ar'));
            const surahsArray = cachedData.surah?.suwar || data.surah?.suwar || [];
            allSurahs = surahsArray.sort((a, b) => a.id - b.id);
            const rewayahArray = cachedData.rewayah?.riwayat || cachedData.rewayah || [];
            allRewayah = rewayahArray.sort((a, b) => a.id - b.id);
            document.getElementById('reciters-count').textContent = allReciters.length;
            document.getElementById('radios-count').textContent = allRadios.length;
            renderReciters(ITEMS_PER_PAGE);
            updateRecitersButton();
            renderRadios(ITEMS_PER_PAGE);
            updateRadiosButton();
            renderSurahs(allSurahs, false);
            updateSurahsButton();
            renderRewayah(allRewayah, false);
            updaterewayah();
        } catch (error) {
            console.error('Error loading database:', error);
            recitersGrid.innerHTML = `<div class="error-placeholder"><i class="fas fa-exclamation-triangle"></i> Unable to load data</div>`;
            radiosGrid.innerHTML = `<div class="error-placeholder"><i class="fas fa-exclamation-triangle"></i> Unable to load data</div>`;
            surahsGrid.innerHTML = `<div class="error-placeholder"><i class="fas fa-exclamation-triangle"></i> Unable to load data</div>`;
            rewayahGrid.innerHTML = `<div class="error-placeholder"><i class="fas fa-exclamation-triangle"></i> Unable to load data</div>`;
        }
    }
    showMoreRecitersBtn.addEventListener('click', () => {
        renderReciters(ITEMS_PER_PAGE);
        updateRecitersButton();
    });
    showMoreRadiosBtn.addEventListener('click', () => {
        renderRadios(ITEMS_PER_PAGE);
        updateRadiosButton();
    });
    showMoreSurahsBtn.addEventListener('click', () => {
        const filteredSurahs =
            currentSurahFilter === 'all'
                ? allSurahs
                : allSurahs.filter((s) => (currentSurahFilter === 'makkia' ? s.makkia === 1 : s.makkia === 0));
        renderSurahs(filteredSurahs, true);
        updateSurahsButton();
    });
    showMoreRewayahBtn.addEventListener('click', () => {
        renderRewayah(allRewayah, true);
        updaterewayah();
    });
    filterButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
            filterButtons.forEach((b) => b.classList.remove('active'));
            btn.classList.add('active');
            currentSurahFilter = btn.getAttribute('data-filter');
            const filtered =
                currentSurahFilter === 'all'
                    ? allSurahs
                    : allSurahs.filter((s) => (currentSurahFilter === 'makkia' ? s.makkia === 1 : s.makkia === 0));
            renderSurahs(filtered, false);
            updateSurahsButton();
        });
    });
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach((item) => {
        const question = item.querySelector('.faq-question');
        question.addEventListener('click', () => {
            const isOpen = item.classList.contains('open');
            faqItems.forEach((i) => i.classList.remove('open'));
            if (!isOpen) {
                item.classList.add('open');
            }
        });
    });
    const scrollTopBtn = document.querySelector('.scroll-top-btn');
    if (scrollTopBtn) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 400) {
                scrollTopBtn.classList.add('visible');
            } else {
                scrollTopBtn.classList.remove('visible');
            }
        });
        scrollTopBtn.addEventListener('click', () => {
            if (smooth) {
                smooth.scrollTo(0);
            } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    }
    const MenuToggle = document.querySelector('.mobile-menu-toggle');
    const Nav = document.querySelector('.header-nav');
    if (MenuToggle && Nav) {
        MenuToggle.addEventListener('click', () => {
            Nav.classList.toggle('active');
        });
    }
    data();
});

document.addEventListener('DOMContentLoaded', function () {
    const scrollTopBtn = document.querySelector('.scroll-top-btn');
    function toggleScrollButton() {
        const currentY = smooth ? smooth.current : window.scrollY;
        if (currentY > 400) {
            scrollTopBtn?.classList.add('visible');
        } else {
            scrollTopBtn?.classList.remove('visible');
        }
    }

    window.addEventListener('scroll', toggleScrollButton);
    scrollTopBtn?.addEventListener('click', () => {
        if (smooth) {
            smooth.scrollTo(0);
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    const nav = document.querySelector('.header-nav');
    if (mobileToggle && nav) {
        mobileToggle.addEventListener('click', () => {
            nav.classList.toggle('active');
        });
    }

    const sidebarLinks = document.querySelectorAll('.doc-sidebar a');
    const sections = document.querySelectorAll('.toc-anchor');
    function updateActiveLink() {
        let current = '';
        sections.forEach((section) => {
            const sectionTop = section.offsetTop - 120;
            const scrollY = smooth ? smooth.current : window.scrollY;
            if (scrollY >= sectionTop) {
                current = section.getAttribute('id');
            }
        });
        sidebarLinks.forEach((link) => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    }

    window.addEventListener('scroll', updateActiveLink);
    updateActiveLink();
});

async function loadGitHubStats() {
    const cache = localStorage.getItem('gh_stats');
    const time = localStorage.getItem('gh_stats_time');
    const now = Date.now();
    const time_ = 10 * 60 * 1000;
    if (cache && time && now - time < time_) {
        t(JSON.parse(cache));
        return;
    }
    const url_res = await fetch('https://api.github.com/repos/mgv-hub/quranbot');
    const data = await url_res.json();
    localStorage.setItem('gh_stats', JSON.stringify(data));
    localStorage.setItem('gh_stats_time', now);
    t(data);
}

function t(data) {
    document.getElementById('gh-stars').textContent = data.stargazers_count;
    document.getElementById('gh-forks').textContent = data.forks;
}

document.addEventListener('DOMContentLoaded', loadGitHubStats);

document.addEventListener('DOMContentLoaded', async function () {
    const versionPaths = ['../../package.json'];
    let version = 'v0';
    for (const path of versionPaths) {
        const response = await fetch(path);
        if (response.ok) {
            const pkg = await response.json();
            version = pkg.version || version;
            break;
        }
    }
    document.querySelectorAll('[data-app-version]').forEach((el) => {
        el.textContent = version;
    });
});

class CrazyTopLoader {
    constructor() {
        this.bar = document.getElementById('LoaderBar');
        this.running = false;

        this.bindLinks();
        this.startLoop();
    }

    sleep(ms) {
        return new Promise((r) => setTimeout(r, ms));
    }

    random(min, max) {
        return Math.random() * (max - min) + min;
    }

    async animateOnce(direction = 'ltr', speed = 700) {
        this.bar.style.opacity = '1';
        this.bar.style.transition = 'none';

        if (direction === 'rtl') {
            this.bar.style.left = 'auto';
            this.bar.style.right = '0';
        } else {
            this.bar.style.right = 'auto';
            this.bar.style.left = '0';
        }

        this.bar.style.width = '0%';
        void this.bar.offsetWidth;

        this.bar.style.transition = `width ${speed}ms cubic-bezier(0.4, 0, 0.2, 1)`;
        this.bar.style.width = '100%';

        await this.sleep(speed);

        this.bar.style.opacity = '0';
        this.bar.style.width = '0%';
    }

    async startLoop() {
        while (true) {
            const waitTime = this.random(3000, 10000);
            await this.sleep(waitTime);

            const direction = Math.random() > 0.5 ? 'ltr' : 'rtl';
            const speed = this.random(500, 700);

            await this.animateOnce(direction, speed);
        }
    }

    bindLinks() {
        document.addEventListener('click', async (e) => {
            const link = e.target.closest('a');

            if (!link) return;

            const href = link.getAttribute('href');
            if (!href || href.startsWith('#') || link.target === '_blank' || href.startsWith('http')) return;

            e.preventDefault();
            this.animateOnce('ltr', 500);

            await this.sleep(500 + this.random(200, 400));

            window.location.href = href;
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new CrazyTopLoader();
});

const header = document.getElementById('site-nav');
let ScrollY = window.scrollY;

const Threshold = 10;

window.addEventListener('scroll', () => {
    const currentScrollY = window.scrollY;

    if (Math.abs(currentScrollY - ScrollY) < Threshold || currentScrollY < 0) {
        return;
    }

    if (currentScrollY > ScrollY && currentScrollY > 80) {
        header.classList.remove('scroll-up');

        header.classList.add('scroll-down');
    } else if (currentScrollY < ScrollY) {
        header.classList.remove('scroll-down');
        header.classList.add('scroll-up');
    }

    ScrollY = currentScrollY;
});
