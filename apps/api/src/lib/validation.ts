const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Validate registration input. Returns an error message, or null if valid.
// Shared by REST register, admin register, and the GraphQL createUser mutation
// so all account-creation paths enforce the same rules.
export const validateRegistration = (input: {
  name?: string;
  email?: string;
  password?: string;
}): string | null => {
  const { name, email, password } = input;
  if (!name || !email || !password) return 'Name, email and password are required';
  if (name.trim().length < 2) return 'Name must be at least 2 characters';
  if (!EMAIL_RE.test(email)) return 'Invalid email address';
  if (password.length < 8) return 'Password must be at least 8 characters';
  return null;
};

// Validate a partial profile update. Only checks fields that are present.
// Returns an error message, an 'empty' flag if nothing was provided, or null.
export const validateUserUpdate = (input: {
  name?: string;
  email?: string;
  password?: string;
}): string | null => {
  const { name, email, password } = input;
  if (name === undefined && email === undefined && password === undefined)
    return 'No fields to update';
  if (name !== undefined && name.trim().length < 2) return 'Name must be at least 2 characters';
  if (email !== undefined && !EMAIL_RE.test(email)) return 'Invalid email address';
  if (password !== undefined && password.length < 8)
    return 'Password must be at least 8 characters';
  return null;
};
