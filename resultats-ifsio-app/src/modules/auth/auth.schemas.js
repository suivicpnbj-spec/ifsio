const { z } = require("zod");

const loginEtudiantSchema = z.object({
  matricule: z.string().trim().min(3, "Le matricule est requis."),
  mot_de_passe: z.string().min(1, "Le mot de passe est requis."),
});

const loginScolariteSchema = z.object({
  email: z.string().email("Adresse email invalide."),
  mot_de_passe: z.string().min(1, "Le mot de passe est requis."),
});

const changerMotDePasseSchema = z.object({
  ancien_mot_de_passe: z.string().min(1, "L'ancien mot de passe est requis."),
  nouveau_mot_de_passe: z
    .string()
    .min(8, "Le nouveau mot de passe doit contenir au moins 8 caractères."),
});

module.exports = { loginEtudiantSchema, loginScolariteSchema, changerMotDePasseSchema };
