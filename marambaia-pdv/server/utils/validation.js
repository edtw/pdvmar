// utils/validation.js
// BUG FIX #6: Utility functions for input validation and sanitization

/**
 * Validate and sanitize date query parameters to prevent NoSQL injection
 */
function validateDateParam(dateParam, paramName = 'date') {
  if (!dateParam) return null;

  // Ensure it's a string
  if (typeof dateParam !== 'string') {
    throw new Error(`${paramName} must be a string`);
  }

  // Try to parse as date
  const date = new Date(dateParam);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid ${paramName} format`);
  }

  return date;
}

/**
 * Validate MongoDB ObjectId to prevent injection
 */
function validateObjectId(id, paramName = 'id') {
  if (!id) return null;

  // Ensure it's a string
  if (typeof id !== 'string') {
    throw new Error(`${paramName} must be a string`);
  }

  // Check ObjectId format (24 hex characters)
  if (!/^[0-9a-fA-F]{24}$/.test(id)) {
    throw new Error(`Invalid ${paramName} format`);
  }

  return id;
}

/**
 * Sanitize query object to prevent NoSQL injection
 */
function sanitizeQuery(query) {
  const sanitized = {};

  for (const [key, value] of Object.entries(query)) {
    // Skip if value is an object (potential injection)
    if (typeof value === 'object' && value !== null) {
      console.warn(`[Security] Blocked potential NoSQL injection on key: ${key}`);
      continue;
    }

    sanitized[key] = value;
  }

  return sanitized;
}

/**
 * BUG FIX #8: Mask CPF for logging (LGPD compliance)
 */
function maskCPF(cpf) {
  if (!cpf || cpf.length < 11) return '***';
  const cpfClean = cpf.replace(/\D/g, '');
  return cpfClean.substring(0, 3) + '*****' + cpfClean.substring(9);
}

/**
 * Validate quantity to prevent abuse
 */
function validateQuantity(quantity, max = 100) {
  const qty = parseInt(quantity);

  if (isNaN(qty) || qty <= 0 || qty > max) {
    throw new Error(`Quantity must be between 1 and ${max}`);
  }

  return qty;
}

module.exports = {
  validateDateParam,
  validateObjectId,
  sanitizeQuery,
  maskCPF,
  validateQuantity
};
