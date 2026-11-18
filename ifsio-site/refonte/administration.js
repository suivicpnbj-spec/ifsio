const loginSection=document.querySelector('#admin-login');
const dashboard=document.querySelector('#cms-preview');
const loginForm=document.querySelector('#admin-login-form');
const loginMessage=document.querySelector('#admin-login-message');
const contentList=document.querySelector('#cms-content-list');
const studentList=document.querySelector('#cms-student-list');
const titleField=document.querySelector('#cms-title');
const typeField=document.querySelector('#cms-type');
const categoryField=document.querySelector('#cms-category');
const audienceField=document.querySelector('#cms-audience');
const bodyField=document.querySelector('#cms-body');
const summaryField=document.querySelector('#cms-summary');
const coverField=document.querySelector('#cms-cover');
const fileField=document.querySelector('#cms-file');
const editorHeading=document.querySelector('#cms-editor-heading');
const editorSubtitle=document.querySelector('#cms-editor-subtitle');
const statusChip=document.querySelector('#cms-status-chip');
const editorMessage=document.querySelector('#cms-editor-message');
const previewDialog=document.querySelector('#cms-preview-dialog');
const storageKey='ifsio-cms-demo-content-v1';
const previewButtons=document.querySelectorAll('[data-admin-preview]');
let activeId=null;
let activeKind=null;
let demoMode=new URLSearchParams(location.search).has('preview');
let currentAdmin=null;

