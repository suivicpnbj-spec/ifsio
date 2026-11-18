import { DocumentItem, DisciplineMeta, StudyDesign } from '../types';

export const STUDY_DESIGNS: StudyDesign[] = [
  'Étude transversale',
  'Étude cas-témoins',
  'Audit clinique',
  'Étude prospective',
  'Étude expérimentale',
  'Revue systématique'
];

export const HEALTH_ZONES = [
  'Zone sanitaire Parakou - N\'Dali',
  'Zone sanitaire CHUD Borgou / Alibori',
  'Zone sanitaire Cotonou 1-4 (CNHU / CHU-MEL)',
  'Zone sanitaire Ouidah - Kpomassè - Tori (Djeffa)',
  'Zone sanitaire Tchaourou'
];

export const DISCIPLINES: DisciplineMeta[] = [
  {
    id: 'Médecine',
    title: 'Médecine',
    count: 1024,
    iconName: 'Stethoscope',
    description: 'Thèses et mémoires de médecine générale et spécialités cliniques.'
  },
  {
    id: 'Soins infirmiers',
    title: 'Soins infirmiers',
    count: 482,
    iconName: 'HeartHandshake',
    description: 'Travaux en sciences infirmières, soins primaires et obstétricaux.'
  },
  {
    id: 'Pharmacie',
    title: 'Pharmacie',
    count: 326,
    iconName: 'Pill',
    description: 'Sciences pharmaceutiques, pharmacognosie et pharmacologie clinique.'
  },
  {
    id: 'Santé publique',
    title: 'Santé publique',
    count: 278,
    iconName: 'Users',
    description: 'Épidémiologie, gestion des systèmes de santé et santé communautaire.'
  },
  {
    id: 'Biologie médicale',
    title: 'Biologie médicale',
    count: 196,
    iconName: 'FlaskConical',
    description: 'Analyses biomédicales, microbiologie, hématologie et biochimie.'
  },
  {
    id: 'Nutrition',
    title: 'Nutrition',
    count: 143,
    iconName: 'Apple',
    description: 'Diététique, sécurité nutritionnelle et prise en charge de la malnutrition.'
  },
  {
    id: 'Odontostomatologie',
    title: 'Odontostomatologie',
    count: 112,
    iconName: 'Smile',
    description: 'Santé bucco-dentaire, chirurgie maxillo-faciale et parodontologie.'
  },
  {
    id: 'Kinésithérapie',
    title: 'Kinésithérapie',
    count: 87,
    iconName: 'Activity',
    description: 'Rééducation fonctionnelle, masso-kinésithérapie et réadaptation physique.'
  },
  {
    id: 'ORL',
    title: 'ORL',
    count: 64,
    iconName: 'Ear',
    description: 'Oto-rhino-laryngologie, pathologies auditives et voies aérodigestives.'
  },
  {
    id: 'Ophtalmologie',
    title: 'Ophtalmologie',
    count: 53,
    iconName: 'Eye',
    description: 'Pathologies oculaires, santé visuelle et chirurgie ophtalmique.'
  },
  {
    id: 'Autres filières',
    title: 'Autres filières',
    count: 231,
    iconName: 'Layers',
    description: 'Imagerie médicale, génie biomédical, psychologie clinique et recherche transversale.'
  }
];

