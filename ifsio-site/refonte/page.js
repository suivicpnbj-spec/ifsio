// =============================================================================
// IFSIO — Base de données éditoriale et moteur de rendu des pages publiques
// =============================================================================

const pages = {
  institut: [
    "L’Institut",
    "Présentation institutionnelle",
    "Former avec exigence.\nSoigner avec humanité.",
    "Créé par arrêté ministériel en 2015, l’IFSIO de l’Université de Parakou forme l’élite des professionnels en sciences infirmières et obstétricales.",
    `<h2>Une Entité Universitaire d’Excellence en Santé</h2>
    <p>Créé en 2015 par l'arrêté ministériel <strong>N°492/MERS/CAB/DC/SGM/DRFM/DGES/R-UP/SA</strong>, l’Institut de Formation en Soins Infirmiers et Obstétricaux (IFSIO) est une entité de formation et de recherche de plein exercice de l’<strong>Université de Parakou</strong> au Bénin.</p>
    
    <div class="article-callout">
      <strong>Nos 3 missions fondamentales :</strong>
      <ol style="margin: 0.5rem 0 0 1.2rem; padding: 0;">
        <li><strong>Formation universitaire d'élite :</strong> Préparer des praticiens de santé hautement qualifiés selon les normes du système LMD et du CAMES.</li>
        <li><strong>Recherche scientifique appliquée :</strong> Développer la production de connaissances en soins infirmiers, périnatalité et santé communautaire.</li>
        <li><strong>Services à la société :</strong> Participer activement à la promotion de la santé publique et à la prise en charge des populations.</li>
      </ol>
    </div>

    <h2>Deux Écoles Fondatrices</h2>
    <p>L'IFSIO réunit deux prestigieuses écoles supérieures reconnues à l’échelle nationale et régionale :</p>
    <div class="article-program-grid">
      <div>
        <span>01</span>
        <h3>ESIIE</h3>
        <p><strong>École Supérieure des Infirmiers et Infirmières d’État :</strong> formation aux soins infirmiers généraux, spécialisés et d'urgence.</p>
        <p><a href="page.html?view=esii">Découvrir l'ESIIE →</a></p>
      </div>
      <div>
        <span>02</span>
        <h3>ESSFE</h3>
        <p><strong>École Supérieure des Sages-Femmes d’État :</strong> formation d'excellence en maïeutique, santé maternelle, néonatale et reproductive.</p>
        <p><a href="page.html?view=essfe">Découvrir l'ESSFE →</a></p>
      </div>
    </div>

    <h2>Un Bilan Remarquable : 8 Promotions & 1 187 Diplômés</h2>
    <p>Depuis son ouverture, l’IFSIO a conduit avec succès <strong>8 promotions de Licence professionnelle</strong> vers l’obtention de leur diplôme d’État, injectant sur le terrain hospitalier et communautaire :</p>
    <ul style="margin: 0.5rem 0 1rem 1.2rem;">
      <li><strong>567 Sages-Femmes d’État diplômées</strong> (ESSFE)</li>
      <li><strong>620 Infirmiers et Infirmières d’État diplômés</strong> (ESIIE)</li>
    </ul>
    <p>Soit un total officiel de <strong>1 187 soignants d’État</strong> formés avec rigueur, affichant un taux d'insertion professionnelle exceptionnel dans les hôpitaux, cliniques et ONG du Bénin et de la sous-région.</p>

    <h2>Plan Stratégique de Développement (PSD 2024–2028)</h2>
    <p>L’Institut est actuellement engagé dans son deuxième Plan Stratégique de Développement (2024–2028) dont la vision est :</p>
    <blockquote style="border-left: 4px solid var(--gold, #d4af37); padding: 0.8rem 1.2rem; margin: 1rem 0; font-style: italic; background: rgba(14,49,80,0.03);">
      « D’ici à fin 2028, l’IFSIO est un institut de formation et de recherche en sciences infirmières et obstétricales, d’expertise à la communauté, rayonnant sur le plan national, régional et international à travers sa capacité à former des agents de santé compétents et compétitifs dans un cadre adéquat et attrayant, grâce à un personnel permanent en quantité et en qualité, bien formé selon les normes nationales, celles du CAMES, de l’OOAS et de l’OMS. »
    </blockquote>`
  ],

  dirigeants: [
    "L’Institut",
    "Gouvernance",
    "Mot de la Direction",
    "La vision de l’IFSIO pour la formation des professionnels de santé au Bénin.",
    `<div class="article-callout">
      <strong>Une ambition d'excellence pour la santé de nos populations</strong>
      <p>Bienvenue sur le portail institutionnel de l’Institut de Formation en Soins Infirmiers et Obstétricaux (IFSIO) de l’Université de Parakou.</p>
    </div>
    <h2>Former des soignants compétents, éthiques et humains</h2>
    <p>Depuis sa création en 2015, notre Institut s’est donné pour mission cardinale d’offrir une formation universitaire et clinique rigoureuse, enracinée dans les réalités de nos communautés et alignée sur les standards internationaux les plus exigeants (CAMES, OMS, OOAS).</p>
    <p>Prendre soin d’un être humain dans sa vulnérabilité exige bien plus qu'une simple maîtrise technique : cela requiert une écoute profonde, un sens aigu de la déontologie et un engagement personnel sans faille. C'est ce triptyque — <em>Savoir scientifique, Savoir-faire clinique et Savoir-être humain</em> — que nous inculquons à chacune de nos promotions au sein de l'ESIIE et de l'ESSFE.</p>
    <h2>L'ère du Campus Numérique Unifié</h2>
    <p>Aujourd'hui, l'IFSIO franchit une nouvelle étape décisive dans sa modernisation avec le déploiement de son écosystème numérique intégré :</p>
    <ul>
      <li>La transparence et la rapidité de consultation des notes et crédits ECTS via <strong>eRésultats</strong> ;</li>
      <li>La sécurisation totale et la délivrance dématérialisée de nos attestations avec QR code infalsifiable via <strong>Mes Actes</strong> ;</li>
      <li>Le rayonnement de la recherche paramédicale à travers la bibliothèque numérique <strong>CNTRSS</strong>.</li>
    </ul>
    <p>À toutes nos étudiantes, à tous nos étudiants, à nos enseignants-chercheurs et à nos partenaires hospitaliers, nous réitérons notre engagement indéfectible à bâtir ensemble la santé de demain.</p>`
  ],

  equipe: [
    "L’Institut",
    "Organisation",
    "Notre Équipe Académique et Clinique",
    "Une communauté d'enseignants-chercheurs, de praticiens hospitaliers et d'encadreurs cliniques de terrain.",
    `<p class="lead">La force pédagogique de l'IFSIO repose sur l'étroite synergie entre universitaires de haut rang et professionnels de santé en exercice dans les structures hospitalières de référence, notamment le Centre Hospitalier Universitaire Départemental (CHUD) Borgou/Alibori.</p>
    
    <h2>Équipe de Direction et de Coordination</h2>
    <div class="article-program-grid">
      <div>
        <span>DIRECTION</span>
        <h3>Direction de l'Institut</h3>
        <p>Pilotage stratégique, gouvernance institutionnelle, accréditations académiques et relations avec le Rectorat de l'Université de Parakou.</p>
      </div>
      <div>
        <span>COORDINATION</span>
        <h3>Coordination des Écoles</h3>
        <p>Gestion pédagogique et suivi des cycles Licence au sein de l'<strong>ESIIE</strong> (Soins infirmiers) et de l'<strong>ESSFE</strong> (Soins obstétricaux).</p>
      </div>
    </div>

    <h2>Coordination des Masters Professionnels</h2>
    <p>Chaque spécialité de Master est dirigée par un Professeur Titulaire ou Maître de Conférences agrégé :</p>
    <ul style="margin: 0.5rem 0 1.2rem 1.2rem;">
      <li><strong>Master en Santé Sexuelle et Reproductive (SSR) :</strong> Coordonné par le <em>Docteur Kabibou SALIFOU</em>, Professeur Titulaire en Gynécologie – Obstétrique.</li>
      <li><strong>Master en Instrumentation et Aide Chirurgicales (IAC) :</strong> Coordonné par le <em>Docteur Montcho Adrien HODONOU</em>, Professeur Titulaire de Chirurgie Générale.</li>
      <li><strong>Master en Soins Infirmiers de Médecine d'Urgence (SMUr) :</strong> Coordonné par le <em>Docteur Blaise TCHAOU</em>, Professeur Titulaire d’Anesthésie-Réanimation.</li>
    </ul>

    <h2>Encadrement Clinique et Maîtres de Stage</h2>
    <p>En complément des cours magistraux et travaux dirigés dispensés sur le campus, nos étudiants bénéficient de l'accompagnement personnalisé de maîtres de stage hospitaliers, d'infirmiers majors et de sages-femmes coordinatrices pour l'acquisition des gestes cliniques en conditions réelles.</p>`
  ],

  honoraire: [
    "L’Institut",
    "Mémoire & Héritage",
    "Équipe Honoraire (2015–2025)",
    "Hommage aux dirigeants pionniers et bâtisseurs de l’IFSIO.",
    `<p class="lead">Grâce à leur leadership visionnaire, à leur dévouement exemplaire et à leur sens élevé du service public, l’Institut de Formation en Soins Infirmiers et Obstétricaux de l'Université de Parakou s'est imposé comme un pôle de référence universitaire au Bénin.</p>
    
    <div class="article-callout" style="border-left-color: var(--gold, #d4af37);">
      <strong>Reconnaissance de la Communauté Universitaire</strong>
      <p>La communauté universitaire, les enseignants, les étudiants, ainsi que les professionnels de santé diplômés expriment leur profonde gratitude à ces pionniers qui ont façonné l'histoire de l'IFSIO durant sa première décennie (2015–2025).</p>
    </div>

    <div class="article-program-grid">
      <div>
        <span>DIRECTEUR HONORAIRE</span>
        <h3>Prof. Francis TOGNON TCHEGNONSI</h3>
        <p><strong>Psychiatre d’Adulte</strong></p>
        <p>Directeur honoraire de l'IFSIO. Premier directeur de l'Institut, artisan de la mise en place institutionnelle, de l'élaboration des curricula et de l'ancrage universitaire de l'établissement.</p>
      </div>
      <div>
        <span>DIRECTEUR ADJOINT HONORAIRE</span>
        <h3>Prof. Kabibou SALIFOU</h3>
        <p><strong>Gynécologue-Obstétricien</strong></p>
        <p>Directeur Adjoint honoraire chargé de l'École Supérieure des Sages-Femmes d’État (ESSFE). Promoteur du développement de la maïeutique et de la recherche en santé reproductive.</p>
      </div>
      <div>
        <span>DIRECTEUR ADJOINT HONORAIRE</span>
        <h3>Prof. Montcho Adrien HODONOU</h3>
        <p><strong>Chirurgien Général</strong></p>
        <p>Directeur Adjoint honoraire chargé de l'École Supérieure des Infirmiers et Infirmières d’État (ESIIE). Concepteur des référentiels de compétences en soins infirmiers et en chirurgie.</p>
      </div>
    </div>`
  ],

  partenaires: [
    "L’Institut",
    "Coopération",
    "Partenaires Institutionnels et Hospitaliers",
    "Un réseau solide au service de l'excellence académique et de la santé publique.",
    `<p class="lead">L'IFSIO développe des collaborations étroites avec les ministères de tutelle, les établissements hospitaliers et les organisations internationales de santé pour garantir une formation au plus près des besoins du terrain.</p>
    
    <h2>Tutelles et Autorités de Régulation</h2>
    <div class="article-program-grid">
      <div>
        <span>TUTELLE ACADÉMIQUE</span>
        <h3>MESRS & Univ. Parakou</h3>
        <p>Ministère de l’Enseignement Supérieur et de la Recherche Scientifique de la République du Bénin et Rectorat de l’Université de Parakou.</p>
      </div>
      <div>
        <span>TUTELLE MÉDICALE</span>
        <h3>Ministère de la Santé</h3>
        <p>Ministère de la Santé du Bénin, direction des soins infirmiers et obstétricaux, programmes nationaux de santé de la mère et de l'enfant.</p>
      </div>
    </div>

    <h2>Réseau Hospitalier de Stages Cliniques</h2>
    <p>Nos étudiants en Licence et Master effectuent leurs stages pratiques obligatoires au sein d'établissements partenaires de premier rang :</p>
    <ul style="margin: 0.5rem 0 1.2rem 1.2rem;">
      <li><strong>CHUD Borgou/Alibori :</strong> Centre Hospitalier Universitaire Départemental (services de médecine interne, chirurgie générale, pédiatrie, réanimation, gynécologie-obstétrique).</li>
      <li><strong>Hôpitaux de Zone & Centres de Santé :</strong> Structures hospitalières de Parakou et des communes environnantes pour l'apprentissage des soins de santé primaires.</li>
      <li><strong>Cliniques et Maternités Partenaires :</strong> Pratique obstétricale et assistance opératoire encadrée.</li>
    </ul>

    <h2>Reconnaissance & Organismes Internationaux</h2>
    <div class="article-program-grid">
      <div>
        <span>RÉGIONAL</span>
        <h3>CAMES & OOAS</h3>
        <p>Alignement des diplômes sur les standards du Conseil Africain et Malgache pour l'Enseignement Supérieur (CAMES) et de l'Organisation Ouest-Africaine de la Santé (OOAS).</p>
      </div>
      <div>
        <span>INTERNATIONAL</span>
        <h3>Organisation Mondiale de la Santé</h3>
        <p>Adoption des référentiels OMS pour la formation des professionnels de soins infirmiers et de pratique maïeutique.</p>
      </div>
    </div>`
  ],

  esii: [
    "Nos Écoles",
    "École Supérieure · Cycle Licence (180 Crédits)",
    "École Supérieure des Infirmiers et des Infirmières d’État (ESIIE)",
    "Former les leaders des soins infirmiers, de l’évaluation clinique et de la prise en charge globale des patients.",
    `<img class="article-image" src="assets/formation-clinique.jpg" alt="Étudiants en formation clinique de soins infirmiers">
    
    <h2>Une Vocation : L'Art et la Science du Soin</h2>
    <p>L’ESIIE est l'école fondatrice de l'IFSIO dédiée aux sciences infirmières. Elle prépare les étudiants à évaluer l'état de santé, poser un diagnostic infirmier, concevoir et administrer des plans de soins personnalisés, et intervenir en équipe pluridisciplinaire auprès de patients de tous âges.</p>

    <div class="article-callout">
      <strong>Diplôme délivré :</strong> Licence Professionnelle en Sciences Infirmières et Obstétricales, mention <em>Soins Infirmiers</em> (180 crédits ECTS, 3 ans / 6 semestres).
    </div>

    <h2>Organisation du Cursus (L1, L2, L3)</h2>
    <div class="article-program-grid">
      <div>
        <span>SEMESTRES 1 & 2</span>
        <h3>Licence 1 (60 crédits)</h3>
        <p>Sciences fondamentales : anatomie, physiologie, pharmacologie générale, microbiologie, initiation à la démarche de soins et premiers stages cliniques.</p>
      </div>
      <div>
        <span>SEMESTRES 3 & 4</span>
        <h3>Licence 2 (60 crédits)</h3>
        <p>Pathologies médicales et chirurgicales, pharmacothérapie appliquée, pédiatrie, santé mentale, urgences de base et stages hospitaliers intensifs.</p>
      </div>
      <div>
        <span>SEMESTRES 5 & 6</span>
        <h3>Licence 3 (60 crédits)</h3>
        <p>Soins intensifs, santé communautaire, gestion et administration des services de soins, stage d'intégration professionnelle et mémoire de fin de cycle.</p>
      </div>
    </div>

    <h2>Débouchés Professionnels</h2>
    <p>Les diplômés de l'ESIIE exercent dans :</p>
    <ul>
      <li>Centres hospitaliers universitaires et départementaux (CHUD, CHU)</li>
      <li>Hôpitaux de zone, dispensaires et centres médico-sociaux</li>
      <li>Organisations non gouvernementales (ONG) médicales et humanitaires</li>
      <li>Services de santé au travail et établissements scolaires</li>
      <li>Poursuite d'études en Master de spécialisation (SMUr, IAC, SSR)</li>
    </ul>`
  ],

  essfe: [
    "Nos Écoles",
    "École Supérieure · Cycle Licence (180 Crédits)",
    "École Supérieure des Sages-Femmes d’État (ESSFE)",
    "Accompagner la vie avec rigueur : santé maternelle, néonatale, sexuelle et reproductive.",
    `<img class="article-image" src="assets/formation-obstetrique.jpg" alt="Apprentissage des gestes obstétricaux sur simulateur">
    
    <h2>Un Engagement Vital au Cœur de la Maternité</h2>
    <p>L’ESSFE forme les sages-femmes d’État qui assurent le suivi de la grossesse, la pratique des accouchements eutociques, les soins aux nouveau-nés et l'éducation à la santé reproductive des femmes et des familles.</p>

    <div class="article-callout">
      <strong>Diplôme délivré :</strong> Licence Professionnelle en Sciences Infirmières et Obstétricales, mention <em>Soins Obstétricaux</em> (180 crédits ECTS, 3 ans / 6 semestres).
    </div>

    <h2>Compétences Développées</h2>
    <div class="article-program-grid">
      <div>
        <span>PRÉNATAL</span>
        <h3>Suivi de la Grossesse</h3>
        <p>Consultations prénatales, dépistage précoce des grossesses à risque, bilan échographique et biologique, préparation à la naissance.</p>
      </div>
      <div>
        <span>PER-NATAL</span>
        <h3>Accouchement & Néonatalogie</h3>
        <p>Surveillance du travail, délivrance physiologique, réanimation néonatale immédiate et premiers soins au nouveau-né.</p>
      </div>
      <div>
        <span>POST-NATAL</span>
        <h3>Santé Reproductive</h3>
        <p>Consultations postnatales, allaitement maternel, planification familiale, dépistage des cancers gynécologiques.</p>
      </div>
    </div>

    <h2>Stages en Salles de Naissance et Maternités</h2>
    <p>Plus de 50% de la formation est consacrée à la pratique clinique dans les maternités de référence du Borgou et de l'Alibori sous la supervision directe de sages-femmes expérimentées et d'obstétriciens.</p>`
  ],

  licence: [
    "Études et diplômes",
    "Premier Cycle Universitaire · 180 Crédits LMD",
    "Licence Professionnelle en Sciences Infirmières et Obstétricales",
    "Un socle universitaire d'excellence en 3 ans, ouvrant sur deux spécialisations d'État reconnues par le CAMES.",
    `<h2>Structure du Diplôme de Licence LMD</h2>
    <p>La Licence Professionnelle de l'IFSIO est structurée en <strong>6 semestres académiques</strong> totalisant <strong>180 crédits ECTS</strong> capitalisables et transférables. Elle combine cours théoriques, travaux dirigés, ateliers sur simulateurs et stages cliniques hospitaliers.</p>
    
    <div class="article-program-grid">
      <div>
        <span>MENTION 01</span>
        <h3>Soins Infirmiers (ESIIE)</h3>
        <p>Filière formant au métier d'Infirmier et d'Infirmière d'État pour la prise en charge clinique globale des patients.</p>
        <p><a href="page.html?view=esii">Consulter la fiche détaillée ESIIE →</a></p>
      </div>
      <div>
        <span>MENTION 02</span>
        <h3>Soins Obstétricaux (ESSFE)</h3>
        <p>Filière formant au métier de Sage-Femme d'État pour la santé de la mère, du fœtus et du nouveau-né.</p>
        <p><a href="page.html?view=essfe">Consulter la fiche détaillée ESSFE →</a></p>
      </div>
    </div>

    <h2>Admissibilité & Délibération</h2>
    <p>Chaque semestre fait l'objet d'une délibération officielle de jury. Pour valider l'année, l'étudiant doit obtenir la moyenne requise et valider l'ensemble des Unités d'Enseignement (UE). Les résultats officiels et délibérations sont consultables directement en ligne sur la plateforme <a href="https://resultats.ifsio.bj" target="_blank" rel="noopener"><strong>eRésultats IFSIO</strong></a>.</p>`
  ],

  masters: [
    "Études et diplômes",
    "Deuxième Cycle Universitaire · 120 Crédits",
    "Masters Professionnels de Spécialisation",
    "Des formations de pointe pour approfondir son expertise clinique et occuper des postes de responsabilité.",
    `<h2>Trois Filières d'Excellence Accréditées</h2>
    <p>L’IFSIO propose trois parcours de Master professionnel de haut niveau, coordonnés par des Professeurs d'université et chirurgiens spécialistes :</p>
    
    <div class="article-program-grid">
      <div>
        <span>MASTER 01</span>
        <h3>Santé Sexuelle et Reproductive (SSR)</h3>
        <p>Coordonné par le <strong>Prof. Kabibou SALIFOU</strong>. Expertise avancée en périnatalité, prise en charge des urgences obstétricales et politiques de santé reproductive.</p>
        <p><a href="page.html?view=master-ssr">Détails du Master SSR →</a></p>
      </div>
      <div>
        <span>MASTER 02</span>
        <h3>Instrumentation et Aide Chirurgicales (IAC)</h3>
        <p>Coordonné par le <strong>Prof. Montcho Adrien HODONOU</strong>. Maîtrise des blocs opératoires, asepsie, instrumentation et aide aux actes chirurgicaux complexes.</p>
        <p><a href="page.html?view=master-iac">Détails du Master IAC →</a></p>
      </div>
      <div>
        <span>MASTER 03</span>
        <h3>Soins Infirmiers de Médecine d'Urgence (SMUr)</h3>
        <p>Coordonné par le <strong>Prof. Blaise TCHAOU</strong>. Réanimation d'urgence, régulation préhospitalière, médecine de catastrophe et soins critiques.</p>
        <p><a href="page.html?view=master-smur">Détails du Master SMUr →</a></p>
      </div>
    </div>

    <div class="article-callout">
      <strong>Organisation des études :</strong> 120 crédits ECTS répartis sur 4 semestres, associant enseignements spécialisés, stages cliniques intensifs et soutenance publique d'un mémoire de recherche.
    </div>`
  ],

  'master-ssr': [
    "Masters Professionnels",
    "Cycle Master · 120 Crédits",
    "Master en Santé Sexuelle et Reproductive (SSR)",
    "Formation de deuxième cycle universitaire d'expertise en maïeutique avancée et santé de la reproduction.",
    `<p class="lead">Créé par décision rectorale <strong>N°162-2022/R-UP/VR-AA/VR-RU/SG/AC/SA</strong> portant création et organisation du Master en Santé Sexuelle et Reproductive (MSSR), ce programme compte déjà trois promotions diplômées au service de la santé des femmes et des enfants.</p>
    
    <div class="article-callout">
      <strong>Coordonnateur du Master :</strong> Docteur Kabibou SALIFOU, Professeur Titulaire en Gynécologie – Obstétrique à l'Université de Parakou.
    </div>

    <h2>Objectifs et Compétences Cibles</h2>
    <p>La formation vise à rendre l'apprenant capable de mobiliser savoir, savoir-faire et savoir-être pour :</p>
    <ul>
      <li>Gérer les urgences obstétricales et néonatales majeures (SONUB / SONUC) ;</li>
      <li>Concevoir, piloter et évaluer des programmes de santé sexuelle, reproductive et néonatale ;</li>
      <li>Assurer le conseil éthique et la prise en charge globale des pathologies de la reproduction ;</li>
      <li>Mener des recherches cliniques et épidémiologiques appliquées en maïeutique.</li>
    </ul>

    <h2>Débouchés</h2>
    <p>Cadres de santé en maternité, coordonnateurs de programmes de santé maternelle pour les ministères et agences internationales (OMS, UNFPA, UNICEF), enseignants et chercheurs en sciences obstétricales.</p>`
  ],

  'master-iac': [
    "Masters Professionnels",
    "Cycle Master · 120 Crédits",
    "Master en Instrumentation et Aide Chirurgicales (IAC)",
    "Formation d'élite pour la pratique chirurgicale spécialisée et la gestion des blocs opératoires.",
    `<p class="lead">Créé par décision rectorale <strong>N°162-2022/R-UP/VR-AA/VR-RU/SG/AC/SA</strong>, ce master d'excellence a diplômé trois promotions prêtes à intervenir dans les blocs opératoires les plus exigeants.</p>
    
    <div class="article-callout">
      <strong>Coordonnateur du Master :</strong> Docteur Montcho Adrien HODONOU, Professeur Titulaire de Chirurgie Générale à l'Université de Parakou.
    </div>

    <h2>Objectifs et Compétences de Bloc Opératoire</h2>
    <p>Le Master IAC forme des instrumentistes chirurgicaux de haut niveau capables de :</p>
    <ul>
      <li>Maîtriser l'environnement technique, l'asepsie stricte et la sécurité en bloc opératoire ;</li>
      <li>Assister le chirurgien opérateur lors d'interventions de chirurgie générale, viscérale, gynécologique, pédiatrique et traumatologique ;</li>
      <li>Gérer la traçabilité des dispositifs médicaux et de la stérilisation haute performance ;</li>
      <li>Garantir la sécurité périopératoire du patient (check-list OMS, prévention des infections de site opératoire).</li>
    </ul>

    <h2>Débouchés</h2>
    <p>Infirmiers de bloc opératoire (IBODE), surveillants généraux de blocs chirurgicaux hospitaliers, cadres de services d'endoscopie et d'explorations interventionnelles.</p>`
  ],

  'master-smur': [
    "Masters Professionnels",
    "Cycle Master · 120 Crédits",
    "Master en Soins Infirmiers de Médecine d'Urgence (SMUr)",
    "Former les urgentistes paramédicaux de pointe pour les services de réanimation et les interventions préhospitalières.",
    `<p class="lead">Créé en collaboration avec le Ministère de la Santé du Bénin en 2023, ce master spécialisé répond aux défis contemporains des urgences médicales et des catastrophes sanitaires.</p>
    
    <div class="article-callout">
      <strong>Coordonnateur du Master :</strong> Docteur Blaise TCHAOU, Professeur Titulaire d’Anesthésie-Réanimation à l'Université de Parakou.
    </div>

    <h2>Objectifs Opérationnels</h2>
    <p>Le diplômé du Master SMUr acquiert des compétences d'élite pour :</p>
    <ul>
      <li>Appliquer les règles de tri médical et de classification rapide des patients (scores d'urgence préhospitaliers) ;</li>
      <li>Gérer la réanimation cardiorespiratoire avancée chez l'adulte et l'enfant ;</li>
      <li>Participer à la prise en charge des urgences vitales en SMUR, SAMU et services d'accueil des urgences (SAU) ;</li>
      <li>Intervenir efficacement en situations de crise, de catastrophes collectives et d'urgences sanitaires majeures.</li>
    </ul>

    <h2>Débouchés</h2>
    <p>Infirmiers anesthésistes-réanimateurs, infirmiers urgentistes de SAMU/SMUR, responsables des cellules de crise et d'urgence hospitalière, formateurs en gestes d'urgence médicale.</p>`
  ],

  recherche: [
    "Recherche & Innovation",
    "Pôle Scientifique",
    "La Recherche et l’Innovation Clinique à l’IFSIO",
    "Faire progresser la pratique des soins par la recherche scientifique et la publication de travaux originaux.",
    `<p class="lead">L'IFSIO développe une recherche appliquée dynamique visant à améliorer concrètement la qualité et la sécurité des soins de santé au Bénin et en Afrique de l'Ouest.</p>
    
    <h2>Axes Stratégiques de Recherche</h2>
    <div class="article-program-grid">
      <div>
        <span>AXE 01</span>
        <h3>Pratique et Sécurité des Soins</h3>
        <p>Infections associées aux soins, hygiène hospitalière, sécurité médicamenteuse et amélioration continue des pratiques infirmières.</p>
      </div>
      <div>
        <span>AXE 02</span>
        <h3>Santé Maternelle et Périnatalité</h3>
        <p>Réduction de la mortalité maternelle et néonatale, prise en charge des hémorragies de la délivrance, consultations prénatales ciblées.</p>
      </div>
      <div>
        <span>AXE 03</span>
        <h3>Urgences et Réanimation</h3>
        <p>Protocoles de tri préhospitalier, gestion de la douleur aiguë et amélioration des délais de prise en charge des détresses vitales.</p>
      </div>
    </div>

    <h2>Événements Scientifiques Majeurs</h2>
    <ul>
      <li><strong>Les JSIO (Journées Scientifiques en Sciences Infirmières et Obstétricales) :</strong> Colloque annuel rassemblant chercheurs, professionnels et décideurs de la santé.</li>
      <li><strong>Les Masteriales de l'IFSIO :</strong> Session académique de valorisation des mémoires de recherche des étudiants de master.</li>
    </ul>

    <h2>Accès aux Mémoires & Thèses : CNTRSS</h2>
    <p>L’ensemble des mémoires de Licence et de Master soutenus avec succès à l’IFSIO est consultable en texte intégral sur la bibliothèque numérique officielle du campus : <a href="https://cntrss.ifsio.bj" target="_blank" rel="noopener"><strong>Catalogue CNTRSS (Portail Recherche & IA)</strong></a>.</p>`
  ],

  'clinique-application': [
    "Recherche & Soins",
    "Plateforme Pratique",
    "La Clinique d'Application de l'IFSIO",
    "Un environnement immersif pour l'apprentissage par simulation et la prestation de soins de proximité.",
    `<p class="lead">La Clinique d'application pédagogique de l'IFSIO constitue un pont concret entre les cours théoriques universitaires et la réalité clinique auprès des patients.</p>
    
    <h2>Simulation Médicale Haute Fidélité</h2>
    <p>Équipée de mannequins simulateurs interactifs, de moniteurs de constantes vitales et de matériel de réanimation moderne, la clinique permet aux étudiants de répéter les gestes techniques (perfusion, sondage, intubation, accouchement normal et dystocique) en toute sécurité avant leur immersion auprès des malades.</p>

    <h2>Soins de Santé Primaires à la Communauté</h2>
    <p>La clinique participe également aux activités d'action communautaire de l'Institut : consultations gratuites, campagnes de dépistage, sensibilisation vaccinale et éducation à la santé dans la commune de Parakou.</p>`
  ],

  liens: [
    "Ressources",
    "Orientation",
    "Liens Utiles et Services Satellites du Campus",
    "Les plateformes numériques interconnectées et les liens institutionnels officiels.",
    `<h2>Plateformes du Campus Numérique IFSIO</h2>
    <div class="article-program-grid">
      <div>
        <span>RÉSULTATS & NOTES</span>
        <h3>eRésultats IFSIO</h3>
        <p>Consultation sécurisée des moyennes semestrielles, délibérations officielles de jurys et validation des crédits ECTS.</p>
        <p><a href="https://resultats.ifsio.bj" target="_blank" rel="noopener">Accéder à resultats.ifsio.bj ↗</a></p>
      </div>
      <div>
        <span>ACTES & DIPLÔMES</span>
        <h3>Mes Actes Académiques</h3>
        <p>Guichet de demande et de délivrance d'attestations et relevés certifiés avec QR code officiel et scellé inviolable.</p>
        <p><a href="https://actes.ifsio.bj" target="_blank" rel="noopener">Accéder à actes.ifsio.bj ↗</a></p>
      </div>
      <div>
        <span>CONTRÔLE TIERS</span>
        <h3>Portail Anti-Fraude</h3>
        <p>Vérification publique de l'authenticité d'une attestation ou d'un relevé pour employeurs, ambassades et universités.</p>
        <p><a href="https://actes.ifsio.bj/#/verifier" target="_blank" rel="noopener">Vérifier un acte en direct ↗</a></p>
      </div>
      <div>
        <span>BIBLIOTHÈQUE NUMÉRIQUE</span>
        <h3>Catalogue CNTRSS</h3>
        <p>Répertoire des thèses et mémoires de fin d'études en santé avec moteur de recherche sémantique et assistant IA.</p>
        <p><a href="https://cntrss.ifsio.bj" target="_blank" rel="noopener">Explorer cntrss.ifsio.bj ↗</a></p>
      </div>
    </div>

    <h2>Portails Institutionnels Officiels</h2>
    <ul>
      <li><a href="https://univ-parakou.bj" target="_blank" rel="noopener">Université de Parakou (Site officiel) ↗</a></li>
      <li><a href="https://enseignementsupérieur.gouv.bj" target="_blank" rel="noopener">Ministère de l’Enseignement Supérieur et de la Recherche Scientifique (MESRS Bénin) ↗</a></li>
      <li><a href="https://sante.gouv.bj" target="_blank" rel="noopener">Ministère de la Santé de la République du Bénin ↗</a></li>
      <li><a href="https://lecames.org" target="_blank" rel="noopener">CAMES (Conseil Africain et Malgache pour l'Enseignement Supérieur) ↗</a></li>
    </ul>`
  ],

  admissions: [
    "Admissions",
    "Candidatures & Inscriptions",
    "Rejoindre l'IFSIO : Modalités d'Admission",
    "Toutes les étapes pour postuler en Licence et en Master à l'Université de Parakou.",
    `<h2>Conditions Générales d'Admissibilité</h2>
    <div class="article-callout">
      <strong>Cycle Licence (ESIIE / ESSFE) :</strong>
      <p>L'accès en première année est ouvert aux titulaires d'un Baccalauréat scientifique (séries C, D ou équivalent reconnu) selon les quotas ministériels et le test probatoire de sélection organisé par l'Université de Parakou.</p>
    </div>

    <div class="article-callout">
      <strong>Cycle Master Professionnel (SSR / IAC / SMUr) :</strong>
      <p>Ouvert aux titulaires d'une Licence en soins infirmiers, en soins obstétricaux ou d'un diplôme équivalent, avec justification d'une expérience professionnelle clinique et sélection sur dossier / entretien.</p>
    </div>

    <h2>Les 4 Étapes d'Inscription</h2>
    <ol class="article-steps">
      <li><b>Consulter l'Appel Officiel</b><span>Vérifiez l'ouverture des dépôts sur le site de l'Université et de l'IFSIO.</span></li>
      <li><b>Constituer le Dossier de Candidature</b><span>Rassemblez les diplômes certifiés, relevés de notes légalisés, acte de naissance et certificat médical d'aptitude.</span></li>
      <li><b>Dépôt et Test de Sélection</b><span>Soumettez le dossier selon les modalités communiquées par la Scolarité centrale de l'UP.</span></li>
      <li><b>Inscription Définitive & Badge</b><span>Après admission, procédez au paiement des droits et à l'ouverture de votre compte sur le portail apprenants.</span></li>
    </ol>`
  ],

  actualites: ["Actualités", "La vie de l’Institut", "Les nouvelles de l’IFSIO", "Retrouvez les informations, événements scientifiques et temps forts de la communauté de l’Institut.", `<div class="article-news-list"><a href="page.html?view=appel-master"><span>Appel à candidatures · Masters 2026–2027</span><b>En savoir plus →</b></a><a href="page.html?view=jsio"><span>Journées scientifiques en sciences infirmières et obstétricales</span><b>Découvrir →</b></a><a href="page.html?view=soutenances"><span>Soutenances et travaux de recherche</span><b>Découvrir →</b></a></div><p class="article-muted">Vérifiez les dates et modalités dans les annonces officielles de l’Université.</p>`],
  'appel-master': ["Actualités", "Appel à candidatures", "Masters professionnels · 2026–2027", "Les appels à candidatures sont publiés selon le calendrier de l’Université de Parakou.", `<h2>Préparer sa candidature</h2><p>Les masters de l’IFSIO couvrent la santé sexuelle et reproductive, l’instrumentation et l’aide chirurgicales, ainsi que les soins infirmiers de médecine d’urgence.</p><p>Vérifiez l’appel officiel pour connaître les spécialités ouvertes, le profil des candidats, les pièces à fournir, le calendrier et les modalités de sélection.</p><div class="article-callout"><strong>Vérifiez l’information officielle</strong><p>Les dates et modalités peuvent changer. Contactez <a href="mailto:contact.ifsio-up@gouv.bj">contact.ifsio-up@gouv.bj</a> pour être orienté.</p></div>`],
  jsio: ["Recherche", "Vie scientifique", "Journées scientifiques en sciences infirmières et obstétricales", "Un espace de partage, de réflexion et de valorisation des travaux consacrés aux sciences infirmières et obstétricales.", `<img class="article-image" src="assets/recherche.jpg" alt="Recherche et sciences de la santé"><h2>Faire circuler les savoirs</h2><p>Les journées scientifiques réunissent les acteurs de la formation et de la santé autour des travaux, expériences et enjeux qui font évoluer les pratiques professionnelles.</p><p>Consultez les annonces de l’Institut pour connaître les dates, les thèmes et les modalités de participation.</p>`],
  soutenances: ["Formation", "Vie académique", "Soutenances et travaux de recherche", "Les mémoires de master témoignent de l’engagement des étudiants dans la réflexion et l’amélioration des pratiques de santé.", `<img class="article-image" src="assets/etudiants.jpg" alt="Étudiants de l’IFSIO"><h2>Valoriser les travaux des étudiants</h2><p>La soutenance marque une étape importante du parcours de master : présenter sa démarche, partager ses résultats et contribuer à la discussion autour des pratiques professionnelles.</p><p>Les informations relatives aux sessions sont diffusées par l’Institut et les coordinations de formation.</p>`],
  alumni: ["Communauté IFSIO", "Réseau des diplômés", "Les Alumni de l’IFSIO", "Une communauté de 1 187 diplômés qui prolonge les liens entre l’Institut, les hôpitaux et les nouvelles générations.", `<h2>Un réseau d'excellence au cœur du système de santé</h2><p>Le réseau des Alumni de l’IFSIO regroupe l’ensemble des sages-femmes et infirmiers diplômés d’État formés à Parakou depuis 2015. Présents dans tous les départements du Bénin ainsi qu’à l’international, nos alumni témoignent de la qualité de la formation reçue.</p><p>Pour rejoindre les initiatives du réseau, écrivez à <a href="mailto:contact.ifsio-up@gouv.bj">contact.ifsio-up@gouv.bj</a>.</p>`],
  vie: ["Vie étudiante", "Communauté IFSIO", "La vie étudiante à l’IFSIO", "Engagement, initiatives collectives et activités rythment la vie de la communauté étudiante.", `<div class="studentlife-article"><figure class="studentlife-cover"><img src="assets/vie-etudiante.jpg" alt="Étudiants de l’IFSIO réunis sur le campus"></figure><div class="institute-rubric-intro"><span class="eyebrow">La communauté IFSIO</span><h2>Apprendre, s’engager <em>et grandir ensemble.</em></h2><p>La vie à l’Institut se construit aussi en dehors des cours : initiatives étudiantes, activités culturelles, entraide et engagement au service de la communauté.</p></div><div class="studentlife-facts"><article><span>APPRENDRE</span><p>Une communauté qui partage les expériences de formation et de stage.</p></article><article><span>S’ENGAGER</span><p>Des étudiantes et étudiants qui portent des projets et des actions collectives.</p></article><article><span>SE RETROUVER</span><p>Des activités qui font vivre l’esprit de promotion et le lien avec l’Institut.</p></article></div><section class="studentlife-office-card" id="bue"><div><span>REPRÉSENTATION ÉTUDIANTE</span><h3>Bureau des étudiants · BUE</h3><p>Retrouvez les publications et les initiatives de la communauté étudiante.</p></div><span class="studentlife-office-mark" aria-hidden="true">BUE</span></section><section><h2>Actualités étudiantes</h2><div class="studentlife-activity-list" id="vie-past-articles"><p class="studentlife-empty">Les publications étudiantes apparaîtront ici.</p></div></section><section class="studentlife-upcoming-list"><h2>Activités à venir</h2><div id="vie-upcoming-events"><p class="studentlife-empty">Aucune activité à venir n’est publiée pour le moment.</p></div></section><section class="studentlife-associations"><h2>Engagements et associations</h2><div><article><span>VIE ASSOCIATIVE</span><h3>Initiatives étudiantes</h3><p>Les projets associatifs et culturels contribuent à la vie de la communauté.</p></article><article><span>ENTRAIDE</span><h3>Une communauté solidaire</h3><p>Les échanges entre promotions favorisent le partage d’expérience et l’intégration.</p></article></div></section><section class="studentlife-alumni"><h2>Après la formation</h2><p>Le lien avec l’Institut se poursuit après l’obtention du diplôme.</p><a class="studentlife-alumni-link" href="page.html?view=alumni">Découvrir le réseau Alumni →</a></section></div>`],
  publication: ["Publication", "Actualités · Communiqués · Activités", "Les publications de l’IFSIO", "Retrouvez les informations institutionnelles, les annonces et les temps forts de la communauté.", `<div class="publication-article"><figure class="publication-cover"><img src="assets/recherche.jpg" alt="Activités scientifiques et institutionnelles à l’IFSIO"></figure><div class="institute-rubric-intro"><span class="eyebrow">Le journal de l’Institut</span><h2>Les nouvelles qui font <em>vivre l’IFSIO.</em></h2><p>Actualités, communiqués et activités publiés par l’Institut et sa communauté.</p></div><nav class="publication-jump-links" aria-label="Rubriques des publications"><a href="#publication-news">Actualités</a><a href="#publication-notices">Communiqués</a><a href="#publication-events">Activités</a></nav><section id="publication-news"><h2>Actualités</h2><div class="publication-news-list"><p class="publication-feed-empty">Aucune actualité publique n’a encore été publiée.</p></div></section><section id="publication-notices"><h2>Communiqués</h2><div class="publication-news-list"><p class="publication-feed-empty">Aucun communiqué public n’a encore été publié.</p></div></section><section id="publication-events"><h2>Activités</h2><div class="publication-events"><p class="publication-feed-empty">Aucune activité publique à venir n’a encore été publiée.</p></div></section></div>`],
  ressources: ["Ressources", "Documentation · Médiathèque · Orientation", "Les ressources de l’IFSIO", "Documents de formation, mémoires, rapports, images et liens utiles réunis au même endroit.", `<div class="resources-article"><figure class="resources-cover"><img src="assets/formation-clinique.jpg" alt="Apprentissage pratique en sciences de la santé"></figure><div class="institute-rubric-intro"><span class="eyebrow">Médiathèque IFSIO</span><h2>Des ressources utiles <em>à chaque étape.</em></h2><p>Consultez les documents publics mis à disposition par l’Institut. Les fichiers sont publiés par l’administration éditoriale.</p></div><section><h2>Documents et guides</h2><div class="resources-list" id="ifsio-documents"><p class="resources-empty">Aucun document public n’a encore été publié dans la médiathèque.</p></div></section><section><h2>Mémoires & Travaux</h2><div class="resources-list" id="ifsio-memoires"><p class="resources-empty">Consultez l'ensemble des mémoires sur <a href="https://cntrss.ifsio.bj" target="_blank" rel="noopener">le catalogue CNTRSS ↗</a>.</p></div></section></div>`],
  contact: ["Contact", "Nous joindre", "Parlons de votre projet.", "L’équipe de l’IFSIO vous oriente vers les informations sur les formations, les admissions et la vie de l’Institut.", `<div class="contact-cards"><a href="mailto:contact.ifsio-up@gouv.bj"><span>Courriel</span><strong>contact.ifsio-up@gouv.bj</strong><small>Écrivez à l’équipe de l’Institut</small></a><a href="tel:+2290123612046"><span>Téléphone</span><strong>(+229) 01 23 61 20 46</strong><small>Lundi au vendredi · 08 h–19 h</small></a><div><span>Adresse</span><strong>Université de Parakou</strong><small>Parakou, Bénin</small></div></div><h2>Comment nous aider à vous répondre ?</h2><p>Précisez l’objet de votre demande, la formation concernée et, si nécessaire, votre niveau d’étude.</p><a class="button button-navy" href="mailto:contact.ifsio-up@gouv.bj?subject=Demande%20d’information%20IFSIO">Envoyer un courriel <span>→</span></a>`],
  bue: ["Vie étudiante", "Publications du BUE", "Actualités étudiantes", "Les nouvelles, les temps forts et les engagements de la communauté de l’IFSIO.", `<div class="bue-editorial-list" aria-label="Publications du Bureau des étudiants"><a class="bue-editorial-item" href="page.html?view=gala-article"><span class="bue-editorial-index">01</span><span class="bue-editorial-copy"><span class="bue-editorial-meta">Culture & vie étudiante <i>·</i> Octobre 2026</span><strong>Gala IFSIO 2026 : deux jours de culture et de talents</strong><span class="bue-editorial-summary">Retour sur le rendez-vous culturel de la communauté étudiante, avec un album photo de la soirée.</span></span><span class="bue-editorial-action">Lire l’article <b>→</b></span></a><a class="bue-editorial-item bue-editorial-rose" href="page.html?view=octobre-rose-article"><span class="bue-editorial-index">02</span><span class="bue-editorial-copy"><span class="bue-editorial-meta">Prévention & solidarité <i>·</i> Octobre 2026</span><strong>Octobre Rose Vibes 2026 : chaque parcours compte</strong><span class="bue-editorial-summary">Une publication de sensibilisation autour de l’information, de l’écoute et de la santé du sein.</span></span><span class="bue-editorial-action">Lire l’article <b>→</b></span></a></div>`],
  'gala-article': ["Vie étudiante", "Culture & vie étudiante", "Gala IFSIO 2026 : deux jours de culture et de talents", "À Parakou, la communauté IFSIO s’est retrouvée autour d’un programme culturel et d’une soirée de gala.", `<article class="bue-press-article"><a class="bue-back-link" href="page.html?view=bue">← Toutes les publications du BUE</a><figure class="bue-press-cover"><img src="assets/gala-2026/thumbs/IMG-20261012-WA0277.jpg" alt="Gala IFSIO 2026"><figcaption>Gala IFSIO 2026 · Parakou</figcaption></figure><p class="bue-press-lead">L’édition 2026 du Gala IFSIO a placé la culture et les talents étudiants au cœur d’un week-end festif à Parakou.</p><a class="bue-gallery-cta" href="page.html?view=gala-2026"><span class="bue-gallery-cta-icon" aria-hidden="true">▧</span><span><strong>Revoir la soirée en images</strong><small>Parcourir l’album photo du Gala IFSIO 2026</small></span><b>Ouvrir l’album →</b></a></article>`],
  'octobre-rose-article': ["Vie étudiante", "Prévention & solidarité", "Octobre Rose Vibes 2026", "Chaque histoire est unique. Chaque parcours mérite écoute, respect et soutien.", `<article class="bue-press-article bue-press-rose"><a class="bue-back-link" href="page.html?view=bue">← Toutes les publications du BUE</a><figure class="bue-press-cover bue-rose-cover"><img src="assets/octobre-rose-2026-cover.svg" alt="Visuel Octobre Rose Vibes 2026"><figcaption>Octobre Rose Vibes · BUE IFSIO</figcaption></figure><p class="bue-press-lead">Temps fort de sensibilisation à l'information et à la détection précoce du cancer du sein par la communauté de l'IFSIO.</p></article>`],
  'gala-2026': ["Vie étudiante", "Album photo", "Gala IFSIO 2026", "Les images d’une soirée consacrée aux talents et à la vie culturelle de la communauté étudiante.", `<div class="bue-gallery-page"><a class="bue-back-link" href="page.html?view=gala-article">← Retour à l’article du Gala</a><div id="bue-gala-gallery" class="bue-gala-gallery" aria-live="polite"></div></div>`],
  insertion: ["Vie étudiante", "Après la formation", "Insertion professionnelle & Réseau", "Une intégration rapide au sein des structures sanitaires publiques et privées.", `<p class="lead">Les infirmiers et sages-femmes formés à l'IFSIO bénéficient d'une réputation d'excellence technique et humaine favorisant leur recrutement immédiat.</p><div class="article-callout"><strong>Réseau des diplômés</strong><p>Retrouvez toutes les opportunités et contacts au sein de la page <a href="page.html?view=alumni">Alumni de l'IFSIO</a>.</p></div>`],
  photos: ["Ressources", "Galerie", "Galerie photos de l’IFSIO", "Les images des formations, activités et temps forts de la communauté IFSIO.", `<h2>Albums de l’Institut</h2><p>Consultez la galerie photo officielle de l’IFSIO.</p><p><a class="button button-navy" href="https://www.flickr.com/photos/ifsiobj/albums" target="_blank" rel="noopener noreferrer">Ouvrir la galerie photos <span>↗</span></a></p>`],
  videos: ["Ressources", "Médiathèque", "Vidéos de l’IFSIO", "Retrouvez les vidéos publiées par l’Institut.", `<h2>Chaîne vidéo de l’Institut</h2><p>Les vidéos officielles sont disponibles sur notre chaîne YouTube.</p><p><a class="button button-navy" href="https://www.youtube.com/@Ifsio-i7m" target="_blank" rel="noopener noreferrer">Ouvrir la chaîne vidéo <span>↗</span></a></p>`],
  communiques: ["Publications", "Informations officielles", "Communiqués", "Les communiqués et annonces officielles de l’IFSIO.", `<p class="article-muted">Les communiqués validés par l’Institut apparaîtront dans cette rubrique.</p>`],
  activites: ["Publications", "Vie de l’Institut", "Activités", "Les activités institutionnelles, scientifiques et étudiantes publiées par l’IFSIO.", `<p class="article-muted">Les prochaines activités publiques de l’Institut apparaîtront ici.</p>`],
  'recherche-site': ["Recherche", "Recherche dans tout le site", "Trouver une information ou une formation", "Parcourez instantanément l’ensemble des filières, arrêtés, coordonnateurs, diplômes et actualités de l’IFSIO.", ""]
};

