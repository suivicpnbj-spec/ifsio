const year = document.querySelector('#current-year');
if (year) year.textContent = new Date().getFullYear();

const items = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  items.forEach((item) => observer.observe(item));
} else {
  items.forEach((item) => item.classList.add('is-visible'));
}

const publicNewsGrid = document.querySelector('.news-grid');
if (publicNewsGrid) {
  const showEmptyNews = () => {
    const card = document.createElement('article'); card.className = 'news-empty-state';
    const icon = document.createElement('span'); icon.className = 'news-empty-icon'; icon.setAttribute('aria-hidden', 'true'); icon.textContent = '✳';
    const copy = document.createElement('div'); const title = document.createElement('strong'); title.textContent = 'Les nouvelles de l’IFSIO';
    const message = document.createElement('p'); message.textContent = 'Les actualités et annonces publiées par l’Institut apparaîtront dans cet espace.';
    copy.append(title, message); card.append(icon, copy); publicNewsGrid.replaceChildren(card);
  };
  fetch('/api/public/news')
    .then((response) => response.ok ? response.json() : null)
    .then((data) => {
      const news = (data?.news || []).filter((item) => !/^\s*\[d[eé]mo\]/i.test(String(item.title || ''))).slice(0, 3);
      if (!news.length) { showEmptyNews(); return; }
      const fragment = document.createDocumentFragment();
      for (const item of news) {
        const card = document.createElement('a'); card.className = 'news-card'; card.href = `page.html?view=contenu&slug=${encodeURIComponent(item.slug)}`;
        const image = document.createElement('div'); image.className = 'news-image';
        const img = document.createElement('img'); img.src = item.cover_url || 'assets/actualites.jpg'; img.alt = item.cover_url ? `Couverture : ${item.title}` : ''; img.loading = 'lazy';
        const category = document.createElement('span'); category.className = 'news-category'; category.textContent = item.category || 'IFSIO';
        image.append(img, category);
        const body = document.createElement('div'); body.className = 'news-body';
        const date = document.createElement('span'); date.className = 'news-date'; date.textContent = item.published_at ? new Date(item.published_at).toLocaleDateString('fr-FR') : 'Actualité de l’Institut';
        const title = document.createElement('h3'); title.textContent = item.title;
        const action = document.createElement('span'); action.className = 'card-link'; action.append(document.createTextNode('Lire l’information '));
        const arrow = document.createElement('b'); arrow.textContent = '→'; action.append(arrow);
        body.append(date, title, action); card.append(image, body); fragment.append(card);
      }
      publicNewsGrid.replaceChildren(fragment);
    })
    .catch(showEmptyNews);
}

// Les sous-domaines officiels restent configurables par l'API en environnement intégré.
(async () => {
  const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);
  const localHost = window.location.hostname || 'localhost';
  let services = isLocal
    ? {
        resultats: `http://${localHost}:5174`,
        actes: `http://${localHost}:5173`,
        cntrss: `http://${localHost}:3100`
      }
    : {
        resultats: 'https://resultats.ifsio.bj',
        actes: 'https://actes.ifsio.bj',
        cntrss: 'https://cntrss.ifsio.bj'
      };

  try {
    const res = await fetch('/api/public/config');
    if (res.ok) {
      const cfg = await res.json();
      services = { ...services, ...(cfg?.services || {}) };
    }
  } catch (_e) {}

  const destinations = {
    resultats: services.resultats,
    actes: services.actes,
    verification: `${services.actes.replace(/\/$/, '')}/#/verifier`,
    cntrss: services.cntrss
  };
  document.querySelectorAll('[data-campus-service]').forEach((link) => {
    const destination = destinations[link.dataset.campusService];
    if (destination) link.href = destination;
  });
})();