export const MOCK_DOCUMENTS: DocumentItem[] = [
  {
    id: 'doc-001',
    doi: '10.cntrss.bj/med.2023.001',
    title: 'Épidémiologie du paludisme dans la commune de Parakou',
    type: 'Mémoire de licence',
    discipline: 'Médecine',
    studyDesign: 'Étude transversale',
    healthZone: 'Zone sanitaire Parakou - N\'Dali',
    year: 2023,
    author: 'AKPO Laurel Aymeric',
    supervisor: 'Prof. ADEGBOLA Sylvain',
    institution: 'Université de Parakou (Faculté de Médecine)',
    keywords: ['Paludisme', 'Épidémiologie', 'Santé publique', 'Bénin', 'Parakou'],
    meshTerms: ['Malaria / epidemiology', 'Plasmodium falciparum', 'Mosquito Nets', 'Benin'],
    abstract: 'Le paludisme demeure la première cause de morbidité et de mortalité infanto-juvénile au Bénin. Cette étude prospective transversale menée auprès de 450 ménages de la commune de Parakou vise à évaluer la prévalence parasitaire du Plasmodium falciparum, les déterminants socio-environnementaux et le niveau d\'utilisation effective des moustiquaires imprégnées à longue durée d\'action (MILDA). Les résultats révèlent une prévalence globale de 38,4%, significativement corrélée à la proximité des zones de stagnation d\'eaux pluviales et à un faible niveau de couverture par assainissement. Des recommandations ciblées sont formulées à l\'attention de la zone sanitaire Parakou-N\'Dali.',
    clinicalKeyTakeaways: [
      'Prévalence parasitaire réelle de 38,4% chez les moins de 5 ans dans les arrondissements périphériques de Parakou.',
      'Taux d\'utilisation effective des MILDA inférieur de 22 points au taux de possession déclaré lors des distributions de masse.',
      'Nécessité de coupler la chimio-prévention saisonnière (CPS) à des actions communautaires d\'assainissement des gîtes larvaires avant la saison pluvieuse.'
    ],
    hasOpenData: true,
    citationsCount: 14,
    pages: 74,
    downloads: 1420,
    views: 3890,
    dateAdded: '2023-11-15',
    isFeatured: true,
    coverImage: '/src/assets/images/cntrss_doc_cover_1791922682268.jpg',
    tableOfContents: [
      { title: 'Introduction générale et justification', page: 1 },
      { title: 'Revue de la littérature sur le paludisme en zone sahélienne et soudanienne', page: 12 },
      { title: 'Cadre méthodologique et échantillonnage probabiliste', page: 28 },
      { title: 'Présentation et analyse des résultats épidémiologiques', page: 41 },
      { title: 'Discussion et comparaison aux données du PNLP', page: 58 },
      { title: 'Conclusions et recommandations opérationnelles', page: 69 }
    ]
  },
  {
    id: 'doc-002',
    doi: '10.cntrss.bj/inf.2024.014',
    title: 'Prise en charge de l\'hypertension artérielle en milieu communautaire',
    type: 'Rapport de stage',
    discipline: 'Soins infirmiers',
    studyDesign: 'Audit clinique',
    healthZone: 'Zone sanitaire Parakou - N\'Dali',
    year: 2024,
    author: 'DOSSOU M. Grâce',
    supervisor: 'Mme CHABI Y. Marcelline (Cadre supérieur de santé)',
    institution: 'Institut National Médico-Sanitaire (INMeS)',
    keywords: ['Hypertension', 'Soins primaires', 'Santé communautaire', 'Observance thérapeutique'],
    meshTerms: ['Hypertension / therapy', 'Primary Health Care', 'Medication Adherence', 'Community Health Nursing'],
    abstract: 'Rapport d\'immersion communautaire analysant le dépistage précoce et l\'accompagnement infirmier des patients hypertendus dans trois arrondissements périphériques de Parakou. L\'étude identifie les barrières à l\'observance du traitement antihypertenseur, notamment le recours initial à la pharmacopée traditionnelle non standardisée et le coût des explorations complémentaires. Un protocole d\'éducation thérapeutique infirmière de proximité y est proposé.',
    clinicalKeyTakeaways: [
      'Seulement 31% des patients hypertendus connus maintiennent une pression artérielle contrôlée (<140/90 mmHg) en suivi primaire.',
      'Le recours alternatif à des décoctions de plantes sans avis médical est rapporté par 54% des sujets en rupture d\'observance.',
      'Un protocole d\'éducation thérapeutique infirmière mensuel en centre de santé d\'arrondissement améliore l\'observance de +40% à 3 mois.'
    ],
    hasOpenData: true,
    citationsCount: 8,
    pages: 58,
    downloads: 980,
    views: 2650,
    dateAdded: '2024-03-10',
    isFeatured: true,
    tableOfContents: [
      { title: 'Contexte du stage et objectifs d\'apprentissage', page: 3 },
      { title: 'Description de la zone sanitaire et structures d\'accueil', page: 14 },
      { title: 'Données collectées sur l\'observance thérapeutique', page: 29 },
      { title: 'Études de cas cliniques et démarche de soins', page: 40 },
      { title: 'Pistes d\'amélioration pour la sensibilisation', page: 52 }
    ]
  },
  {
    id: 'doc-003',
    doi: '10.cntrss.bj/med.2022.088',
    title: 'Aspects épidémiologiques des infections respiratoires aiguës chez l\'enfant de moins de 5 ans',
    type: 'Thèse',
    discipline: 'Médecine',
    studyDesign: 'Étude prospective',
    healthZone: 'Zone sanitaire CHUD Borgou / Alibori',
    year: 2022,
    author: 'TCHABI K. Solange',
    supervisor: 'Prof. ALIHONOU Robert',
    institution: 'CHUD Borgou (Centre Hospitalier Universitaire Départemental)',
    keywords: ['IRA', 'Épidémiologie', 'Pédiatrie', 'Détresse respiratoire', 'CHUD'],
    meshTerms: ['Respiratory Tract Infections / epidemiology', 'Pneumonia / mortality', 'Infant', 'Benin'],
    abstract: 'Thèse d\'exercice en médecine portant sur 312 cas d\'infections respiratoires aiguës basses hospitalisés au service de pédiatrie du CHUD-Borgou. L\'auteur détaille le profil clinique, bactériologique et radiologique des bronchiolites et pneumopathies infectieuses, ainsi que les facteurs de mortalité précoce chez les nourrissons malnutris.',
    clinicalKeyTakeaways: [
      'La détresse respiratoire avec tirage sous-costal et geignement est la 2e cause d\'admission pédiatrique d\'urgence au CHUD-Borgou.',
      'La co-morbidité avec la malnutrition aiguë sévère multiplie par 3,4 le risque de décès intrahospitalier dans les 48 premières heures.',
      'L\'oxygénothérapie précoce et l\'application rigoureuse du protocole PCIME hospitalier réduisent la létalité de moitié.'
    ],
    hasOpenData: false,
    citationsCount: 22,
    pages: 112,
    downloads: 1840,
    views: 4520,
    dateAdded: '2022-12-04',
    isFeatured: true,
    tableOfContents: [
      { title: 'Rappels anatomiques et physiopathologiques pédiatriques', page: 5 },
      { title: 'Méthodologie d\'étude au CHUD-Borgou', page: 30 },
      { title: 'Résultats cliniques, paracliniques et thérapeutiques', page: 52 },
      { title: 'Facteurs pronostiques et analyse multivariée', page: 85 },
      { title: 'Recommandations pour la prise en charge d\'urgence', page: 104 }
    ]
  },
  {
    id: 'doc-004',
    doi: '10.cntrss.bj/spub.2023.019',
    title: 'Évaluation de la qualité des soins au centre de santé de Djeffa',
    type: 'Mémoire de licence',
    discipline: 'Santé publique',
    studyDesign: 'Audit clinique',
    healthZone: 'Zone sanitaire Ouidah - Kpomassè - Tori (Djeffa)',
    year: 2023,
    author: 'HOUNKANRIN Espoir',
    supervisor: 'Dr. GOUHOUNDE Florent',
    institution: 'Université de Parakou / INMeS',
    keywords: ['Qualité des soins', 'Centre de santé', 'Santé publique', 'Satisfaction des usagers'],
    meshTerms: ['Quality of Health Care', 'Primary Health Care', 'Patient Satisfaction', 'Benin'],
    abstract: 'Audit de la qualité des prestations fournies au centre de santé d\'arrondissement de Djeffa suivant les dimensions de Donabedian : structure (équipements, ressources humaines, approvisionnement pharmaceutique), processus (respect des protocoles de triage) et résultats (taux de guérison, satisfaction déclarée des patientes en consultation prénatale).',
    clinicalKeyTakeaways: [
      'Score de conformité des équipements de consultation prénatale évalué à 68% selon la grille nationale du Ministère.',
      'Délai moyen d\'attente avant consultation estimé à 1h45min, principal facteur d\'insatisfaction exprimé par les usagères.',
      'Recommandation d\'instaurer un carnet de rendez-vous échelonné pour fluidifier le flux de consultation du matin.'
    ],
    hasOpenData: true,
    citationsCount: 5,
    pages: 66,
    downloads: 740,
    views: 1910,
    dateAdded: '2023-09-20',
    isFeatured: true,
    tableOfContents: [
      { title: 'Introduction et cadre conceptuel de la qualité', page: 1 },
      { title: 'Méthodologie de l\'évaluation par audit clinique', page: 18 },
      { title: 'Résultats : Équipements, Ressources humaines, Protocoles', page: 34 },
      { title: 'Mesure de la satisfaction des patientes', page: 49 },
      { title: 'Plan d\'assurance qualité proposé', page: 60 }
    ]
  },
  {
    id: 'doc-005',
    doi: '10.cntrss.bj/inf.2024.032',
    title: 'Diabète gestationnel et pronostic materno-fœtal à la maternité du CHUD Borgou',
    type: 'Mémoire de master',
    discipline: 'Soins infirmiers',
    studyDesign: 'Étude cas-témoins',
    healthZone: 'Zone sanitaire CHUD Borgou / Alibori',
    year: 2024,
    author: 'BIO GOURO Fatima',
    supervisor: 'Dr. ZANNOU Jean-Marc',
    institution: 'Université de Parakou - Faculté de Médecine',
    keywords: ['Diabète gestationnel', 'Obstétrique', 'Mortalité périnatale', 'Macrosomie'],
    meshTerms: ['Diabetes, Gestational / complications', 'Fetal Macrosomia', 'Maternal Mortality', 'Benin'],
    abstract: 'Étude rétrospective et prospective évaluant les issues néonatales et maternelles chez 118 gestantes présentant une anomalie de la tolérance glucidique diagnostiquée entre la 24e et la 28e semaine d\'aménorrhée.',
    clinicalKeyTakeaways: [
      'Taux de macrosomie fœtale (>4000g) de 28% chez les mères diabétiques non équilibrées contre 6% dans le groupe témoin.',
      'Le dépistage ciblé par glycémie à jeun au 2e trimestre reste sous-prescrit en périphérie (moins de 25% des gestantes à risque dépistées).',
      'Protocolisation d\'un régime diététique adapté aux vivres locaux (mil, sorgho, légumes feuilles) avec autosurveillance glycémique.'
    ],
    hasOpenData: true,
    citationsCount: 11,
    pages: 82,
    downloads: 620,
    views: 1490,
    dateAdded: '2024-01-18',
    isFeatured: false
  },
  {
    id: 'doc-006',
    doi: '10.cntrss.bj/phar.2023.007',
    title: 'Étude pharmaco-chimique et valorisation de plantes antipaludiques du Nord-Bénin',
    type: 'Thèse',
    discipline: 'Pharmacie',
    studyDesign: 'Étude expérimentale',
    healthZone: 'Zone sanitaire Parakou - N\'Dali',
    year: 2023,
    author: 'KOUDJO Aristide',
    supervisor: 'Prof. GBAGUIDI Fernand',
    institution: 'Faculté des Sciences de la Santé (FSS)',
    keywords: ['Plantes médicinales', 'Pharmacognosie', 'Artemisia', 'Alcaloïdes', 'Paludisme'],
    meshTerms: ['Plants, Medicinal / chemistry', 'Antimalarials / isolation & purification', 'Ethnopharmacology'],
    abstract: 'Caractérisation phytochimique d\'extraits bruts de feuilles et d\'écorces utilisées par les tradipraticiens du Borgou. Détermination de la CI50 in vitro contre les souches chloroquino-résistantes de Plasmodium falciparum.',
    clinicalKeyTakeaways: [
      'Deux extraits hydroalcooliques présentent une activité inhibitrice remarquable (CI50 < 5 µg/mL).',
      'Absence de cytotoxicité aiguë in vitro sur cellules hépatiques humaines aux doses thérapeutiques usuelles.',
      'Nécessité de standardiser les formes galéniques (tisanes en sachets dosés) pour encadrer la pratique traditionnelle.'
    ],
    hasOpenData: false,
    citationsCount: 19,
    pages: 148,
    downloads: 1150,
    views: 3100,
    dateAdded: '2023-07-11',
    isFeatured: false
  },
  {
    id: 'doc-007',
    doi: '10.cntrss.bj/nut.2023.011',
    title: 'Facteurs de risque de la malnutrition protéino-énergétique chez les enfants de 6 à 59 mois',
    type: 'Mémoire de licence',
    discipline: 'Nutrition',
    studyDesign: 'Étude transversale',
    healthZone: 'Zone sanitaire Tchaourou',
    year: 2023,
    author: 'SOSSOU Rodrigue',
    supervisor: 'Mme HOUNWANOU Béatrice',
    institution: 'Université de Parakou',
    keywords: ['Malnutrition', 'Sevrage', 'Alimentation de complément', 'Anthropométrie'],
    meshTerms: ['Protein-Energy Malnutrition / etiology', 'Infant Nutritional Physiological Phenomena', 'Weaning'],
    abstract: 'Enquête anthropométrique et sociodémographique dans les villages ruraux de Tchaourou. L\'étude identifie l\'inadéquation des pratiques d\'allaitement exclusif et l\'introduction tardive des bouillies enrichies locales comme causes prépondérantes.',
    clinicalKeyTakeaways: [
      'Prévalence du retard de croissance (taille-pour-âge < -2 Z-score) culminant à 41% entre 12 et 23 mois.',
      'L\'introduction précoce d\'eaux d\'herbes traditionnelles avant 6 mois est corrélée à une fréquence accrue d\'épisodes diarrhéiques.',
      'Démonstrations culinaires communautaires à base de farine enrichie locale (soja, maïs, moringa) recommandées.'
    ],
    hasOpenData: true,
    citationsCount: 9,
    pages: 62,
    downloads: 580,
    views: 1340,
    dateAdded: '2023-05-22',
    isFeatured: false
  },
  {
    id: 'doc-008',
    doi: '10.cntrss.bj/bio.2024.004',
    title: 'Profil de résistance aux antibiotiques des souches d\'Uropathogènes isolées au CHUD-Borgou',
    type: 'Article scientifique',
    discipline: 'Biologie médicale',
    studyDesign: 'Étude prospective',
    healthZone: 'Zone sanitaire CHUD Borgou / Alibori',
    year: 2024,
    author: 'ALLABI Sylvain & Collaborateurs',
    supervisor: 'Prof. ANAGONOU Séverin',
    institution: 'Laboratoire de Bactériologie du CHUD Borgou',
    keywords: ['Antibiogramme', 'Escherichia coli', 'BLSE', 'Infection urinaire', 'Bactériologie'],
    meshTerms: ['Drug Resistance, Microbial', 'Escherichia coli / drug effects', 'Beta-Lactamases', 'Urinary Tract Infections'],
    abstract: 'Analyse de 540 examens cytobactériologiques des urines (ECBU) consécutifs. Mise en évidence d\'une prévalence alarmante de 42% de souches sécrétrices de bêta-lactamases à spectre élargi (BLSE), avec une conservation satisfaisante de sensibilité à l\'amikacine et à la fosfomycine.',
    clinicalKeyTakeaways: [
      'Résistance supérieure à 80% aux aminopénicillines et au cotrimoxazole dans les infections urinaires communautaires.',
      'Conservation d\'une sensibilité élevée (>92%) à l\'amikacine, à la nitrofurantoïne et à la fosfomycine.',
      'Alerte sur la prescription empirique abusive de fluoroquinolones et de céphalosporines de 3e génération sans antibiogramme.'
    ],
    hasOpenData: true,
    citationsCount: 27,
    pages: 16,
    downloads: 890,
    views: 2410,
    dateAdded: '2024-02-14',
    isFeatured: false
  }
];

export const POPULAR_SEARCH_SUGGESTIONS = [
  'paludisme',
  'santé maternelle',
  'diabète',
  'nutrition',
  'santé publique',
  'hypertension',
  'CHUD Borgou',
  'FSS Cotonou'
];

export const STATS = {
  documents: 2480,
  institutions: 12,
  disciplines: 8,
  downloads: 15320,
  users: 5400
};
