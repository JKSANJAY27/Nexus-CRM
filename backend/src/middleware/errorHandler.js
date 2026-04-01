const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  if (err.type === 'validation') {
    return res.status(400).json({ error: err.message, details: err.details });
  }

  // PostgreSQL unique violation
  if (err.code === '23505') {
    return res.status(409).json({ error: 'Resource already exists' });
  }

  // PostgreSQL foreign key violation
  if (err.code === '23503') {
    return res.status(400).json({ error: 'Referenced resource not found' });
  }

  const status  = err.status || 500;
  const message = status < 500 ? err.message : 'Internal server error';
  res.status(status).json({ error: message });
};

module.exports = errorHandler;
