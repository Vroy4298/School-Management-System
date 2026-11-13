const { errorResponse } = require('../utils/response');

const errorHandler = (err, req, res, next) => {
  console.error('API Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.originalUrl,
    method: req.method,
  });

  // Handle Prisma unique constraint violation (P2002)
  if (err.code === 'P2002') {
    const fields = err.meta?.target ? err.meta.target.join(', ') : 'field';
    return errorResponse(res, `A record with this ${fields} already exists.`, 409, {
      code: 'UNIQUE_CONSTRAINT_VIOLATION',
      fields: err.meta?.target,
    });
  }

  // Handle Prisma record not found (P2025)
  if (err.code === 'P2025') {
    return errorResponse(res, err.meta?.cause || 'Requested resource was not found.', 404);
  }

  // Handle Prisma foreign key constraint violation (P2003)
  if (err.code === 'P2003') {
    return errorResponse(res, 'Referenced record does not exist or cannot be modified.', 400, {
      code: 'FOREIGN_KEY_VIOLATION',
      field: err.meta?.field_name,
    });
  }

  // Handle malformed JSON request bodies
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return errorResponse(res, 'Malformed JSON payload in request body.', 400);
  }

  // Custom application error with specified status code
  if (err.statusCode) {
    return errorResponse(res, err.message, err.statusCode, err.errors);
  }

  // Fallback 500 error
  return errorResponse(
    res,
    process.env.NODE_ENV === 'production'
      ? 'An unexpected internal error occurred on the server.'
      : err.message,
    500
  );
};

module.exports = errorHandler;
