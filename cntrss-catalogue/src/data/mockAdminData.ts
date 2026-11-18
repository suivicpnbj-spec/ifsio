import { ValidationItem, DocumentRequestRecord, UserAccountItem, AuditLogItem } from '../types';

export const INITIAL_VALIDATION_QUEUE: ValidationItem[] = [
  {
    id: 'val-001',
    title: 'Surveillance sentinelle de l\'antibiorésistance des entérobactéries au CHUD Borgou',
    author: 'KOUKE S. Arnaud',
    supervisor: 'Pr. AGOSSOU Médard (FSS Cotonou)',
    type: 'Thèse',
    discipline: 'Biologie médicale',
    institution: 'Université de Parakou - Faculté de Médecine',
    submissionDate: '13 Oct 2026',
    status: 'En attente',
    assignedDoi: '10.cntrss.bj/bio.2026.041',
    shelfLocation: 'COTE: UP-MED-2026-T14',
    meshTerms: ['Enterobacteriaceae / drug effects', 'Anti-Bacterial Agents / pharmacology', 'Drug Resistance, Multiple, Bacterial', 'Benin'],
    fileSize: '14.2 Mo',
    reviewNotes: 'Mémoire complet avec protocole antibiogramme validé par le chef de service laboratoire.'
  },
  {
    id: 'val-002',
    title: 'Facteurs de morbi-mortalité néonatale précoce en zone rurale de Nikki',
    author: 'TOSSOU Bernice',
    supervisor: 'Dr. SEIDOU A. Moustapha',
    type: 'Mémoire de master',
    discipline: 'Soins infirmiers',
    institution: 'Institut National Médico-Sanitaire (INMeS)',
    submissionDate: '12 Oct 2026',
    status: 'En attente',
    assignedDoi: '10.cntrss.bj/inf.2026.088',
    shelfLocation: 'COTE: INMES-PAR-2026-M09',
    meshTerms: ['Infant, Newborn, Diseases / mortality', 'Rural Health Services', 'Prenatal Care', 'Benin'],
    fileSize: '8.7 Mo',
    reviewNotes: 'Comprend données d\'enquête sur 210 dossiers néonataux.'
  },
  {
    id: 'val-003',
    title: 'Prévalence et déterminants de l\'éclampsie chez les adolescentes au CHD Ouémé',
    author: 'AHOMADEGBE Reine',
    supervisor: 'Pr. HOUNNOU Daniel',
    type: 'Thèse',
    discipline: 'Médecine',
    institution: 'Faculté des Sciences de la Santé (FSS Cotonou)',
    submissionDate: '10 Oct 2026',
    status: 'Corrections requises',
    assignedDoi: '10.cntrss.bj/med.2026.102',
    shelfLocation: 'COTE: FSS-COT-2026-T88',
    meshTerms: ['Eclampsia / epidemiology', 'Pregnancy in Adolescence', 'Hypertension, Pregnancy-Induced', 'Maternal Mortality'],
    fileSize: '11.5 Mo',
    reviewNotes: 'Prière d\'harmoniser les références bibliographiques au style Vancouver (actuellement mixte Vancouver/APA).'
  },
  {
    id: 'val-004',
    title: 'Impact de la chimiothérapie du paludisme saisonnier (CPS) chez les enfants de 3 à 59 mois',
    author: 'GBAGUIDI Romaric',
    supervisor: 'Dr. ADEGOKE Félicien',
    type: 'Mémoire de licence',
    discipline: 'Santé publique',
    institution: 'Institut Régional de Santé Publique (IRSP Ouidah)',
    submissionDate: '08 Oct 2026',
    status: 'Validé & Publié',
    assignedDoi: '10.cntrss.bj/pub.2026.019',
    shelfLocation: 'COTE: IRSP-OUI-2026-L03',
    meshTerms: ['Malaria / prevention & control', 'Antimalarials / administration & dosage', 'Child Health Services', 'Benin'],
    fileSize: '6.4 Mo',
    reviewNotes: 'Exemplaire validé par le comité d\'indexation nationale. Fichier PDF certifié et versé au dépôt ouvert.'
  }
];

export const INITIAL_DOCUMENT_REQUESTS: DocumentRequestRecord[] = [
  {
    id: 'req-001',
    title: 'Étude rétrospective sur la fièvre typhoïde avec perforation iléale (1998-2005)',
    author: 'Dr. HOUNKPATI Lucien',
    requesterName: 'AKPO Laurel Aymeric',
    requesterEmail: 'aymericakpo2@gmail.com',
    requesterRole: 'Étudiant en Médecine',
    institution: 'Université de Parakou',
    date: '13 Oct 2026',
    status: 'En cours de recherche',
    priority: 'Urgente (Soutenance)',
    notes: 'Document papier localisé aux archives historiques de la faculté. En attente de numérisation haute définition.'
  },
  {
    id: 'req-002',
    title: 'Rapport d\'évaluation du programme élargi de vaccination (PEV) dans l\'Alibori',
    author: 'Ministère de la Santé / OMS',
    requesterName: 'Dr. CHABI Y. Marcelline',
    requesterEmail: 'm.chabi@univ-parakou.bj',
    requesterRole: 'Enseignant-Chercheur',
    institution: 'Université de Parakou',
    date: '11 Oct 2026',
    status: 'Numérisé & Transmis',
    priority: 'Haute',
    notes: 'Document numérisé (84 pages) et transmis par lien sécurisé avec filigrane CNTRSS.'
  },
  {
    id: 'req-003',
    title: 'Audit clinique des césariennes de sauvetage en milieu semi-urbain',
    author: 'KPADONOU S. Marius',
    requesterName: 'BIO GOURO Fatima',
    requesterEmail: 'f.biogouro@etudiant.bj',
    requesterRole: 'Étudiante Master',
    institution: 'INMeS Cotonou',
    date: '09 Oct 2026',
    status: 'Disponible en salle',
    priority: 'Normale',
    notes: 'Consultable en salle de lecture, salle des thèses n°2, rayon chirurgie obstétricale.'
  }
];

