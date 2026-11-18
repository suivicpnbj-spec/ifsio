const { AppError } = require("./errorHandler");

/**
 * Valide req.body (par défaut) contre un schéma Zod.
 * Usage : router.post("/x", validate(monSchema), handler)
 */
function validate(schema, source = "body") {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const details = result.error.issues.map((i) => ({
        champ: i.path.join("."),
        message: i.message,
      }));
      const err = new AppError("Données invalides.", 422, "VALIDATION_ECHOUEE");
      err.details = details;
      return next(err);
    }
    req[source] = result.data;
    next();
  };
}

module.exports = { validate };