// =============================================================================
// Logique de routage et d'affichage
// =============================================================================

const requested = new URLSearchParams(location.search).get('view') || 'institut';
if (['bue', 'gala-article', 'octobre-rose-article', 'gala-2026'].includes(requested)) document.body.classList.add('bue-page');
if (['institut', 'vie', 'publication', 'ressources', 'contact', 'recherche-site', 'master-ssr', 'master-iac', 'master-smur', 'esii', 'essfe', 'licence', 'masters', 'honoraire', 'dirigeants', 'equipe', 'partenaires', 'liens'].includes(requested)) document.body.classList.add('institute-page');
if (requested === 'vie') document.body.classList.add('studentlife-page');
if (requested === 'publication') document.body.classList.add('publication-page');
if (requested === 'ressources') document.body.classList.add('resources-page');
if (requested === 'contact') document.body.classList.add('contact-page');

const pageData = pages[requested] || pages.institut;
const [category, eyebrow, title, intro, body] = pageData;
document.title = `${category} — IFSIO | Université de Parakou`;

const catEl = document.querySelector('#page-category');
if (catEl) catEl.textContent = category;

const eyeEl = document.querySelector('#page-eyebrow');
if (eyeEl) eyeEl.textContent = eyebrow;

const titleEl = document.querySelector('#page-title');
if (titleEl) titleEl.innerHTML = title.split('\n').map((line) => `<span>${line}</span>`).join('<br>');

