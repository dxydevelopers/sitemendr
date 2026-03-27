/**
 * Wrap a promise with a timeout
 * @param {Promise} promise The promise to wrap
 * @param {number} ms Timeout in milliseconds
 * @param {string} message Custom error message
 */
const withTimeout = (promise, ms = 5000, message = 'Operation timed out') => {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(message));
    }, ms);
  });

  return Promise.race([
    promise,
    timeoutPromise
  ]).finally(() => {
    clearTimeout(timeoutId);
  });
};

module.exports = { withTimeout };
