/**
 * Filter an object to only include specified allowed fields
 * @param {Object} obj - The object to filter
 * @param {...string} allowedFields - The fields to allow in the filtered object
 * @returns {Object} - A new object containing only the allowed fields
 */
export const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(key => {
    if (allowedFields.includes(key)) {
      newObj[key] = obj[key];
    }
  });
  return newObj;
};
