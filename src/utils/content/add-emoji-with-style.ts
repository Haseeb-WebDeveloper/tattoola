import { STYLE_EMOJIS } from "@/constants/styles-emoji";

export const addEmojiWithStyle = (styleName: string) => {
  const emoji = STYLE_EMOJIS[styleName] || "";
  const displayText = emoji ? `${emoji} ${styleName}` : styleName;
  return displayText;
};
