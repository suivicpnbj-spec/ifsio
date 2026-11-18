import type { Establishment } from '@/types'

/**
 * Établissement par défaut — ces valeurs sont éditables par l’administration
 * depuis « Paramètres ».
 */
export const DEFAULT_ESTABLISHMENT: Establishment = {
  name: "Institut de Formation en Soins Infirmiers et Obstétricaux",
  shortName: 'IFSIO',
  university: 'Université de Parakou',
  ministry: "Ministère de l'Enseignement Supérieur et de la Recherche Scientifique",
  country: 'République du Bénin',
  motto: 'Fraternité — Justice — Travail',
  address: 'Campus Universitaire de Parakou, Bâtiment Scolarité',
  phone: '+229 23 61 02 84',
  email: 'scolarite@ifsio.up.bj',
  website: 'actes.ifsio.up.bj',
  currency: 'FCFA',
  registrarTitle: "Direction des Affaires Académiques, des Examens et de la Scolarité",
  filieres: [
    'Licence Professionnelle en Soins Infirmiers',
    'Licence Professionnelle en Soins Obstétricaux',
  ],
  signatories: [
    "Le Directeur de l'IFSIO",
    "La Directrice de l'École Supérieure des Infirmiers et Infirmières d'État",
    "Le Directeur de l'École Supérieure des Sages-Femmes d'État",
  ],
  verificationBaseUrl: 'actes.ifsio.up.bj/verifier',
}

export const CATEGORY_LABELS: Record<string, string> = {
  scolarite: 'Scolarité',
  resultats: 'Résultats',
  diplomes: 'Diplômes',
  soutenance: 'Soutenance',
  stages: 'Validations & stages',
  formation: 'Formation & ressources',
  reclamations: 'Réclamations',
  memoires: 'Mémoires & rapports',
  autres: 'Autres démarches',
}