export const INITIAL_USER_ACCOUNTS: UserAccountItem[] = [
  {
    id: 'usr-001',
    fullName: 'AKPO Laurel Aymeric',
    email: 'aymericakpo2@gmail.com',
    role: 'Étudiant',
    institution: 'Université de Parakou (Faculté de Médecine)',
    discipline: 'Médecine',
    status: 'Actif',
    joinedDate: '01 Oct 2026',
    lastLogin: 'Aujourd\'hui, 13:40',
    thesesCount: 1
  },
  {
    id: 'usr-002',
    fullName: 'Dr. CHABI Y. Marcelline',
    email: 'm.chabi@univ-parakou.bj',
    role: 'Enseignant-Chercheur',
    institution: 'Université de Parakou (Sciences de la Santé)',
    discipline: 'Soins infirmiers',
    status: 'Actif',
    joinedDate: '15 Sep 2026',
    lastLogin: 'Hier, 18:22',
    thesesCount: 8
  },
  {
    id: 'usr-003',
    fullName: 'M. BIO K. Saliou',
    email: 'biblio@cntrss.bj',
    role: 'Bibliothécaire',
    institution: 'Bibliothèque Universitaire Centrale & CHUD',
    discipline: 'Santé publique',
    status: 'Actif',
    joinedDate: '01 Sep 2026',
    lastLogin: 'Aujourd\'hui, 08:15',
    thesesCount: 0
  },
  {
    id: 'usr-004',
    fullName: 'Pr. ADOVOEKPE Germain',
    email: 'admin@cntrss.bj',
    role: 'Administrateur',
    institution: 'Direction Nationale CNTRSS / Ministère de la Santé',
    discipline: 'Santé publique',
    status: 'Actif',
    joinedDate: '15 Aoû 2026',
    lastLogin: 'Aujourd\'hui, 13:00',
    thesesCount: 14
  },
  {
    id: 'usr-005',
    fullName: 'Dr. SOUROU Patrice',
    email: 'p.sourou@fss-uac.bj',
    role: 'Enseignant-Chercheur',
    institution: 'Faculté des Sciences de la Santé (FSS Cotonou)',
    discipline: 'Pharmacie',
    status: 'Actif',
    joinedDate: '20 Sep 2026',
    lastLogin: 'Il y a 3 jours',
    thesesCount: 5
  },
  {
    id: 'usr-006',
    fullName: 'KOUKE S. Arnaud',
    email: 'a.kouke@etudiant.up.bj',
    role: 'Étudiant',
    institution: 'Université de Parakou',
    discipline: 'Biologie médicale',
    status: 'En attente de validation',
    joinedDate: '13 Oct 2026',
    lastLogin: 'Aujourd\'hui, 11:30',
    thesesCount: 1
  }
];

export const INITIAL_AUDIT_LOGS: AuditLogItem[] = [
  {
    id: 'log-001',
    timestamp: '13 Oct 2026, 13:42:10',
    userName: 'AKPO Laurel Aymeric',
    role: 'Étudiant',
    action: 'Téléchargement plein texte PDF (Données ouvertes)',
    resource: '10.cntrss.bj/med.2023.001 - Paludisme congénital',
    status: 'Succès',
    ipAddress: '197.234.221.45 (Cotonou, Bénin)'
  },
  {
    id: 'log-002',
    timestamp: '13 Oct 2026, 13:30:18',
    userName: 'AKPO Laurel Aymeric',
    role: 'Étudiant',
    action: 'Requête Assistant IA (Calcul échantillon Schwartz)',
    resource: 'Module Gemini 3.8 Flash /api/assistant/chat',
    status: 'Succès',
    ipAddress: '197.234.221.45 (Cotonou, Bénin)'
  },
  {
    id: 'log-003',
    timestamp: '13 Oct 2026, 12:15:00',
    userName: 'M. BIO K. Saliou',
    role: 'Bibliothécaire',
    action: 'Validation académique & attribution DOI pérenne',
    resource: '10.cntrss.bj/bio.2026.041 - Antibiorésistance',
    status: 'Succès',
    ipAddress: '41.85.160.12 (Parakou, Bénin)'
  },
  {
    id: 'log-004',
    timestamp: '13 Oct 2026, 09:05:44',
    userName: 'Visiteur non identifié',
    role: 'Étudiant',
    action: 'Tentative d\'accès direct au catalogue sans compte',
    resource: 'Route /catalogue (Gating authentification déclenché)',
    status: 'Alerte',
    ipAddress: '102.164.88.19 (Porto-Novo, Bénin)'
  },
  {
    id: 'log-005',
    timestamp: '12 Oct 2026, 17:40:22',
    userName: 'Pr. ADOVOEKPE Germain',
    role: 'Administrateur',
    action: 'Mise à jour des quotas IA et politique Open Data',
    resource: 'Paramètres globaux CNTRSS',
    status: 'Succès',
    ipAddress: '197.234.220.10 (Cotonou, Bénin)'
  }
];

export const SYSTEM_METRICS = {
  serverStatus: 'Opérationnel (En ligne)',
  uptime: '99.98%',
  geminiApiStatus: 'Connecté (Gemini 3.8 Flash)',
  tokensConsumedToday: 42850,
  dailyTokenQuota: 1000000,
  activeSessions: 184,
  totalSubmissionsInReview: 3,
  totalApprovedTheses: 2480,
  partnerInstitutionsCount: 12,
  databaseStorage: '14.8 Go / 100 Go'
};
