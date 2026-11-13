const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const { generateToken } = require('../utils/jwt');
const { successResponse, errorResponse } = require('../utils/response');
const { logAudit } = require('../services/auditService');

/**
 * Handle User Login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      include: {
        teacherProfile: true,
        guardianProfile: true,
      },
    });

    if (!user) {
      return errorResponse(res, 'Invalid email or password credentials.', 401);
    }

    if (!user.isActive) {
      return errorResponse(res, 'This account has been disabled. Please contact the administrator.', 403);
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return errorResponse(res, 'Invalid email or password credentials.', 401);
    }

    // Generate JWT
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // Write audit log
    await logAudit({
      userId: user.id,
      userRole: user.role,
      action: 'USER_LOGIN',
      entity: 'User',
      entityId: user.id,
      details: { email: user.email, role: user.role },
      ipAddress: clientIp,
    });

    const userPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone,
      teacherProfile: user.teacherProfile || null,
      guardianProfile: user.guardianProfile || null,
    };

    return successResponse(res, { token, user: userPayload }, 'Login successful');
  } catch (err) {
    next(err);
  }
};

/**
 * Get current authenticated user profile
 */
const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        createdAt: true,
        teacherProfile: true,
        guardianProfile: {
          include: {
            students: {
              include: {
                class: true,
                section: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return errorResponse(res, 'User not found.', 404);
    }

    return successResponse(res, { user }, 'User profile retrieved successfully');
  } catch (err) {
    next(err);
  }
};

/**
 * Handle User Logout
 */
const logout = async (req, res, next) => {
  try {
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    await logAudit({
      userId: req.user.id,
      userRole: req.user.role,
      action: 'USER_LOGOUT',
      entity: 'User',
      entityId: req.user.id,
      details: { email: req.user.email },
      ipAddress: clientIp,
    });

    return successResponse(res, null, 'Logged out successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  login,
  getMe,
  logout,
};
