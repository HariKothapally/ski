export const getStartOfDay = (date = new Date()) => {
  return new Date(date.setHours(0, 0, 0, 0));
};

export const getEndOfDay = (date = new Date()) => {
  return new Date(date.setHours(23, 59, 59, 999));
};

export const getStartOfMonth = (date = new Date()) => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

export const getEndOfMonth = (date = new Date()) => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
};

export const formatDate = (date) => {
  return date.toISOString().split('T')[0];
};

export const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const subtractDays = (date, days) => {
  return addDays(date, -days);
};

export const isWithinRange = (date, startDate, endDate) => {
  const d = new Date(date);
  return d >= new Date(startDate) && d <= new Date(endDate);
};

export const getDaysBetween = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};
