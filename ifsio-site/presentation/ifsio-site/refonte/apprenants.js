const entry = document.querySelector('#student-entry');
const dashboard = document.querySelector('#student-dashboard');
const publicFooter = document.querySelector('#student-public-footer');
const loginMessage = document.querySelector('#login-message');
const registerDialog = document.querySelector('#student-register-dialog');
const registerMessage = document.querySelector('#register-message');
const api = async (url, options = {}) => {
  const response = await fetch(url, { credentials: 'same-origin', ...options });
  const data = response.status === 204 ? null : await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error || 'Une erreur est survenue. Réessayez.');
  return data;
};

// Sur téléphone, localhost désigne le téléphone. Garder le même hôte que le
// portail IFSIO et ne changer que le port pour atteindre MES RESULTATS.
const resultsUrl = new URL(window.location.href);
resultsUrl.port = '5174';
resultsUrl.pathname = '/';
resultsUrl.search = '';
resultsUrl.hash = '';
document.querySelectorAll('.student-results-button, .student-results-sidebar').forEach((link) => {
  link.href = resultsUrl.href;
});

function showEntry() {
  dashboard.hidden = true;
  entry.hidden = false;
  publicFooter.hidden = false;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function showDashboard() {
  entry.hidden = true;
  publicFooter.hidden = true;
  dashboard.hidden = false;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function setDemoProfile() {
  document.querySelector('#student-mode-label').innerHTML = '<i></i> MODE DÉMONSTRATION · CONTENUS FICTIFS';
  document.querySelector('#student-full-name').textContent = 'Mariam A.';
  document.querySelector('#student-profile-meta').textContent = 'Étudiante · Exemple';
  document.querySelector('#student-avatar').textContent = 'MA';
  document.querySelector('#student-greeting').textContent = 'Mariam';
  document.querySelector('#student-programme').textContent = 'Licence 2 · Exemple';
  document.querySelector('#student-filiere').textContent = 'Filière de démonstration';
  document.querySelector('#student-academic-year').textContent = '—';
  document.querySelector('#student-logout').hidden = true;
  document.querySelector('#close-demo').hidden = false;
  document.querySelector('#student-dashboard-footnote').textContent = 'Démo visuelle · contenus fictifs';
}
function addEmpty(container, title, description) {
  const card = document.createElement('article');
  card.className = 'student-content-card student-empty-state';
  const icon = document.createElement('span'); icon.className = 'empty-state-icon'; icon.textContent = '▧';
  const heading = document.createElement('h3'); heading.textContent = title;
  const text = document.createElement('p'); text.textContent = description;
  card.append(icon, heading, text); container.replaceChildren(card);
}
function renderStudentDashboard(data) {
  const student = data.student;
  const name = student.full_name || 'Étudiant';
  const firstName = name.trim().split(/\s+/).at(-1);
  document.querySelector('#student-mode-label').innerHTML = '<i></i> COMPTE ÉTUDIANT';
  document.querySelector('#student-full-name').textContent = name;
  document.querySelector('#student-profile-meta').textContent = [student.niveau, student.filiere].filter(Boolean).join(' · ') || 'Étudiant IFSIO';
  document.querySelector('#student-avatar').textContent = name.split(/\s+/).slice(0,2).map(part => part[0]?.toUpperCase() || '').join('');
  document.querySelector('#student-greeting').textContent = firstName;
  document.querySelector('#student-programme').textContent = student.niveau || 'Parcours étudiant';
  document.querySelector('#student-filiere').textContent = student.filiere || 'Filière non renseignée';
  document.querySelector('#student-academic-year').textContent = student.annee_academique || '—';
  document.querySelector('#student-logout').hidden = false;
  document.querySelector('#close-demo').hidden = true;
  document.querySelector('#student-dashboard-footnote').textContent = 'Compte actif · contenus de l’Institut';

  const newsList = document.querySelector('#student-news-list');
  if (!data.news?.length) addEmpty(newsList, 'Aucune annonce pour le moment', 'Les informations publiées par l’Institut apparaîtront ici.');
  else {
    const fragment = document.createDocumentFragment();
    for (const item of data.news) {
      const article = document.createElement('article'); article.className = 'student-news-item';
      const title = document.createElement('b'); title.textContent = item.title;
      const summary = document.createElement('p'); summary.textContent = item.summary || item.body;
      const meta = document.createElement('small'); meta.textContent = [item.category, item.published_at ? new Date(item.published_at).toLocaleDateString('fr-FR') : ''].filter(Boolean).join(' · ');
      article.append(title, meta, summary); fragment.append(article);
    }
    newsList.replaceChildren(fragment);
  }
  const resourcesList = document.querySelector('#student-resources-list');
  const resources = data.resources || [];
  document.querySelector('#student-resource-count').textContent = `${resources.length} document${resources.length === 1 ? '' : 's'} disponible${resources.length === 1 ? '' : 's'}`;
  if (!resources.length) addEmpty(resourcesList, 'Aucune ressource publiée', 'Les documents partagés par l’équipe pédagogique apparaîtront ici.');
  else {
    const fragment = document.createDocumentFragment();
    for (const item of resources) {
      const card = document.createElement('article'); card.className = 'student-resource-card';
      const info = document.createElement('div');
      const title = document.createElement('b'); title.textContent = item.title;
      const description = document.createElement('p'); description.textContent = item.description || item.category || item.original_name;
      info.append(title, description);
      const link = document.createElement('a'); link.href = `/api/student/resources/${encodeURIComponent(item.id)}/download`; link.textContent = 'Télécharger ↓';
      link.setAttribute('download', item.original_name);
      card.append(info, link); fragment.append(card);
    }
    resourcesList.replaceChildren(fragment);
  }

  const courseList = document.querySelector('#student-course-list');
  const courses = data.courses || [];
  if (!courses.length) addEmpty(courseList, 'Aucun cours associé à votre inscription', 'Les cours apparaîtront après leur configuration par l’équipe de l’Institut.');
  else {
    const fragment = document.createDocumentFragment();
    for (const item of courses) {
      const card = document.createElement('article'); card.className = 'student-content-card student-course-card';
      const code = document.createElement('span'); code.className = 'student-kicker'; code.textContent = item.code;
      const title = document.createElement('h3'); title.textContent = item.title;
      const description = document.createElement('p'); description.textContent = item.description || 'Aucune description renseignée.';
      const meta = document.createElement('small'); meta.textContent = `${item.niveau} · ${item.annee_academique}`;
      card.append(code, title, description, meta); fragment.append(card);
    }
    courseList.replaceChildren(fragment);
  }

  const eventList = document.querySelector('#student-event-list');
  const events = data.events || [];
  if (!events.length) addEmpty(eventList, 'Aucun événement à venir', 'Les prochaines dates apparaîtront ici dès leur publication.');
  else {
    const fragment = document.createDocumentFragment();
    for (const item of events) {
      const card = document.createElement('article'); card.className = 'student-content-card student-event-card';
      const date = new Date(item.starts_at);
      const stamp = document.createElement('div'); stamp.className = 'student-event-date';
      const day = document.createElement('b'); day.textContent = new Intl.DateTimeFormat('fr-FR', { day: '2-digit' }).format(date);
      const month = document.createElement('small'); month.textContent = new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(date).replace('.', '').toUpperCase();
      stamp.append(day, month);
      const info = document.createElement('div'); info.className = 'student-event-info';
      const title = document.createElement('h3'); title.textContent = item.title;
      const when = document.createElement('p'); when.textContent = [date.toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' }), item.location].filter(Boolean).join(' · ');
      info.append(title, when);
      if (item.description) { const description = document.createElement('p'); description.className = 'student-event-description'; description.textContent = item.description; info.append(description); }
      card.append(stamp, info); fragment.append(card);
    }
    eventList.replaceChildren(fragment);
  }
}
async function enterRealDashboard(user) {
  if (user.role !== 'student') { await api('/api/auth/logout', { method: 'POST' }).catch(() => {}); throw new Error('Ce compte ne donne pas accès à l’espace étudiant.'); }
  const data = await api('/api/student/dashboard');
  renderStudentDashboard(data);
  showDashboard();
}

// Démonstration de l’interface, distincte des comptes réels.
document.querySelector('#open-demo')?.addEventListener('click', () => { setDemoProfile(); showDashboard(); });
document.querySelector('#close-demo')?.addEventListener('click', showEntry);

document.querySelector('#student-login-form')?.addEventListener('submit', async (event) => {
  event.preventDefault();
  loginMessage.hidden = false;
  loginMessage.textContent = 'Connexion en cours…';
  try {
    const { user } = await api('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: document.querySelector('#student-email').value, password: document.querySelector('#student-password').value }) });
    await enterRealDashboard(user);
  } catch (error) { loginMessage.textContent = error.message; }
});

document.querySelector('#show-register')?.addEventListener('click', () => { registerMessage.hidden = true; registerDialog.showModal(); });
document.querySelector('#close-register')?.addEventListener('click', () => registerDialog.close());
document.querySelector('#student-register-form')?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const values = Object.fromEntries(new FormData(form).entries());
  registerMessage.hidden = false;
  registerMessage.textContent = 'Envoi de la demande…';
  try {
    const result = await api('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) });
    registerMessage.textContent = result.message;
    form.reset();
  } catch (error) { registerMessage.textContent = error.message; }
});
document.querySelector('#show-recovery')?.addEventListener('click', () => {
  loginMessage.hidden = false;
  loginMessage.textContent = 'Pour réinitialiser votre mot de passe, contactez l’Institut à contact.ifsio-up@gouv.bj.';
});
document.querySelector('#student-logout')?.addEventListener('click', async () => {
  try { await api('/api/auth/logout', { method: 'POST' }); } catch {}
  showEntry();
});

document.querySelectorAll('.student-nav-item').forEach((button) => button.addEventListener('click', () => {
  document.querySelectorAll('.student-nav-item').forEach((item) => item.classList.toggle('is-current', item === button));
  document.querySelectorAll('.student-view').forEach((panel) => panel.classList.toggle('is-visible', panel.dataset.panel === button.dataset.view));
}));

document.querySelector('#year').textContent = new Date().getFullYear();
document.querySelector('#student-year').textContent = new Date().getFullYear();
api('/api/auth/me').then(({ user }) => enterRealDashboard(user)).catch(() => {});
