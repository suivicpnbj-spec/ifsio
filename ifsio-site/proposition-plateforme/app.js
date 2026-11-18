const app = document.querySelector('#app');
const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.main-nav');
const searchDialog = document.querySelector('.search-dialog');
const searchInput = document.querySelector('#search-input');
const searchResults = document.querySelector('.search-results');
const currentYear = new Date().getFullYear();
document.querySelector('#year').textContent = currentYear;

const articleData = {
  gala: {
    title: 'Gala IFSIO 2026 : la communauté réunie autour de ses talents',
    category: 'Culture · Vie étudiante',
    date: '10 octobre 2026',
    cover: 'assets/gala-2026-cover.jpg',
    alt: 'Étudiantes et invités réunis pendant la soirée du Gala IFSIO 2026',
    intro: 'Une soirée de culture, de rencontres et de célébration de la vie étudiante à Parakou.',
    body: '<p>Le Gala IFSIO 2026 a réuni la communauté étudiante autour de la culture et des talents. La soirée du 10 octobre a clôturé deux journées d’activités à Parakou.</p><p>Au programme figuraient des prestations artistiques, l’élection Miss & Mister et les IFSIO Culture Prize. L’album photo permet de retrouver les moments de la soirée.</p><p class="source-note">Programme et informations pratiques rapportés par l’annonce publiée sur Setondji Hub.</p>'
  },
  octobre: {
    title: 'Octobre Rose Vibes 2026 : chaque parcours compte',
    category: 'Prévention · Solidarité',
    date: 'Octobre 2026',
    cover: 'assets/octobre-rose-cover.svg',
    alt: 'Campagne Octobre Rose Vibes 2026',
    intro: 'S’informer, ouvrir le dialogue et soutenir avec attention les personnes concernées.',
    body: '<p>Octobre Rose est un temps de sensibilisation au cancer du sein. La campagne invite à partager des informations fiables, à encourager le dialogue et à accompagner les personnes concernées avec dignité.</p><h2>S’informer auprès d’un professionnel de santé</h2><p>Tout changement inhabituel peut justifier un avis médical. Un professionnel de santé pourra évaluer la situation et orienter vers les soins adaptés. Les informations de cette publication ne remplacent pas un avis médical.</p><p class="source-note">Références : Organisation mondiale de la Santé — campagne 2026 et fiche d’information sur le cancer du sein.</p>'
  }
};

