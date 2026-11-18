const { z } = require("zod");

const creerEtudiantSchema = z.object({
  matricule: z.string().trim().min(3),
  nom: z.string().trim().min(1),
  prenoms: z.string().trim().min(1),
  telephone: z.string().trim().optional(),
  email: z.string().email().optional(),
  filiere_id: z.string().uuid(),
  promotion_id: z.string().uuid(),
});

module.exports = { creerEtudiantSchema };