const introEl = document.querySelector('#page-intro');
if (introEl) introEl.textContent = intro;

const contentEl = document.querySelector('#page-content');
if (contentEl) contentEl.innerHTML = body;

const yearEl = document.querySelector('#current-year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// =============================================================================
// Enrichissement dynamique via API & Moteur de Recherche Interne
// =============================================================================

async function afficherContenusPublics() {
  const container = document.querySelector('#page-content');
  if (!container) return;

  const empty = (message) => {
    const note = document.createElement('p');
    note.className = 'article-muted';
    note.textContent = message;
    container.replaceChildren(note);
  };

  const renderNews = (items, emptyMessage, target = container) => {
    if (!items.length) {
      const note = document.createElement('p');
      note.className = 'article-muted';
      note.textContent = emptyMessage;
      target.replaceChildren(note);
      return;
    }
    const list = document.createElement('div');
    list.className = 'article-news-list news-editorial-list';
    for (const item of items) {
      const article = document.createElement('article');
      article.className = 'news-editorial-card';
      if (item.cover_url) {
        const image = document.createElement('img');
        image.className = 'news-editorial-cover';
        image.src = item.cover_url;
        image.alt = '';
        image.loading = 'lazy';
        article.append(image);
      }
      const content = document.createElement('div');
      content.className = 'news-editorial-copy';
      const meta = document.createElement('small');
      meta.textContent = [item.category, item.published_at ? new Date(item.published_at).toLocaleDateString('fr-FR') : ''].filter(Boolean).join(' · ');
      const heading = document.createElement('h2');
      const link = document.createElement('a');
      link.href = `page.html?view=contenu&slug=${encodeURIComponent(item.slug)}`;
      link.textContent = item.title;
      heading.append(link);
      const summary = document.createElement('p');
      summary.textContent = item.summary || item.body || '';
      const action = document.createElement('a');
      action.className = 'news-read-link';
      action.href = link.href;
      action.textContent = 'Lire l’article →';
      content.append(meta, heading, summary, action);
      article.append(content);
      list.append(article);
    }
    target.replaceChildren(list);
  };

  // MOTEUR DE RECHERCHE INTERACTIF UNIFIÉ
  if (requested === 'recherche-site') {
    container.innerHTML = '';
    
    const searchWrapper = document.createElement('div');
    searchWrapper.className = 'site-search-wrapper';
    searchWrapper.style.cssText = 'margin-bottom: 2rem;';
    
    searchWrapper.innerHTML = `
      <div style="background: rgba(14,49,80,0.03); border: 1px solid rgba(14,49,80,0.1); border-radius: 12px; padding: 1.5rem; margin-bottom: 2rem;">
        <label for="search-input-live" style="display:block; font-weight:600; font-size:1.1rem; color:#0e3150; margin-bottom:0.6rem;">
          Rechercher une formation, un enseignant, une procédure ou un service :
        </label>
        <div style="display:flex; gap:0.6rem; align-items:center;">
          <input type="search" id="search-input-live" placeholder="Ex: Master, Sage-femme, ECTS, Délibération, Inscription, Parakou..." style="flex:1; padding:0.9rem 1.2rem; font-size:1rem; border:2px solid #0e3150; border-radius:8px; outline:none;">
          <button id="search-btn-trigger" class="button button-navy" style="padding:0.9rem 1.5rem; cursor:pointer;">Rechercher</button>
        </div>
        <div style="display:flex; gap:0.5rem; flex-wrap:wrap; margin-top:0.8rem; font-size:0.85rem; color:#555;">
          <span>Suggestions rapides :</span>
          <button type="button" class="search-tag" data-kw="Licence" style="background:white; border:1px solid #ccc; border-radius:20px; padding:0.2rem 0.6rem; cursor:pointer;">Licence</button>
          <button type="button" class="search-tag" data-kw="Master SSR" style="background:white; border:1px solid #ccc; border-radius:20px; padding:0.2rem 0.6rem; cursor:pointer;">Master SSR</button>
          <button type="button" class="search-tag" data-kw="Urgence" style="background:white; border:1px solid #ccc; border-radius:20px; padding:0.2rem 0.6rem; cursor:pointer;">Urgence</button>
          <button type="button" class="search-tag" data-kw="Chirurgie" style="background:white; border:1px solid #ccc; border-radius:20px; padding:0.2rem 0.6rem; cursor:pointer;">Bloc / Chirurgie</button>
          <button type="button" class="search-tag" data-kw="Notes" style="background:white; border:1px solid #ccc; border-radius:20px; padding:0.2rem 0.6rem; cursor:pointer;">eRésultats / Notes</button>
          <button type="button" class="search-tag" data-kw="Actes" style="background:white; border:1px solid #ccc; border-radius:20px; padding:0.2rem 0.6rem; cursor:pointer;">Attestations QR</button>
        </div>
      </div>
      <div id="search-results-area" aria-live="polite"></div>
    `;
    container.append(searchWrapper);

    const input = document.querySelector('#search-input-live');
    const resultsArea = document.querySelector('#search-results-area');

    // Indexation de toutes les pages statiques
    const staticIndex = Object.entries(pages)
      .filter(([key]) => key !== 'recherche-site')
      .map(([key, [cat, eye, tit, int, bdy]]) => {
        const textOnly = `${cat} ${eye} ${tit} ${int} ${bdy}`.replace(/<[^>]+>/g, ' ').toLowerCase();
        return { key, cat, title: tit.replace(/\n/g, ' '), intro: int, fullText: textOnly };
      });

    const runSearch = async (query) => {
      const q = query.trim().toLowerCase();
      if (q.length < 2) {
        resultsArea.innerHTML = '<p class="article-muted">Saisissez au moins 2 lettres pour afficher les correspondances.</p>';
        return;
      }

      // Recherche locale immédiate
      const localMatches = staticIndex.filter(item => item.fullText.includes(q)).map(item => ({
        title: item.title,
        category: item.cat,
        summary: item.intro,
        url: `page.html?view=${item.key}`,
        source: 'Page institutionnelle'
      }));

      // Recherche API distante
      let apiMatches = [];
      try {
        const res = await fetch(`/api/public/search?q=${encodeURIComponent(q)}`);
        if (res.ok) {
          const data = await res.json();
          apiMatches = (data.results || []).map(item => ({
            title: item.title,
            category: item.category || 'Actualité / Ressource',
            summary: item.summary || '',
            url: item.url,
            source: 'Actualités & Documents'
          }));
        }
      } catch (_e) {}

      // Fusion et déduplication
      const all = [...localMatches, ...apiMatches];
      if (!all.length) {
        resultsArea.innerHTML = `<p class="article-muted" style="font-size:1.05rem;">Aucun résultat trouvé pour « <strong>${query}</strong> ». Essayez avec d'autres termes (ex. <em>Licence, Sage-femme, Inscription, Master</em>).</p>`;
        return;
      }

      resultsArea.innerHTML = `
        <h3 style="color:#0e3150; font-size:1.15rem; margin-bottom:1rem;">
          ${all.length} résultat${all.length > 1 ? 's' : ''} correspondant à « ${query} » :
        </h3>
        <div class="article-news-list">
          ${all.map(item => `
            <a href="${item.url}" class="news-editorial-card" style="display:block; text-decoration:none; padding:1.2rem; margin-bottom:0.8rem; background:white; border-radius:8px; border:1px solid #e2e8f0; border-left:4px solid #0e3150;">
              <div style="font-size:0.8rem; text-transform:uppercase; color:#b8860b; font-weight:700; margin-bottom:0.3rem;">
                ${item.category} · <span style="color:#666;">${item.source}</span>
              </div>
              <h4 style="margin:0 0 0.4rem 0; color:#0e3150; font-size:1.15rem;">${item.title}</h4>
              <p style="margin:0; color:#444; font-size:0.95rem; line-height:1.4;">${item.summary}</p>
            </a>
          `).join('')}
        </div>
      `;
    };

    input.addEventListener('input', () => runSearch(input.value));
    document.querySelectorAll('.search-tag').forEach(btn => {
      btn.addEventListener('click', () => {
        input.value = btn.dataset.kw;
        runSearch(btn.dataset.kw);
      });
    });

    const initQ = new URLSearchParams(location.search).get('q') || '';
    if (initQ) {
      input.value = initQ;
      runSearch(initQ);
    } else {
      runSearch('formation'); // Affichage initial accueillant
    }
    return;
  }

  // Actualités & Communiqués
  if (['actualites', 'communiques'].includes(requested)) {
    try {
      const response = await fetch('/api/public/news');
      if (!response.ok) return;
      const { news = [] } = await response.json();
      const items = requested === 'communiques'
        ? news.filter(item => /communiqu[eé]/i.test(item.category || ''))
        : news;
      renderNews(items, requested === 'communiques' ? 'Aucun communiqué officiel n’a été publié pour le moment.' : 'Aucune actualité publique n’a encore été publiée.');
    } catch {
      empty('Impossible de charger les publications pour le moment.');
    }
  }

  // Publication (Hub de nouvelles)
  if (requested === 'publication') {
    const newsBox = document.querySelector('#publication-news');
    const noticesBox = document.querySelector('#publication-notices');
    const activitiesBox = document.querySelector('#publication-events');
    try {
      const response = await fetch('/api/public/news');
      if (response.ok) {
        const { news = [] } = await response.json();
        const publishedNews = news.filter(item => !/^\s*\[d[eé]mo\]/i.test(String(item.title || '')));
        renderNews(publishedNews.filter(n => !/communiqu[eé]/i.test(n.category || '')), 'Aucune actualité publique pour le moment.', newsBox);
        renderNews(publishedNews.filter(n => /communiqu[eé]/i.test(n.category || '')), 'Aucun communiqué officiel pour le moment.', noticesBox);
      }
    } catch {}
  }

  // BUE (Bureau des Étudiants)
  if (requested === 'bue') {
    try {
      const response = await fetch('/api/public/news?category=BUE');
      if (response.ok) {
        const { news = [] } = await response.json();
        const list = container.querySelector('.bue-editorial-list');
        for (const item of [...news].reverse()) {
          const link = document.createElement('a');
          link.className = 'bue-editorial-item';
          link.href = `page.html?view=contenu&slug=${encodeURIComponent(item.slug)}`;
          const index = document.createElement('span');
          index.className = 'bue-editorial-index';
          index.textContent = '•';
          const copy = document.createElement('span');
          copy.className = 'bue-editorial-copy';
          const meta = document.createElement('span');
          meta.className = 'bue-editorial-meta';
          meta.textContent = [item.category, item.published_at ? new Date(item.published_at).toLocaleDateString('fr-FR') : ''].filter(Boolean).join(' · ');
          const titleEl = document.createElement('strong');
          titleEl.textContent = item.title;
          const summary = document.createElement('span');
          summary.className = 'bue-editorial-summary';
          summary.textContent = item.summary || '';
          copy.append(meta, titleEl, summary);
          const action = document.createElement('span');
          action.className = 'bue-editorial-action';
          action.append(document.createTextNode('Lire l’article '));
          const arrow = document.createElement('b');
          arrow.textContent = '→';
          action.append(arrow);
          link.append(index, copy, action);
          list?.prepend(link);
        }
      }
    } catch {}
  }

  // Articles dynamiques du CMS
  if (requested === 'contenu') {
    const slug = new URLSearchParams(location.search).get('slug');
    if (!slug) return;
    try {
      let response = await fetch(`/api/public/news/${encodeURIComponent(slug)}`);
      let article = null;
      let kind = 'news';
      if (response.ok) {
        ({ article } = await response.json());
      } else {
        response = await fetch(`/api/public/pages/${encodeURIComponent(slug)}`);
        if (!response.ok) return;
        ({ page: article } = await response.json());
        kind = 'page';
      }
      document.title = `${article.title} — IFSIO | Université de Parakou`;
      if (catEl) catEl.textContent = article.category || 'IFSIO';
      if (eyeEl) eyeEl.textContent = article.category || (kind === 'news' ? 'Actualité de l’Institut' : 'Information institutionnelle');
      if (titleEl) titleEl.textContent = article.title;
      if (introEl) introEl.textContent = article.summary || '';
      const fragment = document.createDocumentFragment();
      const story = document.createElement('article');
      story.className = 'bue-press-article cms-public-article';
      const back = document.createElement('a');
      back.className = 'bue-back-link';
      back.href = kind === 'news' ? 'page.html?view=actualites' : 'index.html';
      back.textContent = kind === 'news' ? '← Toutes les actualités' : '← Accueil';
      story.append(back);
      if (article.cover_url) {
        const figure = document.createElement('figure');
        figure.className = 'bue-press-cover';
        const image = document.createElement('img');
        image.src = article.cover_url;
        image.alt = '';
        image.fetchPriority = 'high';
        figure.append(image);
        story.append(figure);
      }
      for (const paragraph of String(article.body || '').split(/\n{2,}/).filter(Boolean)) {
        const p = document.createElement('p');
        p.textContent = paragraph;
        story.append(p);
      }
      fragment.append(story);
      container.replaceChildren(fragment);
    } catch {}
  }

  // Galerie photos
  if (requested === 'gala-2026') {
    const gallery = document.querySelector('#bue-gala-gallery');
    if (gallery) {
      try {
        const response = await fetch('assets/gala-2026/gala-2026.json');
        if (response.ok) {
          const photos = await response.json();
          const grid = document.createElement('div');
          grid.className = 'bue-gala-grid';
          photos.slice(0, 24).forEach(item => {
            const fig = document.createElement('figure');
            const link = document.createElement('a');
            link.href = item.src;
            link.target = '_blank';
            const img = document.createElement('img');
            img.src = item.thumbnail;
            img.alt = item.alt;
            img.loading = 'lazy';
            link.append(img);
            fig.append(link);
            grid.append(fig);
          });
          gallery.replaceChildren(grid);
        }
      } catch {}
    }
  }
}

afficherContenusPublics();
