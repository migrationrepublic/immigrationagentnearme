/**
 * User-friendly error handling (works on both server and client).
 *
 * Rule of thumb:
 *  - Raw/technical errors (Postgres, Supabase, Next.js, network, pdf-lib) are
 *    LOGGED in full but never shown to users.
 *  - Users only ever see either a message written for them (UserFacingError,
 *    validation messages) or a plain-language translation / fallback.
 */

/** An error whose message is safe and meant to be shown to the end user. */
export class UserFacingError extends Error {
  readonly userFacing = true
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'UserFacingError'
  }
}

export const GENERIC_ERROR_MESSAGE = 'Something went wrong. Please try again in a moment.'

function isUserFacing(err: unknown): err is UserFacingError {
  return (
    err instanceof UserFacingError ||
    (typeof err === 'object' && err !== null && (err as { userFacing?: unknown }).userFacing === true)
  )
}

/** Zod validation messages are authored in our schemas, so they are user-safe. */
function zodMessage(err: unknown): string | null {
  if (
    typeof err === 'object' &&
    err !== null &&
    (err as { name?: string }).name === 'ZodError' &&
    Array.isArray((err as { issues?: unknown }).issues)
  ) {
    const first = (err as { issues: Array<{ message?: string }> }).issues[0]
    return first?.message || 'Some of the information entered is not valid.'
  }
  return null
}

function rawMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  if (typeof err === 'string') return err
  if (typeof err === 'object' && err !== null && 'message' in err) {
    return String((err as { message: unknown }).message)
  }
  return ''
}

/** Known technical failure patterns → plain-language explanations. Order matters. */
const KNOWN_ERRORS: Array<[RegExp, string]> = [
  [/body exceeded|payload too large|entity too large|\b413\b|maximum allowed size|exceeded the maximum/i,
    'This file is too large. Please upload a file smaller than 20MB.'],
  [/failed to fetch|fetch failed|networkerror|network request failed|load failed|err_network|econnreset|enotfound/i,
    "We couldn't reach the server. Please check your internet connection and try again."],
  [/timed? ?out|timeout|\b504\b|etimedout/i,
    'The request took too long. Please try again.'],
  [/too many requests|rate limit|\b429\b/i,
    'Too many attempts. Please wait a minute and try again.'],
  [/jwt|auth session missing|invalid refresh token|not authenticated|session.*expired/i,
    'Your session has expired. Please sign in again.'],
  [/unauthori[sz]ed|permission denied|row-level security|forbidden|\b403\b/i,
    "You don't have permission to do this."],
  [/is encrypted|encrypted pdf|password.?protected/i,
    'This PDF is password-protected. Please remove the password and upload it again.'],
  [/failed to parse|no pdf header|invalid pdf|not a pdf|pdf.*(corrupt|invalid)|invalid object ref/i,
    "This file doesn't look like a valid PDF. Please check the file and try again."],
  [/bucket not found|object not found|the resource was not found/i,
    "The file couldn't be found. It may have been moved or deleted."],
  [/duplicate key|already exists/i,
    'This record already exists.'],
  [/violates foreign key/i,
    "This item is linked to other records, so it can't be changed right now."],
  // Next.js production errors (message is deliberately hidden by the framework)
  [/server components render|digest|unexpected response was received from the server/i,
    GENERIC_ERROR_MESSAGE],
]

/**
 * Converts any thrown value into a message that is safe to show to users.
 *
 * @param err      Whatever was caught.
 * @param fallback Context-specific message shown when the error is unknown,
 *                 e.g. "We couldn't upload your document. Please try again."
 */
export function toUserMessage(err: unknown, fallback = GENERIC_ERROR_MESSAGE): string {
  if (isUserFacing(err)) return (err as Error).message

  const zod = zodMessage(err)
  if (zod) return zod

  const msg = rawMessage(err)
  if (msg) {
    for (const [pattern, friendly] of KNOWN_ERRORS) {
      if (pattern.test(msg)) return friendly
    }
  }
  return fallback
}

/**
 * Logs the full technical error (for developers / server logs) and returns
 * the user-friendly message. Use this in every catch block that reaches the UI.
 */
export function handleError(context: string, err: unknown, fallback = GENERIC_ERROR_MESSAGE): string {
  console.error(`[${context}]`, err)
  return toUserMessage(err, fallback)
}

/** Standard failed result for Server Actions: `return actionError(...)`. */
export function actionError(
  context: string,
  err: unknown,
  fallback = GENERIC_ERROR_MESSAGE
): { success: false; error: string } {
  return { success: false, error: handleError(context, err, fallback) }
}