const sections = {
  institut: [
    { id: 'presentation', label: 'Présentation', title: 'Former avec exigence. Soigner avec humanité.', content: '<p>L’Institut de Formation en Soins Infirmiers et Obstétricaux de l’Université de Parakou prépare les professionnels qui contribuent chaque jour à la santé des populations.</p><p>Son projet pédagogique associe connaissances scientifiques, apprentissages pratiques et expérience de terrain. Les étudiants mobilisent les compétences acquises auprès des personnes, des familles et des communautés.</p><h2>Une communauté d’apprentissage</h2><p>Étudiants, enseignants, professionnels de santé et partenaires participent à une même ambition : développer des soins de qualité, adaptés aux besoins de santé et respectueux des personnes.</p><div class="editorial-callout"><span>LA MISSION</span><p>Former des professionnels rigoureux, responsables et engagés dans l’amélioration des pratiques de santé.</p></div>' },
    { id: 'dirigeants', label: 'Mot des dirigeants', title: 'Mot des dirigeants', content: '<p>Cette rubrique est réservée au message officiel de la direction de l’Institut.</p><p>Le texte sera publié ici après validation par l’IFSIO.</p>' },
    { id: 'equipe', label: 'Notre équipe', title: 'Une équipe au service de la formation', content: '<p>La page de présentation de l’équipe est prête à accueillir les noms, fonctions et portraits confirmés par l’Institut.</p>' },
    { id: 'honoraire', label: 'Équipe honoraire', title: 'Équipe honoraire', content: '<p>La liste des membres honoraires sera ajoutée après confirmation par l’administration de l’IFSIO.</p>' },
    { id: 'partenaires', label: 'Partenaires', title: 'Construire ensemble', content: '<p>Les partenaires institutionnels, académiques et professionnels seront présentés avec leurs informations officielles et leurs liens vérifiés.</p>' },
    { id: 'esii', label: 'École des infirmiers · ESIIE', title: 'École supérieure des infirmiers et infirmières d’État', content: '<p>L’ESIIE porte la formation en soins infirmiers au sein de l’IFSIO. Le parcours articule enseignements scientifiques, apprentissages pratiques et stages en milieu professionnel.</p><p>Les modalités d’admission et le calendrier sont publiés par l’Université pour chaque année de formation.</p>' },
    { id: 'essfe', label: 'École des sages-femmes · ESSFE', title: 'École supérieure des sages-femmes d’État', content: '<p>L’ESSFE forme les professionnelles de santé qui accompagnent la santé reproductive, la grossesse, la naissance et les premiers jours de vie.</p><p>La formation relie enseignements, apprentissages pratiques et stages en milieu professionnel.</p>' },
  ],
  vie: [
    { id: 'communaute', label: 'La communauté', title: 'La vie étudiante à l’IFSIO', content: '<p>Engagement, initiatives collectives et activités rythment la vie de la communauté étudiante. Le campus prolonge les apprentissages et nourrit les échanges entre promotions.</p><div class="feature-image"><img src="assets/vie-etudiante.jpg" alt="Étudiants et communauté de l’IFSIO"><span>LA COMMUNAUTÉ IFSIO · PARAKOU</span></div>' },
    { id: 'bue', label: 'Bureau des étudiants', title: 'Le Bureau des étudiants', content: '<p>Le BUE relaie les initiatives et les temps forts portés par la communauté étudiante.</p><div class="story-list">' + articleCard('gala') + articleCard('octobre') + '</div>' },
    { id: 'culture', label: 'Association culturelle', title: 'Culture & initiatives étudiantes', content: '<p>Une place pour les projets culturels, les rencontres, la création et les initiatives des étudiants.</p><div class="editorial-callout"><span>PUBLICATIONS</span><p>Les activités et annonces de l’Association culturelle seront ajoutées au fil de leur publication.</p></div>' },
    { id: 'activites', label: 'Activités', title: 'Activités de la communauté', content: '<p>Retrouvez les rendez-vous étudiants et les activités annoncées par l’Institut.</p><p>Aucune nouvelle activité n’est publiée pour le moment.</p>' },
    { id: 'insertion', label: 'Insertion professionnelle', title: 'Après la formation', content: '<p>Cette rubrique accueillera les informations officielles sur l’insertion professionnelle, les opportunités et l’accompagnement des diplômés.</p>' },
    { id: 'alumni', label: 'Réseau Alumni', title: 'Le réseau des diplômés', content: '<p>Le réseau Alumni prolonge les liens entre les diplômés, l’Institut et les nouvelles générations d’étudiants.</p>' },
  ],
  publication: [
    { id: 'a-la-une', label: 'À la une', title: 'Les publications de l’IFSIO', content: '<p>Actualités, communiqués et récits des activités de l’Institut et de sa communauté.</p><div class="story-list">' + articleCard('gala') + articleCard('octobre') + '</div>' },
    { id: 'actualites', label: 'Actualités', title: 'Actualités de l’Institut', content: '<p>Les nouvelles et temps forts publiés par l’IFSIO apparaîtront dans cette rubrique.</p><div class="story-list">' + articleCard('gala') + articleCard('octobre') + '</div>' },
    { id: 'communiques', label: 'Communiqués', title: 'Communiqués officiels', content: '<p>Les communiqués validés par l’Institut seront publiés dans cet espace.</p>' },
    { id: 'activites', label: 'Activités', title: 'Activités & événements', content: '<p>Les activités institutionnelles, scientifiques et étudiantes seront annoncées ici.</p>' },
  ],
  ressources: [
    { id: 'documents', label: 'Documents utiles', title: 'Documents & guides', content: '<p>Documents officiels, guides et formulaires publiés par l’Institut.</p><div class="empty-library"><span>PDF</span><div><b>Aucun document public pour le moment</b><small>Les documents seront accessibles ici dès leur publication.</small></div></div>' },
    { id: 'memoires', label: 'Mémoires & rapports', title: 'Mémoires & rapports', content: '<p>Un espace de consultation des mémoires et rapports de fin de formation, lorsque leur diffusion est autorisée.</p><div class="empty-library"><span>PDF</span><div><b>La médiathèque sera enrichie par l’IFSIO</b><small>Les fichiers publiés pourront être consultés et téléchargés.</small></div></div>' },
    { id: 'galerie', label: 'Galerie photo', title: 'Images de l’IFSIO', content: '<p>Des images des formations, du campus et des temps forts de la communauté.</p><div class="gallery-preview"><img src="assets/gala-2026-cover.jpg" alt="Gala IFSIO 2026"><img src="assets/formation-clinique.jpg" alt="Apprentissage en formation clinique"><img src="assets/formation-obstetrique.jpg" alt="Apprentissage en sciences obstétricales"></div>' },
    { id: 'videos', label: 'Vidéos', title: 'Vidéos de l’Institut', content: '<p>Les vidéos et productions audiovisuelles seront regroupées ici après validation des liens officiels.</p>' },
    { id: 'liens', label: 'Liens utiles', title: 'Liens institutionnels', content: '<p>Les liens officiels de l’Université et des services partenaires seront réunis dans cette rubrique après vérification.</p><a class="external-link" href="https://www.univ-parakou.bj/" target="_blank" rel="noopener noreferrer">Université de Parakou <span>↗</span></a>' },
  ],
};

