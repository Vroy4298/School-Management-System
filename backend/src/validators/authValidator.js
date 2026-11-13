const { errorResponse } = require('../utils/response');

const validateLoginInput = (req, res, next) => {
  const { email, password } = req.body;
  const errors = {};

  if (!email || typeof email !== 'string' || !email.trim()) {
    errors.email = 'Email address is required.';
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      errors.email = 'Please provide a valid email address.';
    }
  }

  if (!password || typeof password !== 'string' || !password.trim()) {
    errors.password = 'Password is required.';
  }

  if (Object.keys(errors).length > 0) {
    return errorResponse(res, 'Validation failed. Please correct the highlighted errors.', 400, errors);
  }

  next();
};

module.exports = {
  validateLoginInput,
};
