const prisma = require('../config/prisma');
const { verifyToken } = require('../utils/jwt');
const { errorResponse } = require('../utils/response');

/**
 * Middleware to authenticate requests via JWT
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'Authentication token missing or invalid format', 401);
    }

    const token = authHeader.split(' ')[1];
    let decoded;

    try {
      decoded = verifyToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return errorResponse(res, 'Authentication token has expired. Please log in again.', 401);
      }
      return errorResponse(res, 'Invalid authentication token.', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        teacherProfile: true,
        guardianProfile: true,
      },
    });

    if (!user || !user.isActive) {
      return errorResponse(res, 'User account is inactive or no longer exists.', 401);
    }

    // Attach user information to request
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      teacherProfile: user.teacherProfile,
      guardianProfile: user.guardianProfile,
    };

    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return errorResponse(res, 'Internal authentication error', 500);
  }
};

/**
 * Middleware to authorize requests based on user role(s)
 * @param  {...string} roles Allowed roles (e.g. 'ADMIN', 'TEACHER', 'GUARDIAN')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Unauthenticated request', 401);
    }

    if (!roles.includes(req.user.role)) {
      return errorResponse(
        res,
        `Forbidden: Role '${req.user.role}' is not authorized to perform this operation.`,
        403
      );
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorize,
};
