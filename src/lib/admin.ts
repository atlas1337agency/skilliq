export const ADMIN_EMAILS = [
  'atlas1337agency@gmail.com',
  'marouananouar02@gmail.com'
];

export function isSuperAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.trim().toLowerCase());
}
