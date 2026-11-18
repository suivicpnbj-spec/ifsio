class AppError extends Error {
  constructor(message, statusCode = 400, code = "ERREUR") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

function notFoundHandler(req, res, next) {
  next(new AppError(`Route introuvable : ${req.method} ${req.originalUrl}`, 404, "ROUTE_INTROUVABLE"));
}

function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  const statusCode = err.statusCode || 500;
  const code = err.code || "ERREUR_INTERNE";

  if (statusCode >= 500) {
    console.error("[erreur]", err);
  }

  res.status(statusCode).json({
    erreur: {
      code,
      message: statusCode >= 500 ? "Une erreur interne est survenue." : err.message,
      details: err.details || undefined,
    },
  });
}

module.exports = { AppError, notFoundHandler, errorHandler };
