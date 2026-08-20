import { AuthError } from '../../shared/authTypes';

/** Maps backend error codes to till-facing copy. Always branch on `code`,
 * never on `message` text (per auth guide — message wording can change). */
export default function describeAuthError(error: AuthError): string {
  switch (error.code) {
    case 'INVALID_CREDENTIALS':
      return 'Invalid username or password.';
    case 'ACCOUNT_LOCKED':
      return error.message;
    case 'ACCOUNT_INACTIVE':
      return 'This account is inactive. Please see a manager.';
    case 'TOO_MANY_REQUESTS':
      return 'Too many attempts. Please wait a few minutes and try again.';
    case 'VALIDATION_ERROR':
      return error.message || 'Please check your details and try again.';
    case 'NETWORK_ERROR':
      return 'Could not reach the server. Check your connection and try again.';
    case 'SERVICE_UNAVAILABLE':
      return 'Service unavailable right now. Please try again shortly.';
    default:
      return error.message || 'Something went wrong. Please try again.';
  }
}