function articleCard(key) {
  const article = articleData[key];
  return `<a class="story-card" href="?page=article&slug=${key}" data-route><img src="${article.cover}" alt="${article.alt}"><span class="story-card-copy"><small>${article.category} · ${article.date}</small><b>${article.title}</b><i>Lire l’article <span>↗</span></i></span></a>`;
}

function currentRoute() {
  const params = new URLSearchParams(location.search);
  return { page: params.get('page') || 'accueil', section: params.get('section') || '', slug: params.get('slug') || '' };
}

function routeLink(page, section = '') {
  return `?page=${encodeURIComponent(page)}${section ? `&section=${encodeURIComponent(section)}` : ''}`;
}

function renderHome() {
  document.title = 'IFSIO — Former, soigner, faire avancer';
  return `<section class="home-hero"><div class="shell home-hero-grid"><div class="home-copy"><p class="overline"><span></span> INSTITUT · UNIVERSITÉ DE PARAKOU</p><h1>Former pour<br>mieux <em>soigner.</em></h1><p class="home-lead">L’IFSIO prépare les professionnels de santé de demain, entre savoirs scientifiques, pratique et engagement humain.</p><a class="primary-button" href="?page=institut" data-route>Découvrir l’Institut <span>↗</span></a><div class="home-signature">SCIENCES INFIRMIÈRES <i>·</i> SCIENCES OBSTÉTRICALES</div></div><div class="home-photo"><img src="assets/etudiants.jpg" alt="Étudiants de l’IFSIO en cours"><div class="photo-caption"><span>PARAKOU · BÉNIN</span><b>Le savoir<br>au service du soin.</b></div></div><div class="hero-index">01 <span>/</span> IFSIO</div></div></section><section class="home-paths"><div class="shell"><div class="section-heading-row"><div><p class="overline">BIENVENUE À L’IFSIO</p><h2>Votre parcours<br>commence <em>ici.</em></h2></div><p>Un accès direct à l’Institut, à la vie étudiante, aux publications et aux services numériques.</p></div><div class="home-path-grid"><a href="?page=institut&section=esii" data-route><small>01 · FORMATION</small><b>École des<br>infirmiers</b><span>ESIIE ↗</span></a><a href="?page=institut&section=essfe" data-route><small>02 · FORMATION</small><b>École des<br>sages-femmes</b><span>ESSFE ↗</span></a><a href="?page=vie" data-route><small>03 · COMMUNAUTÉ</small><b>La vie<br>étudiante</b><span>Explorer ↗</span></a><a href="?page=etudiant" data-route><small>04 · SERVICES</small><b>Espace<br>étudiant</b><span>Accéder ↗</span></a></div></div></section><section class="home-feature"><div class="shell feature-grid"><div class="feature-image"><img src="assets/formation-clinique.jpg" alt="Apprentissage pratique des soins"><span>LA FORMATION EN PRATIQUE</span></div><div class="feature-copy"><p class="overline">APPRENDRE · PRATIQUER · TRANSMETTRE</p><h2>La compétence<br>se construit <em>sur le terrain.</em></h2><p>Une formation ancrée dans les réalités du soin, attentive aux besoins des personnes et des communautés.</p><a class="text-button" href="?page=institut&section=presentation" data-route>Notre projet pédagogique <span>↗</span></a></div></div></section><section class="home-latest"><div class="shell"><div class="section-heading-row"><div><p class="overline">LE JOURNAL DE L’IFSIO</p><h2>La vie de l’Institut,<br>en <em>mouvement.</em></h2></div><a class="text-button" href="?page=publication" data-route>Toutes les publications <span>↗</span></a></div><div class="latest-grid">${articleCard('gala')}${articleCard('octobre')}</div></div></section><section class="home-contact"><div class="shell home-contact-row"><div><p class="overline">UN RENSEIGNEMENT ?</p><h2>Nous sommes à votre écoute.</h2></div><a class="primary-button" href="?page=contact" data-route>Contacter l’Institut <span>↗</span></a></div></section>`;
}

