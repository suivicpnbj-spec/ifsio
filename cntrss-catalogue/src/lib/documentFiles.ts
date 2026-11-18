import { apiRequest, currentCsrfToken } from './backendApi';

// Fichiers PDF côté navigateur.
//
// Les dépôts sont envoyés en corps binaire (application/pdf) au serveur, qui
// vérifie la signature du fichier avant de l'enregistrer. Les téléchargements
// passent par l'API authentifiée : le compteur correspondant est incrémenté
// côté serveur, puis le PDF réel est rendu au navigateur.

export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024; // 15 Mo (MAX_UPLOAD_BYTES serveur)

export interface UploadedFileInfo {
  fileName: string;
  fileBytes: number;
  fileSize: string;
  hasFile: boolean;
}

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 octet';
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} Mo`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${bytes} octets`;
}

/** Un fichier utilisable comme dépôt PDF ? (type MIME ou extension). */
export function isPdfFile(file: File): boolean {
  return file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
}

async function readErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const data = (await res.json()) as { error?: string };
    if (data?.error) return data.error;
  } catch {
    // Réponse non JSON : on garde le message générique.
  }
  return fallback;
}

/** Envoie le PDF de l'auteur pour un dossier de dépôt (identifiant de validation). */
export async function uploadSubmissionFile(
  submissionId: string,
  file: File
): Promise<UploadedFileInfo> {
  if (!isPdfFile(file)) {
    throw new Error("Seuls les fichiers PDF sont acceptés pour le dépôt d'un mémoire.");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(
      `Fichier trop volumineux (${formatFileSize(file.size)}) : ${Math.round(
        MAX_UPLOAD_BYTES / (1024 * 1024)
      )} Mo maximum.`
    );
  }

  const csrf = currentCsrfToken();
  const res = await fetch(`/api/submissions/${encodeURIComponent(submissionId)}/file`, {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/pdf',
      'x-file-name': encodeURIComponent(file.name),
      ...(csrf ? { 'x-csrf-token': csrf } : {})
    },
    body: file
  });

  if (!res.ok) {
    throw new Error(
      await readErrorMessage(res, `Enregistrement du fichier impossible (${res.status}).`)
    );
  }

  return (await res.json()) as UploadedFileInfo;
}

async function downloadPdf(url: string, fallbackName: string): Promise<string> {
  const res = await fetch(url, {
    credentials: 'same-origin',
    headers: { Accept: 'application/pdf' }
  });

  if (!res.ok) {
    throw new Error(await readErrorMessage(res, `Téléchargement impossible (${res.status}).`));
  }

  const blob = await res.blob();
  const disposition = res.headers.get('content-disposition') || '';
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition);
  const fileName = match?.[1] ? decodeURIComponent(match[1]) : fallbackName;

  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);

  return fileName;
}

/** Télécharge le vrai PDF du document (déposé par l'auteur, sinon généré). */
export function downloadDocumentPdf(documentId: string): Promise<string> {
  return downloadPdf(
    `/api/documents/${encodeURIComponent(documentId)}/download`,
    `CNTRSS_${documentId}.pdf`
  );
}

/** Télécharge l'attestation officielle d'indexation (véritable PDF). */
export function downloadDocumentCertificate(documentId: string): Promise<string> {
  return downloadPdf(
    `/api/documents/${encodeURIComponent(documentId)}/certificate`,
    `Attestation_CNTRSS_${documentId}.pdf`
  );
}

/** Enregistre une consultation du document (compteur « vues » du catalogue). */
export async function registerDocumentView(documentId: string): Promise<number | null> {
  try {
    const data = await apiRequest<{ ok: boolean; views: number }>(
      `/api/documents/${encodeURIComponent(documentId)}/view`,
      { method: 'POST' }
    );
    return typeof data.views === 'number' ? data.views : null;
  } catch {
    // Les statistiques ne doivent jamais empêcher la lecture du document.
    return null;
  }
}
