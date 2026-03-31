const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  // Validation errors from express-validator
  if (err.type === 'validation') {
    return res.status(400).json({ error: err.message, details: err.details });
  }

  // SQLite / PostgreSQL unique violation
  if (err.code === '23505' || (err.code === 'SQLITE_CONSTRAINT' && err.message.includes('UNIQUE'))) {
    return res.status(409).json({ error: 'Resource already exists' });
  }

  // SQLite / PostgreSQL foreign key violation
  if (err.code === '23503' || (err.code === 'SQLITE_CONSTRAINT' && err.message.includes('FOREIGN KEY'))) {
    return res.status(400).json({ error: 'Referenced resource not found' });
  }

  const status  = err.status || 500;
  const message = status < 500 ? err.message : 'Internal server error';
  res.status(status).json({ error: message });
};

module.exports = errorHandler;
