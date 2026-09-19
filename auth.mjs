export const VALID_LOGINS = {
  'admin@btw.com': ['btw@123'],
  'agm@btw.com': ['agm@123', 'btw@123']
};

export function validateLogin(email, password) {
  const normalizedEmail = String(email ?? '').trim().toLowerCase();
  const normalizedPassword = String(password ?? '').trim();
  const allowedPasswords = VALID_LOGINS[normalizedEmail] || [];

  if (!allowedPasswords.length) {
    return { valid: false, role: null, email: normalizedEmail };
  }

  if (!allowedPasswords.includes(normalizedPassword)) {
    return { valid: false, role: null, email: normalizedEmail };
  }

  return {
    valid: true,
    role: normalizedEmail.startsWith('agm') ? 'agm' : 'admin',
    email: normalizedEmail
  };
}
