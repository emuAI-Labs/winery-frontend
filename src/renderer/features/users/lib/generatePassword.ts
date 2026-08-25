const LOWER = 'abcdefghjkmnpqrstuvwxyz';
const UPPER = 'ABCDEFGHJKMNPQRSTUVWXYZ';
const DIGITS = '23456789';
const ALL = `${LOWER}${UPPER}${DIGITS}`;

function pick(chars: string): string {
  return chars[Math.floor(Math.random() * chars.length)];
}

/** Generates a password that always satisfies the backend's rule (10-128
 * chars, at least one lowercase, one uppercase, one digit) — used for the
 * "generate strong password" helper on create/reset, since the backend sets
 * the initial password directly rather than emailing a token. */
export default function generatePassword(length = 14): string {
  const required = [pick(LOWER), pick(UPPER), pick(DIGITS)];
  const rest = Array.from({ length: length - required.length }, () =>
    pick(ALL),
  );
  const chars = [...required, ...rest];
  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}
