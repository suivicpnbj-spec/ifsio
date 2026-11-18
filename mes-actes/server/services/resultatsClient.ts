import crypto from 'node:crypto'
import { config } from '../config'

export interface DeliberationSemestre {
  semestre_numero: number
  annee_academique: string
  moyenne: number | null
  decision: string
  credits_semestre: number
  statut_publication: string
  date_deliberation?: string | null
}

export interface DeliberationResultat {
  statut: 'success' | 'error'
  etudiant: {
    id: string
    matricule: string
    nom: string
    prenoms: string
    filiere_code: string
    filiere_libelle: string
    niveau: string
    annee_entree: number
    statut_etudiant: string
  }
  deliberation: {
    admissible: boolean
    decision_jury: string
    moyenne_generale: number | null
    mention: string
    credits_ects_valides: number
    credits_ects_requis: number
    semestres_valides: number
    nombre_semestres: number
    date_deliberation: string
  }
  semestres: DeliberationSemestre[]
  securite: {
    source: string
    scelle_hmac: string
    horodatage: string
  }
}

export interface VerificationEligibilite {
  eligible: boolean
  exigeVerification: boolean
  message: string
  deliberation?: DeliberationResultat['deliberation']
  etudiant?: DeliberationResultat['etudiant']
  securite?: DeliberationResultat['securite']
}

const ACTES_EXIGEANT_DELIBERATION = new Set([
  'attestation-reussite',
  'attestation-diplome',
  'diplome-formation',
  'releve-notes',
  'attestation-validation-semestre',
  'attestation-validation-ue'
])

export class ResultatsClient {
  private readonly apiUrl: string
  private readonly secret: string

  constructor(apiUrl = config.resultatsApiUrl, secret = config.campusInternalSecret) {
    this.apiUrl = apiUrl.replace(/\/$/, '')
    this.secret = secret
  }

  /**
   * Interroge l'API interne d'eRésultats pour récupérer l'avis officiel de délibération.
   */
  async obtenirAdmissibilite(matricule: string): Promise<DeliberationResultat | null> {
    const cleanMatricule = String(matricule || '').trim()
    if (!cleanMatricule) return null

    try {
      const targetUrl = `${this.apiUrl}/api/interne/admissibilite/${encodeURIComponent(cleanMatricule)}`
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 4000)

      const res = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-Internal-Secret': this.secret,
        },
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      if (res.status === 404) {
        return null
      }

      if (!res.ok) {
        console.warn(`[resultatsClient] Réponse inattendue de l'API eRésultats (${res.status})`)
        return null
      }

      const data = (await res.json()) as DeliberationResultat

      // Vérification d'intégrité de la réponse via HMAC
      if (data?.securite?.scelle_hmac && data?.etudiant) {
        const hashData = `${data.etudiant.matricule}|${data.etudiant.nom}|${data.etudiant.prenoms}|${data.deliberation.admissible}|${data.deliberation.moyenne_generale}|${data.deliberation.credits_ects_valides}`
        const expectedHmac = crypto.createHmac('sha256', this.secret).update(hashData).digest('hex')
        if (expectedHmac !== data.securite.scelle_hmac) {
          console.error('[resultatsClient] ⚠️ Échec de vérification du scellé HMAC des résultats !')
          return null
        }
      }

      return data
    } catch (err: any) {
      console.warn(`[resultatsClient] Connexion à eRésultats impossible (${err.message})`)
      return null
    }
  }

  /**
   * Vérifie l'éligibilité d'un étudiant pour un acte spécifique.
   */
  async verifierEligibilite(actId: string, matricule: string): Promise<VerificationEligibilite> {
    const cleanActId = String(actId || '').trim()
    const cleanMatricule = String(matricule || '').trim()

    const exigeDeliberation = ACTES_EXIGEANT_DELIBERATION.has(cleanActId)
    if (!exigeDeliberation) {
      return {
        eligible: true,
        exigeVerification: false,
        message: 'Acte administratif standard : délivrance selon inscription régulière.'
      }
    }

    if (!cleanMatricule) {
      return {
        eligible: false,
        exigeVerification: true,
        message: 'Un matricule étudiant valide est requis pour vérifier l’admissibilité.'
      }
    }

    const data = await this.obtenirAdmissibilite(cleanMatricule)
    if (!data) {
      // Si la base eRésultats n'a pas encore ce matricule ou est injoignable en démo locale
      return {
        eligible: true, // Autorise en mode déclaratif avec visa administratif
        exigeVerification: true,
        message: 'Matricule non synchronisé avec le registre numérique : instruction manuelle par la scolarité.'
      }
    }

    if (data.deliberation.admissible) {
      return {
        eligible: true,
        exigeVerification: true,
        message: `Admissibilité certifiée par le jury (${data.deliberation.mention}, ${data.deliberation.credits_ects_valides} crédits validés).`,
        deliberation: data.deliberation,
        etudiant: data.etudiant,
        securite: data.securite
      }
    }

    return {
      eligible: false,
      exigeVerification: true,
      message: `Étudiant non admissible (décision : ${data.deliberation.decision_jury}, crédits acquis : ${data.deliberation.credits_ects_valides}/${data.deliberation.credits_ects_requis}).`,
      deliberation: data.deliberation,
      etudiant: data.etudiant,
      securite: data.securite
    }
  }
}

export const resultatsClient = new ResultatsClient()
