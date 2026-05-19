export const notFound = (req, _res, next) => {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`)
  error.statusCode = 404
  next(error)
}

export const errorHandler = (error, _req, res, _next) => {
  const statusCode = error.statusCode || 500
  const message = statusCode === 500 ? 'Internal server error' : error.message

  if (statusCode === 500) {
    console.error(error)
  }

  res.status(statusCode).json({
    message,
  })
}
