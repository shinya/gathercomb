const CSRF_COOKIE_NAME = 'csrf-token';

/**
 * Read the CSRF token from cookies (set by the backend)
 */
export function getCsrfToken(): string | null {
  const match = document.cookie
    .split('; ')
    .find(row => row.startsWith(`${CSRF_COOKIE_NAME}=`));
  return match ? decodeURIComponent(match.split('=')[1]) : null;
}
