export type DocumentType = 'Mémoire de licence' | 'Rapport de stage' | 'Thèse' | 'Mémoire de master' | 'Article scientifique';

export type DisciplineType =
  | 'Médecine'
  | 'Soins infirmiers'
  | 'Pharmacie'
  | 'Santé publique'
  | 'Biologie médicale'
  | 'Nutrition'
  | 'Odontostomatologie'
  | 'Kinésithérapie'
  | 'ORL'
  | 'Ophtalmologie'
  | 'Autres filières';

export type StudyDesign =
  | 'Étude transversale'
  | 'Étude cas-témoins'
  | 'Audit clinique'
  | 'Étude prospective'
  | 'Étude expérimentale'
  | 'Revue systématique';

export interface DocumentItem {
  id: string;
  doi: string; // Persistent Handle/DOI type e.g. 10.cntrss.bj/med.2023.001
  title: string;
  type: DocumentType;
  discipline: DisciplineType;
  studyDesign?: StudyDesign;
  healthZone?: string;
  year: number;
  author: string;
  supervisor?: string;
  institution: string;
  keywords: string[];
  meshTerms?: string[];
  abstract: string;
  clinicalKeyTakeaways?: string[]; // 3 actionable takeaways for healthcare field agents
  hasOpenData?: boolean; // Survey questionnaires / datasets available
  citationsCount?: number;
  pages: number;
  downloads: number;
  views: number;
  dateAdded: string;
  /** Fichier PDF de l'œuvre : réellement déposé, ou généré par le serveur. */
  fileName?: string;
  fileMime?: string;
  fileBytes?: number;
  hasFile?: boolean;
  isFeatured?: boolean;
  coverImage?: string;
  status?: 'Validé & Publié' | 'En cours de validation' | 'Archivé';
  tableOfContents?: { title: string; page: number }[];
}

export interface DisciplineMeta {
  id: DisciplineType;
  title: string;
  count: number;
  iconName: string;
  description: string;
}

export type UserRole =
  | 'Étudiant'
  | 'Enseignant-Chercheur'
  | 'Chercheur'
  | 'Bibliothécaire'
  | 'Administrateur'
  | 'Institution';

export interface ValidationItem {
  id: string;
  title: string;
  author: string;
  supervisor: string;
  type: DocumentType;
  discipline: DisciplineType;
  institution: string;
  submissionDate: string;
  status: 'En attente' | 'Validé & Publié' | 'Corrections requises' | 'Refusé';
  assignedDoi?: string;
  shelfLocation?: string; // Cote de classement physique ex: TH-MED-2024-082
  reviewNotes?: string;
  meshTerms: string[];
  fileSize: string;
  /** PDF effectivement déposé par l'auteur (transmis au catalogue à la validation). */
  fileName?: string;
  fileMime?: string;
  fileBytes?: number;
  hasFile?: boolean;
}

export interface DocumentRequestRecord {
  id: string;
  title: string;
  author?: string;
  requesterName: string;
  requesterEmail: string;
  requesterRole: string;
  institution: string;
  date: string;
  status: 'En cours de recherche' | 'Numérisé & Transmis' | 'Disponible en salle' | 'Introuvable';
  priority: 'Normale' | 'Haute' | 'Urgente (Soutenance)';
  notes?: string;
}

export interface UserAccountItem {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  institution: string;
  discipline: string;
  status: 'Actif' | 'En attente de validation' | 'Suspendu';
  joinedDate: string;
  lastLogin: string;
  thesesCount?: number;
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  userName: string;
  role: UserRole;
  action: string;
  resource: string;
  status: 'Succès' | 'Alerte' | 'Refusé';
  ipAddress: string;
}

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  institution: string;
  discipline?: string;
  studentId?: string;
  avatarLetter: string;
  avatarColor?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  source?: 'gemini' | 'academic_engine';
}

export interface DocumentSubmissionPayload {
  title: string;
  type: DocumentType;
  discipline: DisciplineType;
  studyDesign?: StudyDesign;
  healthZone?: string;
  year: number;
  author: string;
  supervisor: string;
  juryPresident?: string;
  institution: string;
  keywords: string[];
  abstract: string;
  pagesCount: number;
  hasOpenData?: boolean;
  fileName?: string;
  fileSize?: string;
}
