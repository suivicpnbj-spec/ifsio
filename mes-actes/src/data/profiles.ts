import type { AdminProfile, StudentProfile } from '@/types'

/**
 * Profils par défaut utilisés uniquement comme placeholders anonymes avant
 * le premier chargement (aucun dossier, aucune donnée de démonstration : les
 * comptes de test sont créés par les parcours de test ou par inscription).
 */
export const DEFAULT_STUDENT: StudentProfile = {
  id: 'student-000',
  firstName: 'Étudiant',
  lastName: '',
  initials: 'É',
  matricule: '',
  promotion: '',
  filiere: '',
  email: '',
  phone: '',
  role: 'Étudiant',
  smsAlerts: true,
  emailAlerts: true,
}

export const DEFAULT_ADMIN: AdminProfile = {
  id: 'admin-000',
  firstName: 'Scolarité',
  lastName: '',
  role: 'Responsable de la Scolarité & des Actes Académiques',
  department: 'Direction des Affaires Académiques',
  email: '',
  phone: '',
  office: '',
}