function renderCategory(page, sectionId) {
  const items = sections[page] || sections.institut;
  const selected = items.find(item => item.id === sectionId) || items[0];
  const pageLabels = { institut: 'L’Institut', vie: 'Vie étudiante', publication: 'Publication', ressources: 'Ressources' };
  document.title = `${selected.label} — ${pageLabels[page]} | IFSIO`;
  const sidebar = items.map(item => `<a class="${item.id === selected.id ? 'active' : ''}" href="${routeLink(page, item.id)}" data-route>${item.label}<span>→</span></a>`).join('');
  const cover = page === 'institut' ? 'assets/campus-2.jpg' : page === 'vie' ? 'assets/vie-etudiante.jpg' : page === 'publication' ? 'assets/gala-2026-cover.jpg' : 'assets/formation-clinique.jpg';
  const categoryLabels = { institut: 'L’INSTITUT', vie: 'CAMPUS & COMMUNAUTÉ', publication: 'ACTUALITÉS & ÉDITORIAL', ressources: 'DOCUMENTS & MÉDIAS' };
  return `<section class="inner-hero"><div class="shell"><div class="breadcrumbs"><a href="?page=accueil" data-route>Accueil</a><span>/</span><span>${pageLabels[page]}</span></div><div class="inner-hero-grid"><div><p class="overline">${categoryLabels[page]}</p><h1>${pageLabels[page]}</h1><p>${page === 'institut' ? 'Découvrir la mission, les écoles et les équipes de l’Institut.' : page === 'vie' ? 'Suivre les initiatives et les temps forts de la communauté étudiante.' : page === 'publication' ? 'Les actualités, annonces et récits de la communauté IFSIO.' : 'Documents, images et liens utiles réunis au même endroit.'}</p></div><img src="${cover}" alt="${pageLabels[page]} · IFSIO"></div></div></section><div class="shell inner-layout"><aside class="section-sidebar"><span class="sidebar-label">DANS CETTE RUBRIQUE</span><nav aria-label="Sous-navigation">${sidebar}</nav><div class="sidebar-contact"><span>UNE QUESTION ?</span><a href="?page=contact" data-route>Nous contacter ↗</a></div></aside><article class="inner-content"><p class="content-eyebrow">${selected.label.toUpperCase()}</p><h2>${selected.title}</h2><div class="rich-content">${selected.content}</div><div class="content-pagination"><a href="?page=accueil" data-route>← Retour à l’accueil</a><a href="?page=contact" data-route>Besoin d’information ? <b>Nous contacter ↗</b></a></div></article></div>`;
}

function renderArticle(slug) {
  const article = articleData[slug];
  if (!article) return renderNotFound();
  document.title = `${article.title} — IFSIO`;
  return `<section class="inner-hero article-hero"><div class="shell"><div class="breadcrumbs"><a href="?page=accueil" data-route>Accueil</a><span>/</span><a href="?page=publication" data-route>Publication</a><span>/</span><span>${article.category}</span></div><div class="article-head"><p class="overline">${article.category.toUpperCase()} <i>·</i> ${article.date.toUpperCase()}</p><h1>${article.title}</h1><p>${article.intro}</p></div></div></section><div class="shell article-layout"><a class="back-link" href="?page=publication" data-route>← Retour aux publications</a><article class="article-body"><figure><img src="${article.cover}" alt="${article.alt}"><figcaption>${article.category} · IFSIO</figcaption></figure><p class="article-lead">${article.intro}</p>${article.body}</article><aside class="article-related"><span>À DÉCOUVRIR</span><a href="?page=article&slug=${slug === 'gala' ? 'octobre' : 'gala'}" data-route>${articleData[slug === 'gala' ? 'octobre' : 'gala'].title} <b>↗</b></a><a href="?page=vie&section=bue" data-route>Vie étudiante <b>↗</b></a></aside></div>`;
}

