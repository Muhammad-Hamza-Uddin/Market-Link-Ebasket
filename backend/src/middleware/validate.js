const AppError = require('../utils/AppError');

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validate = (rules) => (req, res, next) => {
  const errors = [];
  const body = req.body || {};

  for (const rule of rules) {
    const value = body[rule.field];

    if (rule.required && (typeof value !== 'string' || !value.trim())) {
      errors.push(`${rule.label} is required`);
      continue;
    }

    if (value === undefined || value === null || value === '') continue;

    if (typeof value !== 'string') {
      errors.push(`${rule.label} must be a string`);
      continue;
    }

    if (rule.minLength && value.trim().length < rule.minLength) {
      errors.push(`${rule.label} must contain at least ${rule.minLength} characters`);
    }

    if (rule.email && !emailPattern.test(value.trim())) {
      errors.push('Please provide a valid email');
    }
  }

  if (errors.length > 0) {
    return next(new AppError(errors.join('. '), 400));
  }

  next();
};

const registrationRules = [
  { field: 'name', label: 'Name', required: true, minLength: 2 },
  { field: 'email', label: 'Email', required: true, email: true },
  { field: 'password', label: 'Password', required: true, minLength: 6 },
  { field: 'address', label: 'Address', required: true, minLength: 3 },
  { field: 'preferredMarket', label: 'Preferred market' },
];

const farmerRegistrationRules = [
  ...registrationRules.filter((rule) => rule.field !== 'address'),
  { field: 'address', label: 'Address', required: true, minLength: 3 },
  { field: 'farmName', label: 'Farm name', required: true, minLength: 2 },
  { field: 'location', label: 'Location', required: true, minLength: 2 },
  { field: 'registrationNumber', label: 'CNIC / stall registration number', required: true, minLength: 5 },
];

const loginRules = [
  { field: 'email', label: 'Email', required: true, email: true },
  { field: 'password', label: 'Password', required: true },
];

module.exports = {
  validate,
  registrationRules,
  farmerRegistrationRules,
  loginRules,
};
