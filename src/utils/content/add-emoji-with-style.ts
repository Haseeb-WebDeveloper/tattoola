import { STYLE_EMOJIS } from "@/constants/styles-emoji";

/**
 * Returns an object with the emoji (if any) and the style name separately.
 * This allows UI to render them with custom spacing and avoid encoding issues.
 */
export const addEmojiWithStyle = (styleName: string) => {
  const emoji = STYLE_EMOJIS[styleName] || null;
  return { emoji, styleName };
};
