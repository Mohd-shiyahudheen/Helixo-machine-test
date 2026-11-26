export function errorHandler(err, req, res, next) {
  console.error(err);
  const status =
    err.statusCode ||
    (err.name === "ValidationError" || err.name === "CastError" ? 400 : 500);
  res.status(status).json({
    error: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
}
