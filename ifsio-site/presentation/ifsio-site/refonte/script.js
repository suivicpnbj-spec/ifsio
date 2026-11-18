const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.main-nav');

if (menuButton && navigation) {
  menuButton.addEventListener('click', () => {
    const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!isOpen));
    navigation.classList.toggle('is-open', !isOpen);
  });
  navigation.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
    menuButton.setAttribute('aria-expanded', 'false');
    navigation.classList.remove('is-open');
  }));
}

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
  fetch('/api/public/news').then((response) => response.ok ? response.json() : null).then((data) => {
    if (!data?.news?.length) return;
    const fragment = document.createDocumentFragment();
    for (const item of data.news.slice(0, 3)) {
      const card = document.createElement('a'); card.className = 'news-card'; card.href = item.slug ? `page.html?view=contenu&slug=${encodeURIComponent(item.slug)}` : 'page.html?view=actualites';
      const image = document.createElement('div'); image.className = 'news-image';
      const img = document.createElement('img'); img.src = item.cover_url || 'assets/actualites.jpg'; img.alt = item.cover_url ? `Couverture : ${item.title}` : ''; img.loading = 'lazy';
      const category = document.createElement('span'); category.className = 'news-category'; category.textContent = item.category || 'IFSIO';
      image.append(img,category);
      const body = document.createElement('div'); body.className = 'news-body';
      const date = document.createElement('span'); date.className='news-date'; date.textContent=item.published_at ? new Date(item.published_at).toLocaleDateString('fr-FR') : 'Actualité de l’Institut';
      const title = document.createElement('h3'); title.textContent=item.title;
      const action = document.createElement('span'); action.className='card-link'; action.append(document.createTextNode('Lire l’information '));
      const arrow=document.createElement('b'); arrow.textContent='→'; action.append(arrow);
      body.append(date,title,action); card.append(image,body); fragment.append(card);
    }
    publicNewsGrid.replaceChildren(fragment);
  }).catch(() => {});
}
