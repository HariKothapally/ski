export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePassword = (password) => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
  return re.test(password);
};

export const validatePhoneNumber = (phone) => {
  // Basic phone number validation
  const re = /^\+?[\d\s-]{10,}$/;
  return re.test(phone);
};

export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input.trim().replace(/[<>]/g, '');
};

export const validateQuantity = (quantity) => {
  return typeof quantity === 'number' && quantity >= 0;
};

export const validatePrice = (price) => {
  return typeof price === 'number' && price >= 0;
};

export const validateDate = (date) => {
  const d = new Date(date);
  return d instanceof Date && !isNaN(d);
};
