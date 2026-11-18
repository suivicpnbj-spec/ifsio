const { z } = require("zod");

const saisirNoteSchema = z.object({
  etudiant_id: z.string().uuid("Identifiant étudiant invalide."),
  matiere_id: z.string().uuid("Identifiant matière invalide."),
  valeur: z.number().min(0, "La note ne peut pas être négative.").max(20, "La note ne peut pas dépasser 20."),
  session: z.enum(["normale", "rattrapage"]).default("normale"),
});

const saisirNotesLotSchema = z.object({
  notes: z.array(saisirNoteSchema).min(1, "Au moins une note est requise."),
});

const changerStatutSchema = z.object({
  semestre_id: z.string().uuid("Identifiant semestre invalide."),
  promotion_id: z.string().uuid("Identifiant promotion invalide."),
});

module.exports = { saisirNoteSchema, saisirNotesLotSchema, changerStatutSchema };