const api=async(url,options={})=>{
  const response=await fetch(url,{credentials:'same-origin',...options});
  const data=response.status===204?null:await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(data?.error||'Une erreur est survenue. Réessayez.');
  return data;
};
const el=(tag,text,className)=>{const node=document.createElement(tag);node.textContent=String(text??'');if(className)node.className=className;return node;};
const jsonOptions=(method,body)=>({method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
function toggleDashboard(show,demo=demoMode){
  dashboard.hidden=!show;loginSection.hidden=show;
  if(!show){loginSection.scrollIntoView({behavior:'smooth',block:'start'});return;}
  demoMode=demo;
  document.querySelector('.prototype-mark').textContent=demo?'APERÇU DE LA MAQUETTE':'ESPACE ADMINISTRATEUR ACTIF';
  document.querySelector('#cms-admin-name').textContent=demo?'Mode démonstration':(currentAdmin?.full_name||'Administration');
  document.querySelector('#cms-admin-mode').textContent=demo?'Aucun compte connecté':(currentAdmin?.email||'Compte habilité');
  document.querySelector('#cms-logout').hidden=demo;
  document.querySelector('#cms-list-caption').textContent=demo?'Éléments de démo conservés dans ce navigateur':'Contenus enregistrés sur le serveur IFSIO';
  editorSubtitle.textContent=demo?'Cette démonstration sauvegarde dans ce navigateur.':'Les contenus sont enregistrés sur le serveur IFSIO.';
  editorMessage.textContent=demo?'Les publications restent dans cette démonstration.':'Les contenus publiés sont visibles depuis le site IFSIO.';
  refreshAll();dashboard.scrollIntoView({behavior:'smooth',block:'start'});
}
function demoItems(){try{const value=JSON.parse(localStorage.getItem(storageKey)||'[]');return Array.isArray(value)?value:[];}catch{editorMessage.textContent='Stockage local du navigateur indisponible.';return[];}}
function saveDemoItems(items){try{localStorage.setItem(storageKey,JSON.stringify(items));return true;}catch{editorMessage.textContent='Impossible de sauvegarder dans ce navigateur.';return false;}}
function setTypeMode(){
  const type=typeField.value;
  const resource=type==='resource',course=type==='course',event=type==='event';
  document.querySelector('#cms-file-field').hidden=!resource;
  document.querySelector('#cms-summary-field').hidden=type!=='news';
  document.querySelector('#cms-cover-field').hidden=type!=='news';
  document.querySelector('#cms-body-field').hidden=resource;
  document.querySelector('#cms-audience-field').hidden=course;
  for(const id of ['cms-course-code-field','cms-course-school-field','cms-course-level-field','cms-course-year-field'])document.querySelector(`#${id}`).hidden=!course;
  for(const id of ['cms-event-start-field','cms-event-end-field','cms-event-location-field'])document.querySelector(`#${id}`).hidden=!event;
  document.querySelector('#cms-resource-course-field').hidden=!resource;
  bodyField.required=!(resource||course||event);
  fileField.required=resource&&!activeId;
  if(resource)editorMessage.textContent='Le document sera stocké sur le serveur IFSIO.';
  else if(course)editorMessage.textContent='Le cours sera associé à une école, un niveau et une année.';
  else if(event)editorMessage.textContent=demoMode?'Événement de démonstration enregistré dans ce navigateur.':'La date sera publiée dans le calendrier étudiant.';
  else editorMessage.textContent=demoMode?'Les publications restent dans cette démonstration.':'Les contenus publiés sont visibles depuis le site IFSIO.';
}
function resetEditor(){
  activeId=null;activeKind=null;
  titleField.value='';typeField.value='page';categoryField.value='';audienceField.value='public';bodyField.value='';summaryField.value='';fileField.value='';coverField.value='';document.querySelector('#cms-cover-current').textContent='';
  document.querySelector('#cms-course-code').value='';document.querySelector('#cms-course-school').value='';document.querySelector('#cms-course-level').value='';document.querySelector('#cms-course-year').value='';
  document.querySelector('#cms-event-start').value='';document.querySelector('#cms-event-end').value='';document.querySelector('#cms-event-location').value='';document.querySelector('#cms-resource-course').value='';
  editorHeading.textContent='Créer un contenu';statusChip.lastChild.textContent=' Brouillon';setTypeMode();
}
function formatStatus(type,item){
  if(type==='course')return 'Cours actif';
  if(type==='resource')return item.status==='draft'?'Brouillon':'Disponible';
  return item.status==='published'?'Publié':'Brouillon';
}
function dateLabel(value){return value?new Date(value).toLocaleString('fr-FR',{dateStyle:'medium',timeStyle:'short'}):'';}
function appendItemRow(list,item,type){
  const row=document.createElement('article');row.className='cms-content-row';
  const details=document.createElement('div');details.className='cms-content-details';
  let meta='';
  if(type==='resource')meta=['Document',item.category,item.course_title,item.created_at&&new Date(item.created_at).toLocaleDateString('fr-FR')].filter(Boolean).join(' · ');
  else if(type==='course')meta=[`Cours · ${item.code}`,item.filiere,item.niveau,item.annee_academique].filter(Boolean).join(' · ');
  else if(type==='event')meta=[`Événement · ${dateLabel(item.starts_at)}`,item.location].filter(Boolean).join(' · ');
  else meta=[item.kind==='page'?'Page institutionnelle':'Actualité',item.category,item.updated_at?new Date(item.updated_at).toLocaleDateString('fr-FR'):''].filter(Boolean).join(' · ');
  details.append(el('b',item.title),el('small',meta));
  const actions=document.createElement('div');actions.className='cms-row-actions';
  const statusText=type==='demo'?(item.status==='published'?'Publié (démo)':'Brouillon (démo)'):formatStatus(type,item);
  actions.append(el('span',statusText,`cms-row-status${item.status==='published'||type==='course'?' is-published':''}`));
  if(type==='content'&&['page','news'].includes(item.kind)&&item.status==='published'&&item.audience==='public'){
    const link=document.createElement('a');link.href=`/page.html?view=contenu&slug=${encodeURIComponent(item.slug)}`;link.target='_blank';link.rel='noopener';link.textContent='Voir le site';link.className='cms-row-link';actions.append(link);
  }
  if(type==='resource'){
    const link=document.createElement('a');link.href=`/api/admin/resources/${encodeURIComponent(item.id)}/download`;link.textContent='Télécharger';link.className='cms-row-link';actions.append(link);
    if(item.status==='draft'){
      const publish=document.createElement('button');publish.type='button';publish.textContent='Publier';publish.dataset.action='publish';publish.dataset.id=item.id;publish.dataset.kind=type;actions.append(publish);
    }
  }else{
    if(type!=='course'){
      const preview=document.createElement('button');preview.type='button';preview.textContent='Aperçu';preview.dataset.action='preview';preview.dataset.id=item.id;preview.dataset.kind=type;actions.append(preview);
      if(item.status==='draft'){
        const publish=document.createElement('button');publish.type='button';publish.textContent='Publier';publish.dataset.action='publish';publish.dataset.id=item.id;publish.dataset.kind=type;actions.append(publish);
      }
    }
    const edit=document.createElement('button');edit.type='button';edit.textContent='Modifier';edit.dataset.action='edit';edit.dataset.id=item.id;edit.dataset.kind=type;actions.append(edit);
  }
  const remove=document.createElement('button');remove.type='button';remove.textContent='Supprimer';remove.dataset.action='delete';remove.dataset.id=item.id;remove.dataset.kind=type;actions.append(remove);
  row.append(details,actions);list.append(row);
}
function renderContents(content,resources=[],courses=[],events=[]){
  contentList.replaceChildren();
  const rows=[...content.map(item=>({...item,_kind:demoMode?'demo':'content'})),...resources.map(item=>({...item,_kind:'resource'})),...courses.map(item=>({...item,_kind:'course'})),...events.map(item=>({...item,_kind:'event'}))];
  rows.sort((a,b)=>new Date(b.updated_at||b.updatedAt||b.created_at||b.starts_at||0)-new Date(a.updated_at||a.updatedAt||a.created_at||a.starts_at||0));
  if(!rows.length){const empty=document.createElement('div');empty.className='cms-empty';empty.append(el('span','✎'),el('b','Aucun contenu enregistré'),el('small','Ajoutez une page, une actualité, un cours, un événement ou une ressource.'));contentList.append(empty);return;}
  const list=document.createElement('div');list.className='cms-content-items';rows.forEach(item=>appendItemRow(list,item,item._kind));contentList.append(list);
}
function renderStudents(students){
  studentList.replaceChildren();
  if(!students.length){const empty=document.createElement('div');empty.className='cms-empty';empty.append(el('span','♙'),el('b','Aucune demande en attente'),el('small','Les nouvelles demandes apparaîtront ici.'));studentList.append(empty);return;}
  const list=document.createElement('div');list.className='cms-content-items';
  for(const student of students){
    const row=document.createElement('article');row.className='cms-content-row';const details=document.createElement('div');details.className='cms-content-details';
    details.append(el('b',student.full_name),el('small',[student.matricule,student.email,student.niveau,student.filiere].filter(Boolean).join(' · ')));
    const actions=document.createElement('div');actions.className='cms-row-actions';
    for(const [label,status]of[['Valider','active'],['Refuser','suspended']]){const button=document.createElement('button');button.type='button';button.textContent=label;button.dataset.studentId=student.id;button.dataset.studentStatus=status;actions.append(button);}
    row.append(details,actions);list.append(row);
  }
  studentList.append(list);
}
async function refreshReal(){
  const [content,resources,courses,events,students,overview]=await Promise.all([
    api('/api/admin/content'),api('/api/admin/resources'),api('/api/admin/courses'),api('/api/admin/events'),api('/api/admin/students?status=pending'),api('/api/admin/overview'),
  ]);
  renderContents(content.content,resources.resources,courses.courses,events.events);renderStudents(students.students);
  const metrics=document.querySelectorAll('.cms-metrics>div');
  if(metrics[0])metrics[0].querySelector('b').textContent=`${overview.contents+courses.courses.length+events.events.length} élément${overview.contents+courses.courses.length+events.events.length===1?'':'s'}`;
  if(metrics[1])metrics[1].querySelector('b').textContent=`${overview.published} publication${overview.published===1?'':'s'}`;
  if(metrics[2])metrics[2].querySelector('b').textContent=`${overview.resources} document${overview.resources===1?'':'s'} · ${overview.pending_students} demande${overview.pending_students===1?'':'s'} en attente`;
  const courseSelect=document.querySelector('#cms-resource-course');const selected=courseSelect.value;courseSelect.replaceChildren(new Option('Ressource générale',''));
  for(const course of courses.courses)courseSelect.add(new Option(`${course.code} · ${course.title}`,course.id));courseSelect.value=selected;
}
function refreshDemo(){renderContents(demoItems(),[],[],[]);renderStudents([]);}
function refreshAll(){if(demoMode){refreshDemo();return;}refreshReal().catch(error=>{editorMessage.textContent=error.message;});}
function isoDate(value){if(!value)return null;const date=new Date(value);if(Number.isNaN(date.valueOf()))throw new Error('Date invalide.');return date.toISOString();}
function editorValue(status){
  const title=titleField.value.trim();if(!title){titleField.focus();throw new Error('Le titre est obligatoire.');}
  const type=typeField.value;
  if(type==='resource'){
    if(!demoMode&&!activeId&&!fileField.files?.[0])throw new Error('Sélectionnez un document à téléverser.');
    return{kind:'resource',title,category:categoryField.value,audience:audienceField.value,status,description:bodyField.value.trim(),course_id:document.querySelector('#cms-resource-course').value||''};
  }
  const description=bodyField.value.trim();
  if(type==='course'){
    const code=document.querySelector('#cms-course-code').value.trim(),filiere=document.querySelector('#cms-course-school').value,niveau=document.querySelector('#cms-course-level').value,annee_academique=document.querySelector('#cms-course-year').value.trim();
    if(!code||!filiere||!niveau||!/^\d{4}-\d{4}$/.test(annee_academique))throw new Error('Renseignez le code, l’école, le niveau et une année au format AAAA-AAAA.');
    return{kind:'course',title,description,code,filiere,niveau,annee_academique};
  }
  if(type==='event'){
    const starts_at=isoDate(document.querySelector('#cms-event-start').value),ends_at=isoDate(document.querySelector('#cms-event-end').value),location=document.querySelector('#cms-event-location').value.trim();
    if(!starts_at)throw new Error('Indiquez la date de début de l’événement.');
    if(ends_at&&new Date(ends_at)<new Date(starts_at))throw new Error('La date de fin doit suivre la date de début.');
    return{kind:'event',title,description,starts_at,ends_at,location,audience:audienceField.value,status};
  }
  if(!description){bodyField.focus();throw new Error('Le contenu est obligatoire.');}
  return{title,body:description,summary:type==='news'?(summaryField.value.trim()||description.slice(0,350)):description.slice(0,350),category:categoryField.value,audience:audienceField.value,status,kind:type};
}
async function saveContent(status){
  let value;try{value=editorValue(status);}catch(error){editorMessage.textContent=error.message;return false;}
  try{
    if(demoMode){
      if(value.kind==='resource'){editorMessage.textContent='Le téléversement de documents nécessite une session administrateur réelle.';return false;}
      const items=demoItems(),old=items.find(item=>item.id===activeId),item={...value,id:activeId||crypto.randomUUID(),status,updatedAt:new Date().toISOString(),createdAt:old?.createdAt||new Date().toISOString()};
      if(!saveDemoItems(old?items.map(entry=>entry.id===activeId?item:entry):[...items,item]))return false;
      editorMessage.textContent='Enregistré dans le navigateur uniquement.';
    }else if(value.kind==='resource'){
      const form=new FormData();Object.entries(value).forEach(([key,val])=>form.append(key,val));if(fileField.files?.[0])form.append('file',fileField.files[0]);
      await api('/api/admin/resources',{method:'POST',body:form});editorMessage.textContent='Document téléversé sur le serveur IFSIO.';
    }else if(value.kind==='course'||value.kind==='event'){
      const base=value.kind==='course'?'/api/admin/courses':'/api/admin/events';const url=activeId?`${base}/${encodeURIComponent(activeId)}`:base;const method=activeId?'PUT':'POST';
      await api(url,jsonOptions(method,value));editorMessage.textContent=value.kind==='course'?'Cours enregistré pour le parcours choisi.':'Événement enregistré sur le serveur IFSIO.';
    }else{
      const url=activeId?`/api/admin/content/${encodeURIComponent(activeId)}`:'/api/admin/content';
      const form=new FormData();Object.entries(value).forEach(([key,val])=>form.append(key,val));
      if(coverField.files?.[0])form.append('cover',coverField.files[0]);
      await api(url,{method:activeId?'PUT':'POST',body:form});editorMessage.textContent=status==='published'?'Publication enregistrée sur le site IFSIO.':'Brouillon enregistré sur le serveur IFSIO.';
    }
    resetEditor();refreshAll();return true;
  }catch(error){editorMessage.textContent=error.message;return false;}
}
function previewContent(item,demo=false){
  document.querySelector('#cms-preview-title').textContent=item.title;
  const previewCover=document.querySelector('#cms-preview-cover');
  const previewFile=coverField.files?.[0];
  previewCover.hidden=!(previewFile||item.cover_url);
  if(previewFile)previewCover.src=URL.createObjectURL(previewFile);else if(item.cover_url)previewCover.src=item.cover_url;else if(item.cover_file&&item.id&&!demo)previewCover.src=`/api/admin/content/${encodeURIComponent(item.id)}/cover`;
  document.querySelector('#cms-preview-meta').textContent=[item.kind==='page'?'Page institutionnelle':item.kind==='event'?'Événement':'Actualité',item.category,item.starts_at&&dateLabel(item.starts_at),item.location].filter(Boolean).join(' · ');
  document.querySelector('#cms-preview-body').textContent=[item.summary,item.body||item.description].filter(Boolean).join('\n\n');
  document.querySelector('#cms-preview-dialog .cms-date-label').textContent=demo?'APERÇU DE DÉMO · NON PUBLIÉ':'APERÇU · NON PUBLIÉ';
  document.querySelector('[data-confirm-publish]').textContent=demo?'Enregistrer dans la démo':'Publier sur le site IFSIO';
  if(previewDialog.showModal)previewDialog.showModal();
}
function exportContents(){
  const run=async()=>{const data=demoMode?{content:demoItems()}:{...await api('/api/admin/content'),...await api('/api/admin/resources'),...await api('/api/admin/courses'),...await api('/api/admin/events')};const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=`ifsio-contenus-${new Date().toISOString().slice(0,10)}.json`;link.click();URL.revokeObjectURL(url);};run().catch(error=>{editorMessage.textContent=error.message;});
}
function showEditor(kind){typeField.value=kind;setTypeMode();document.querySelector('#cms-editor').scrollIntoView({behavior:'smooth',block:'center'});titleField.focus({preventScroll:true});}

previewButtons.forEach(button=>button.addEventListener('click',()=>toggleDashboard(dashboard.hidden,true)));
loginForm?.addEventListener('submit',async event=>{
  event.preventDefault();loginMessage.hidden=false;loginMessage.textContent='Connexion…';
  try{const {user}=await api('/api/auth/login',jsonOptions('POST',{email:document.querySelector('#admin-email').value,password:document.querySelector('#admin-password').value}));if(user.role!=='admin'){await api('/api/auth/logout',{method:'POST'}).catch(()=>{});throw new Error('Ce compte n’a pas les droits d’administration du site.');}currentAdmin=user;toggleDashboard(true,false);loginMessage.hidden=true;}
  catch(error){loginMessage.textContent=error.message;}
});
document.querySelector('[data-back-login]')?.addEventListener('click',()=>toggleDashboard(false));
document.querySelector('#cms-logout')?.addEventListener('click',async()=>{try{await api('/api/auth/logout',{method:'POST'});}catch{}currentAdmin=null;toggleDashboard(false);});
document.querySelectorAll('[data-scroll-editor]').forEach(button=>button.addEventListener('click',()=>{document.querySelector('#cms-editor').scrollIntoView({behavior:'smooth',block:'center'});titleField.focus({preventScroll:true});}));
document.querySelectorAll('[data-content-type]').forEach(button=>button.addEventListener('click',()=>showEditor(button.dataset.contentType)));
typeField.addEventListener('change',setTypeMode);
document.querySelector('[data-save-draft]')?.addEventListener('click',()=>saveContent('draft'));
document.querySelector('[data-preview-publish]')?.addEventListener('click',()=>{
  if(['resource','course'].includes(typeField.value)){saveContent('published');return;}
  let value;try{value=editorValue('published');}catch(error){editorMessage.textContent=error.message;return;}previewContent(value,demoMode);
});
document.querySelector('[data-confirm-publish]')?.addEventListener('click',async()=>{previewDialog.close();await saveContent('published');});
document.querySelector('[data-export-content]')?.addEventListener('click',exportContents);
contentList?.addEventListener('click',async event=>{
  const button=event.target.closest('[data-action]');if(!button)return;
  const id=button.dataset.id,kind=button.dataset.kind,isDemo=kind==='demo';
  try{
    let item=null;
    if(isDemo)item=demoItems().find(entry=>entry.id===id);
    else if(kind==='content')item=(await api('/api/admin/content')).content.find(entry=>entry.id===id);
    else if(kind==='course')item=(await api('/api/admin/courses')).courses.find(entry=>entry.id===id);
    else if(kind==='event')item=(await api('/api/admin/events')).events.find(entry=>entry.id===id);
    if(button.dataset.action==='delete'){
      if(isDemo)saveDemoItems(demoItems().filter(entry=>entry.id!==id));
      else if(kind==='resource')await api(`/api/admin/resources/${encodeURIComponent(id)}`,{method:'DELETE'});
      else await api(`/api/admin/${kind==='content'?'content':kind==='course'?'courses':'events'}/${encodeURIComponent(id)}`,{method:'DELETE'});
      if(activeId===id)resetEditor();refreshAll();return;
    }
    if(button.dataset.action==='publish'){
      if(isDemo)saveDemoItems(demoItems().map(entry=>entry.id===id?{...entry,status:'published',updatedAt:new Date().toISOString()}:entry));
      else if(kind==='resource')await api(`/api/admin/resources/${encodeURIComponent(id)}/status`,jsonOptions('PATCH',{status:'published'}));
      else{const route=kind==='event'?'events':'content';await api(`/api/admin/${route}/${encodeURIComponent(id)}`,jsonOptions('PUT',{...item,status:'published'}));}
      refreshAll();return;
    }
    if(button.dataset.action==='preview'){previewContent(item,isDemo);return;}
    if(button.dataset.action==='edit'&&item){
      activeId=item.id;activeKind=kind;typeField.value=kind==='demo'?(item.kind||'page'):kind==='content'?item.kind:kind;
      titleField.value=item.title;categoryField.value=item.category||'';audienceField.value=item.audience||'public';bodyField.value=item.body||item.description||'';summaryField.value=item.summary||'';coverField.value='';document.querySelector('#cms-cover-current').textContent=item.cover_file?'Une couverture est déjà enregistrée. Choisissez une nouvelle image pour la remplacer.':'';
      if(typeField.value==='course'){document.querySelector('#cms-course-code').value=item.code||'';document.querySelector('#cms-course-school').value=item.filiere||'';document.querySelector('#cms-course-level').value=item.niveau||'';document.querySelector('#cms-course-year').value=item.annee_academique||'';}
      if(typeField.value==='event'){document.querySelector('#cms-event-start').value=item.starts_at?new Date(item.starts_at).toISOString().slice(0,16):'';document.querySelector('#cms-event-end').value=item.ends_at?new Date(item.ends_at).toISOString().slice(0,16):'';document.querySelector('#cms-event-location').value=item.location||'';}
      activeId=item.id;setTypeMode();editorHeading.textContent='Modifier le contenu';statusChip.lastChild.textContent=` ${formatStatus(kind,item)}`;document.querySelector('#cms-editor').scrollIntoView({behavior:'smooth',block:'center'});titleField.focus({preventScroll:true});
    }
  }catch(error){editorMessage.textContent=error.message;}
});
studentList?.addEventListener('click',async event=>{
  const button=event.target.closest('[data-student-id]');if(!button)return;button.disabled=true;
  try{await api(`/api/admin/students/${encodeURIComponent(button.dataset.studentId)}/status`,jsonOptions('PATCH',{status:button.dataset.studentStatus}));await refreshReal();}
  catch(error){button.disabled=false;editorMessage.textContent=error.message;}
});
document.querySelector('#refresh-students')?.addEventListener('click',()=>demoMode?refreshDemo():refreshReal().catch(error=>{editorMessage.textContent=error.message;}));
document.querySelectorAll('.cms-sidebar>a').forEach(link=>link.addEventListener('click',()=>document.querySelectorAll('.cms-sidebar>a').forEach(item=>item.classList.toggle('is-current',item===link))));
document.querySelector('#cms-year').textContent=new Date().getFullYear();
setTypeMode();
if(demoMode)toggleDashboard(true,true);else api('/api/auth/me').then(({user})=>{if(user.role==='admin'){currentAdmin=user;toggleDashboard(true,false);}}).catch(()=>{});
