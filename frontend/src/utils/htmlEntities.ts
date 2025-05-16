/**
 * Decodes common HTML entities from strings
 * Handles &amp;, &quot;, &#39; and other HTML entities that may appear in YouTube titles
 */
export function decodeHtmlEntities(text: string): string {
  if (!text) return "";

  // Create a temporary DOM element
  const textarea = document.createElement("textarea");
  textarea.innerHTML = text;

  // Use the browser's built-in HTML entity decoding
  const decoded = textarea.value;

  return decoded;
}