function renderContact() {
  document.title = 'Contact — IFSIO | Université de Parakou';
  return `<section class="inner-hero"><div class="shell"><div class="breadcrumbs"><a href="?page=accueil" data-route>Accueil</a><span>/</span><span>Contact</span></div><div class="contact-hero"><p class="overline">NOUS JOINDRE</p><h1>Parlons de<br><em>votre projet.</em></h1><p>L’équipe de l’IFSIO vous oriente vers les informations sur les formations, les admissions et la vie de l’Institut.</p></div></div></section><section class="shell contact-page"><div class="contact-info"><span>INSTITUT DE FORMATION EN SOINS INFIRMIERS ET OBSTÉTRICAUX</span><a href="mailto:contact.ifsio-up@gouv.bj"><small>COURRIEL</small><b>contact.ifsio-up@gouv.bj</b><i>↗</i></a><a href="tel:+2290123612046"><small>TÉLÉPHONE</small><b>(+229) 01 23 61 20 46</b><i>↗</i></a><div><small>ADRESSE</small><b>Université de Parakou</b><i>Parakou, Bénin</i></div></div><div class="contact-note"><p class="overline">POUR NOUS AIDER À VOUS RÉPONDRE</p><h2>Indiquez l’objet de votre demande, la formation concernée et votre niveau d’étude.</h2><p>Les informations de contact et horaires seront confirmés par l’Institut avant la mise en ligne définitive.</p></div></section>`;
}

function localServiceUrl(port, pathname) {
  const url = new URL(location.href);
  url.port = port;
  url.pathname = pathname;
  url.search = '';
  url.hash = '';
  return url.href;
}

function renderStudent() {
  document.title = 'Espace étudiant — IFSIO';
  const portal = localServiceUrl('8081', '/espace-apprenants.html');
  const results = localServiceUrl('5174', '/');
  return `<section class="student-page-hero"><div class="shell"><div class="breadcrumbs"><a href="?page=accueil" data-route>Accueil</a><span>/</span><span>Espace étudiant</span></div><p class="overline">SERVICES NUMÉRIQUES</p><h1>Votre parcours<br>continue <em>ici.</em></h1><p>Retrouvez les services et informations destinés aux étudiantes et étudiants de l’IFSIO.</p></div></section><section class="shell service-grid"><a href="${portal}" class="service-card"><span>01 · PORTAIL ÉTUDIANT</span><h2>Cours, ressources<br>et informations</h2><p>Accéder au portail étudiant de l’IFSIO.</p><b>Ouvrir le portail ↗</b></a><a href="${results}" class="service-card service-card-primary"><span>02 · RÉSULTATS ACADÉMIQUES</span><h2>Consulter<br>mes résultats</h2><p>Un service indépendant, accessible avec le matricule étudiant.</p><b>Accéder à MES RESULTATS ↗</b></a></section>`;
}

function renderSearchPage() {
  document.title = 'Recherche — IFSIO';
  return `<section class="inner-hero"><div class="shell"><div class="breadcrumbs"><a href="?page=accueil" data-route>Accueil</a><span>/</span><span>Recherche</span></div><div class="contact-hero"><p class="overline">RECHERCHE SUR LE SITE</p><h1>Que recherchez-vous ?</h1><p>Pages, formations, publications et services de l’IFSIO.</p><button class="primary-button search-page-trigger" type="button">Lancer une recherche <span>⌕</span></button></div></div></section>`;
}

function renderNotFound() {
  document.title = 'Page introuvable — IFSIO';
  return `<section class="not-found"><div class="shell"><p class="overline">IFSIO · UNIVERSITÉ DE PARAKOU</p><h1>Cette page n’est pas disponible.</h1><a class="primary-button" href="?page=accueil" data-route>Retour à l’accueil ↗</a></div></section>`;
}

