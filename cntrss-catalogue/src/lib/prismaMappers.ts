import type { Prisma } from '@prisma/client';
import type {
  DocumentItem,
  ValidationItem,
  DocumentRequestRecord,
  UserAccountItem
} from '../types';

// Le schéma Prisma stocke les listes (keywords, meshTerms, clinicalKeyTakeaways,
// ...) dans des colonnes texte au format JSON. Ces mappers centralisent la
// conversion entre les modèles applicatifs (src/types) et la base (prisma/).
//
// Ils sont partagés par server.ts (écritures API) et prisma/seed.ts (données
// initiales) afin que les deux chemins produisent exactement la même forme.

export function toJsonColumn(value: unknown): string {
  return JSON.stringify(value ?? []);
}

export function documentDbCreate(doc: DocumentItem): Prisma.DocumentCreateInput {
  return {
    id: doc.id,
    doi: doc.doi,
    title: doc.title,
    type: doc.type,
    discipline: doc.discipline,
    studyDesign: doc.studyDesign ?? null,
    healthZone: doc.healthZone ?? null,
    year: doc.year,
    author: doc.author,
    supervisor: doc.supervisor ?? null,
    institution: doc.institution,
    keywords: toJsonColumn(doc.keywords),
    meshTerms: toJsonColumn(doc.meshTerms),
    abstract: doc.abstract,
    clinicalKeyTakeaways: toJsonColumn(doc.clinicalKeyTakeaways),
    hasOpenData: doc.hasOpenData ?? false,
    citationsCount: doc.citationsCount ?? 0,
    pages: doc.pages,
    downloads: doc.downloads,
    views: doc.views,
    fileName: doc.fileName ?? null,
    fileMime: doc.fileMime ?? null,
    fileBytes: doc.fileBytes ?? null,
    dateAdded: doc.dateAdded,
    status: doc.status ?? 'En cours de validation',
    isFeatured: doc.isFeatured ?? false
  };
}

export function documentDbUpdate(doc: DocumentItem): Prisma.DocumentUpdateInput {
  const { id: _id, ...rest } = documentDbCreate(doc);
  return rest;
}

export function validationDbCreate(item: ValidationItem): Prisma.ValidationCreateInput {
  return {
    id: item.id,
    title: item.title,
    author: item.author,
    supervisor: item.supervisor,
    type: item.type,
    discipline: item.discipline,
    institution: item.institution,
    submissionDate: item.submissionDate,
    status: item.status,
    assignedDoi: item.assignedDoi ?? null,
    shelfLocation: item.shelfLocation ?? null,
    reviewNotes: item.reviewNotes ?? null,
    meshTerms: toJsonColumn(item.meshTerms),
    fileSize: item.fileSize ?? null,
    fileName: item.fileName ?? null,
    fileMime: item.fileMime ?? null,
    fileBytes: item.fileBytes ?? null
  };
}

export function validationDbUpdate(item: ValidationItem): Prisma.ValidationUpdateInput {
  const { id: _id, ...rest } = validationDbCreate(item);
  return rest;
}

export function requestDbCreate(record: DocumentRequestRecord): Prisma.DocumentRequestCreateInput {
  return {
    id: record.id,
    title: record.title,
    author: record.author ?? null,
    requesterName: record.requesterName,
    requesterEmail: record.requesterEmail,
    requesterRole: record.requesterRole,
    institution: record.institution,
    date: record.date,
    status: record.status,
    priority: record.priority,
    notes: record.notes ?? null
  };
}

export function requestDbUpdate(record: DocumentRequestRecord): Prisma.DocumentRequestUpdateInput {
  const { id: _id, ...rest } = requestDbCreate(record);
  return rest;
}

export function userAccountDbCreate(
  user: UserAccountItem,
  passwordHash: string
): Prisma.UserAccountCreateInput {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    institution: user.institution,
    discipline: user.discipline,
    passwordHash,
    status: user.status,
    joinedDate: user.joinedDate,
    lastLogin: user.lastLogin,
    thesesCount: user.thesesCount ?? 0
  };
}
