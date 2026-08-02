/**
 * Delimiter between model text and the trailing Gravity ad JSON in the
 * /api/chat stream. Lives in its own module so the client terminal can
 * import it without pulling the server-side Gravity SDK into the bundle.
 * U+001E (ASCII record separator) can't appear in model output, so the
 * marker never collides with real text.
 */
export const GRAVITY_AD_MARKER = "\u001E__GRAVITY_AD__";