function render() {
  const { page, section, slug } = currentRoute();
  document.body.dataset.page = page;
  document.querySelectorAll('.main-nav [data-route]').forEach(link => {
    const target = new URL(link.href);
    const activePage = page === 'article' ? 'publication' : page;
    const active = target.searchParams.get('page') === activePage;
    if (active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  if (page === 'accueil') app.innerHTML = renderHome();
  else if (page === 'institut' || page === 'vie' || page === 'publication' || page === 'ressources') app.innerHTML = renderCategory(page, section);
  else if (page === 'article') app.innerHTML = renderArticle(slug);
  else if (page === 'contact') app.innerHTML = renderContact();
  else if (page === 'etudiant') app.innerHTML = renderStudent();
  else if (page === 'recherche') app.innerHTML = renderSearchPage();
  else app.innerHTML = renderNotFound();
  closeMenu();
  app.focus({ preventScroll: true });
}

document.addEventListener('click', (event) => {
  const link = event.target.closest('a[data-route]');
  if (!link || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  if (searchDialog.open && searchDialog.contains(link)) searchDialog.close();
  history.pushState({}, '', link.href);
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});
window.addEventListener('popstate', render);

const closeMenu = () => {
  if (!menuButton || !navigation) return;
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Ouvrir le menu');
  navigation.classList.remove('is-open');
};

menuButton?.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!open));
  menuButton.setAttribute('aria-label', open ? 'Ouvrir le menu' : 'Fermer le menu');
  navigation.classList.toggle('is-open', !open);
});
navigation?.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });

const searchIndex = [
  ['Présentation de l’IFSIO', 'institut', 'presentation', 'mission formation université parakou'],
  ['Mot des dirigeants', 'institut', 'dirigeants', 'direction'],
  ['Notre équipe', 'institut', 'equipe', 'enseignants équipe'],
  ['Partenaires', 'institut', 'partenaires', 'partenariat'],
  ['École des infirmiers · ESIIE', 'institut', 'esii', 'soins infirmiers licence'],
  ['École des sages-femmes · ESSFE', 'institut', 'essfe', 'obstétrique maïeutique'],
  ['Bureau des étudiants', 'vie', 'bue', 'bureau étudiants gala'],
  ['Association culturelle', 'vie', 'culture', 'association culture'],
  ['Insertion professionnelle', 'vie', 'insertion', 'emploi diplômés'],
  ['Gala IFSIO 2026', 'article', 'gala', 'publication soirée photos'],
  ['Octobre Rose Vibes 2026', 'article', 'octobre', 'santé prévention publication'],
  ['Documents utiles', 'ressources', 'documents', 'guide pdf formulaires'],
  ['Galerie photo', 'ressources', 'galerie', 'photos images'],
  ['Contact', 'contact', '', 'courriel téléphone adresse'],
  ['Espace étudiant', 'etudiant', '', 'portail résultats matricule'],
];
const normalize = text => String(text).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr');
const renderSearchResults = () => {
  const terms = normalize(searchInput.value.trim()).split(/\s+/).filter(Boolean);
  searchResults.replaceChildren();
  if (!terms.length) {
    const hint = document.createElement('p'); hint.className = 'search-hint'; hint.textContent = 'Essayez : ESSFE, admission, vie étudiante, gala…'; searchResults.append(hint); return;
  }
  const found = searchIndex.filter(([label, , , keywords]) => terms.every(term => normalize(`${label} ${keywords}`).includes(term)));
  if (!found.length) {
    const empty = document.createElement('p'); empty.className = 'search-hint'; empty.textContent = 'Aucun résultat. Essayez un autre terme.'; searchResults.append(empty); return;
  }
  for (const [label, page, section] of found.slice(0, 8)) {
    const link = document.createElement('a'); link.href = routeLink(page, section); link.dataset.route = ''; link.className = 'search-result';
    const text = document.createElement('span'); text.textContent = label;
    const arrow = document.createElement('b'); arrow.textContent = '↗'; link.append(text, arrow); searchResults.append(link);
  }
};
document.querySelector('.search-trigger')?.addEventListener('click', () => { searchDialog.showModal(); searchInput.focus(); renderSearchResults(); });
document.querySelector('.dialog-close')?.addEventListener('click', () => searchDialog.close());
document.querySelector('.search-page-trigger')?.addEventListener('click', () => { searchDialog.showModal(); searchInput.focus(); renderSearchResults(); });
searchInput?.addEventListener('input', renderSearchResults);
searchResults?.addEventListener('click', event => { if (event.target.closest('a')) searchDialog.close(); });
searchDialog?.addEventListener('click', event => { if (event.target === searchDialog) searchDialog.close(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });

render();
