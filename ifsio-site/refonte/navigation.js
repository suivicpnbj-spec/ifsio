(() => {
  const menuButton = document.querySelector('.menu-toggle');
  const navigation = document.querySelector('.main-nav');
  if (!navigation) return;

  const view = new URLSearchParams(location.search).get('view') || '';
  const path = location.pathname.toLowerCase();
  const groups = {
    institute: new Set(['institut', 'esii', 'essfe', 'licence', 'masters', 'master-ssr', 'master-iac', 'master-smur', 'clinique-application', 'admissions', 'dirigeants', 'equipe', 'honoraire', 'partenaires', 'recherche']),
    studentlife: new Set(['vie', 'bue', 'gala-article', 'gala-2026', 'octobre-rose-article', 'alumni', 'insertion']),
    publication: new Set(['publication', 'actualites', 'communiques', 'activites', 'jsio', 'soutenances']),
    resources: new Set(['ressources', 'photos', 'videos', 'liens']),
    contact: new Set(['contact']),
    search: new Set(['recherche-site']),
  };
  let active = '';
  for (const [group, views] of Object.entries(groups)) if (views.has(view)) { active = group; break; }

  const links = [...navigation.querySelectorAll('a')];
  for (const link of links) {
    const href = link.getAttribute('href') || '';
    const targetView = new URL(href, location.href).searchParams.get('view');
    const group = targetView && Object.keys(groups).find((key) => groups[key].has(targetView));
    if (group && group === active) {
      link.setAttribute('aria-current', 'page');
      link.classList.add('is-current');
    } else if (path.endsWith('/espace-apprenants.html') && link.classList.contains('nav-cta')) {
      link.setAttribute('aria-current', 'page');
      link.classList.add('is-current');
    }
  }

  const closeMenu = () => {
    if (!menuButton) return;
    menuButton.setAttribute('aria-expanded', 'false');
    navigation.classList.remove('is-open');
  };

  if (menuButton) {
    menuButton.addEventListener('click', () => {
      const open = menuButton.getAttribute('aria-expanded') === 'true';
      menuButton.setAttribute('aria-expanded', String(!open));
      navigation.classList.toggle('is-open', !open);
    });
    navigation.addEventListener('click', (event) => {
      if (event.target.closest('a')) closeMenu();
    });
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeMenu(); });
  }
})();
