/**
 * Trims a string to a maximum length and appends '..' if it exceeds that length.
 * @param {string} text - The input string to trim.
 * @param {number} maxLength - The maximum allowed length for the string.
 * @returns {string} - The trimmed string, with '..' appended if truncation occurred.
 */
export function trimText(text: string, maxLength: number): string {
  if (typeof text !== "string" || typeof maxLength !== "number" || maxLength < 0) {
    return "";
  }
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength) + "..";
}
