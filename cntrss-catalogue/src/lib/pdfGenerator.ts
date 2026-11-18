import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import type { DocumentItem } from '../types';

// Génération de véritables fichiers PDF côté serveur (module serveur uniquement).
//
// Deux usages :
//   - le document lui-même, quand aucun PDF n'a été déposé par l'auteur : le
//     catalogue ne renvoie alors plus un fichier .txt mais un vrai PDF lisible ;
//   - l'attestation officielle d'indexation et d'archivage.
//
// pdf-lib écrit en encodage WinAnsi : les caractères hors de cet encodage sont
// assainis pour ne jamais produire un PDF corrompu.

const PAGE_WIDTH = 595.28; // A4 portrait (points)
const PAGE_HEIGHT = 841.89;
const MARGIN = 56;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const INK = rgb(0.11, 0.14, 0.19);
const MUTED = rgb(0.42, 0.47, 0.53);
const TEAL = rgb(0.05, 0.46, 0.44);

/** Remplace tout caractère non représentable en WinAnsi. */
function sanitize(value: string): string {
  return String(value ?? '')
    .replace(/\u00A0/g, ' ')
    .replace(/\u202F/g, ' ')
    .replace(/[^\t\n\r\x20-\x7E\u00A1-\u00FF\u0152\u0153\u0178\u0192\u02C6\u02DC\u2013\u2014\u2018\u2019\u201A\u201C\u201D\u201E\u2020\u2021\u2022\u2026\u2030\u2039\u203A\u20AC\u2122\u0160\u0161\u017D\u017E]/g, '?');
}

/** Découpe un texte en lignes qui tiennent dans la largeur disponible. */
function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const rawLine of sanitize(text).split('\n')) {
    const words = rawLine.split(/\s+/).filter((word) => word.length > 0);
    if (!words.length) {
      lines.push('');
      continue;
    }
    let current = '';
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
        current = candidate;
        continue;
      }
      if (current) lines.push(current);
      // Un mot plus long que la ligne est découpé brutalement.
      if (font.widthOfTextAtSize(word, size) > maxWidth) {
        let chunk = '';
        for (const char of word) {
          if (font.widthOfTextAtSize(chunk + char, size) > maxWidth) {
            lines.push(chunk);
            chunk = char;
          } else {
            chunk += char;
          }
        }
        current = chunk;
      } else {
        current = word;
      }
    }
    if (current) lines.push(current);
  }
  return lines;
}

/** Petit écrivain de documents paginés (en-tête + pied de page numéroté). */
class PagedWriter {
  private constructor(
    private readonly doc: PDFDocument,
    private readonly regular: PDFFont,
    private readonly bold: PDFFont,
    private readonly footerText: string
  ) {}

  private page!: PDFPage;
  private y = 0;

  static async create(footerText: string): Promise<PagedWriter> {
    const doc = await PDFDocument.create();
    doc.setTitle(sanitize(footerText));
    doc.setProducer('CNTRSS — Catalogue numérique des travaux de recherche en sciences de santé');
    doc.setCreator('CNTRSS');
    const regular = await doc.embedFont(StandardFonts.Helvetica);
    const bold = await doc.embedFont(StandardFonts.HelveticaBold);
    const writer = new PagedWriter(doc, regular, bold, footerText);
    writer.newPage();
    return writer;
  }

  private newPage(): void {
    this.page = this.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    this.y = PAGE_HEIGHT - MARGIN;
  }

  private ensure(space: number): void {
    if (this.y - space < MARGIN + 28) this.newPage();
  }

  spacer(height = 10): void {
    this.y -= height;
  }

  rule(color = TEAL, thickness = 1.2): void {
    this.ensure(16);
    this.page.drawLine({
      start: { x: MARGIN, y: this.y },
      end: { x: PAGE_WIDTH - MARGIN, y: this.y },
      thickness,
      color
    });
    this.y -= 12;
  }

  heading(text: string, size = 15): void {
    this.ensure(size + 16);
    for (const line of wrapText(text, this.bold, size, CONTENT_WIDTH)) {
      this.page.drawText(line, { x: MARGIN, y: this.y, size, font: this.bold, color: INK });
      this.y -= size + 4;
    }
    this.y -= 4;
  }

  paragraph(text: string, options: { size?: number; color?: ReturnType<typeof rgb>; bold?: boolean; indent?: number } = {}): void {
    const size = options.size ?? 10.5;
    const font = options.bold ? this.bold : this.regular;
    const color = options.color ?? INK;
    const indent = options.indent ?? 0;
    for (const line of wrapText(text, font, size, CONTENT_WIDTH - indent)) {
      this.ensure(size + 6);
      if (line) {
        this.page.drawText(line, { x: MARGIN + indent, y: this.y, size, font, color });
      }
      this.y -= size + 4.5;
    }
  }

  keyValue(label: string, value: string): void {
    const size = 10.5;
    this.ensure(size + 6);
    this.page.drawText(sanitize(label), { x: MARGIN, y: this.y, size, font: this.bold, color: MUTED });
    const labelWidth = this.bold.widthOfTextAtSize(sanitize(label), size) + 6;
    for (const line of wrapText(value, this.regular, size, CONTENT_WIDTH - labelWidth)) {
      this.page.drawText(line, { x: MARGIN + labelWidth, y: this.y, size, font: this.regular, color: INK });
      this.y -= size + 4.5;
      this.ensure(size + 6);
    }
    this.y -= 1;
  }

  bullet(text: string): void {
    const size = 10.5;
    for (const line of wrapText(text, this.regular, size, CONTENT_WIDTH - 14)) {
      this.ensure(size + 6);
      this.page.drawText(line, { x: MARGIN + 14, y: this.y, size, font: this.regular, color: INK });
      this.y -= size + 4.5;
    }
  }

  async save(): Promise<Uint8Array> {
    const pages = this.doc.getPages();
    const stamp = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
    pages.forEach((page, index) => {
      const footer = `${this.footerText} — page ${index + 1}/${pages.length} — ${stamp}`;
      const size = 8;
      const width = this.regular.widthOfTextAtSize(sanitize(footer), size);
      page.drawText(sanitize(footer), {
        x: (PAGE_WIDTH - width) / 2,
        y: MARGIN - 22,
        size,
        font: this.regular,
        color: MUTED
      });
    });
    return this.doc.save();
  }
}

/** Couverture officielle + résumé scientifique : PDF réel du document. */
export async function buildDocumentPdf(doc: DocumentItem): Promise<Uint8Array> {
  const writer = await PagedWriter.create(
    `CNTRSS — ${doc.doi} — ${doc.title.slice(0, 70)}`
  );

  writer.paragraph('RÉPUBLIQUE DU BÉNIN · CNTRSS', { size: 9, color: TEAL, bold: true });
  writer.paragraph(
    'CATALOGUE NUMÉRIQUE DES TRAVAUX DE RECHERCHE EN SCIENCES DE SANTÉ',
    { size: 8.5, color: MUTED, bold: true }
  );
  writer.spacer(8);
  writer.rule();

  writer.heading(doc.title, 17);
  writer.paragraph(`${doc.author} — ${doc.institution} — ${doc.year}`, { size: 11, color: MUTED });
  writer.spacer(6);

  writer.keyValue('DOI pérenne :', `https://doi.org/${doc.doi}`);
  writer.keyValue('Type de document :', doc.type);
  writer.keyValue('Filière :', doc.discipline);
  if (doc.studyDesign) writer.keyValue("Devis d'étude :", doc.studyDesign);
  if (doc.healthZone) writer.keyValue('Zone sanitaire :', doc.healthZone);
  if (doc.supervisor) writer.keyValue('Directeur / superviseur :', doc.supervisor);
  writer.keyValue('Pages :', String(doc.pages));
  writer.keyValue('Dépôt au catalogue :', String(doc.dateAdded));
  writer.keyValue(
    'Données de recherche :',
    doc.hasOpenData ? 'Open Data (questionnaires / jeux de données disponibles)' : 'Non communiquées'
  );
  writer.spacer(6);
  writer.rule();

  writer.heading('Résumé scientifique', 13);
  writer.paragraph(doc.abstract || 'Résumé non communiqué.');

  if (doc.clinicalKeyTakeaways?.length) {
    writer.spacer(4);
    writer.heading('Implications pour la pratique soignante', 13);
    doc.clinicalKeyTakeaways.forEach((item) => {
      writer.bullet(`• ${item}`);
      writer.spacer(2);
    });
  }

  writer.spacer(6);
  writer.heading('Mots-clés et descripteurs', 13);
  writer.paragraph(doc.keywords.join(', ') || 'Non renseignés.');
  if (doc.meshTerms?.length) {
    writer.paragraph(doc.meshTerms.map((term) => `• ${term}`).join('\n'), { color: MUTED });
  }

  writer.spacer(10);
  writer.rule(rgb(0.8, 0.83, 0.87), 0.8);
  writer.paragraph(
    'Document diffusé par le CNTRSS dans le cadre de la licence académique ouverte non commerciale. ' +
      "Toute citation doit mentionner l'identifiant pérenne (DOI) ci-dessus.",
    { size: 8.5, color: MUTED }
  );

  return writer.save();
}

/** Attestation officielle d'indexation et d'archivage. */
export async function buildCertificatePdf(doc: DocumentItem): Promise<Uint8Array> {
  const writer = await PagedWriter.create(`CNTRSS — Attestation d'indexation — ${doc.id}`);

  writer.paragraph('RÉPUBLIQUE DU BÉNIN · CNTRSS', { size: 9, color: TEAL, bold: true });
  writer.spacer(6);
  writer.heading("Attestation officielle d'indexation et d'archivage", 17);
  writer.paragraph(
    'Certificat de dépôt légal universitaire délivré pour la soutenance et la citation académique.',
    { size: 10, color: MUTED }
  );
  writer.spacer(8);
  writer.rule();

  writer.keyValue('Auteur :', doc.author);
  writer.keyValue('Titre :', doc.title);
  writer.keyValue('Type de document :', doc.type);
  writer.keyValue('Filière :', doc.discipline);
  writer.keyValue('Institution :', doc.institution);
  writer.keyValue('Année académique :', String(doc.year));
  writer.keyValue('DOI pérenne :', `https://doi.org/${doc.doi}`);
  writer.keyValue("Sceau d'archivage :", `CERT-CNTRSS-${doc.id.toUpperCase()}`);
  writer.keyValue('Date d’indexation :', doc.dateAdded);
  writer.keyValue('Statut au catalogue :', doc.status || 'En cours de validation');

  writer.spacer(10);
  writer.paragraph(
    'Le Centre National des Travaux de Recherche en Sciences de Santé atteste que ce travail a été enregistré, ' +
      "indexé et archivé dans le catalogue numérique national. L'identifiant pérenne (DOI) attribué ci-dessus " +
      'doit être utilisé pour toute citation dans les publications et revues scientifiques.',
    { size: 10.5 }
  );

  writer.spacer(16);
  writer.rule(rgb(0.8, 0.83, 0.87), 0.8);
  writer.paragraph(
    'Attestation générée automatiquement par la plateforme CNTRSS. Sa validité peut être vérifiée à partir du DOI.',
    { size: 8.5, color: MUTED }
  );

  return writer.save();
}
