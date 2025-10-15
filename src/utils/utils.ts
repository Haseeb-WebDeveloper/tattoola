export const formatDividerLabel = (dateValue: string | number | Date | undefined) => {
  if (!dateValue) return "";
  const date = new Date(dateValue);
  const now = new Date();
  const isSameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate();
  const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (isSameDay) return `Today, ${timeStr}`;
  if (isYesterday) return `Yesterday, ${timeStr}`;
  const dateStr = date.toLocaleDateString([], { month: "short", day: "numeric" });
  return `${dateStr}, ${timeStr}`;
};

export const shouldShowDivider = (prevAt?: string | number | Date, currAt?: string | number | Date, index?: number) => {
  if (index === 0) return true;
  if (!prevAt || !currAt) return true;
  const gap = new Date(currAt).getTime() - new Date(prevAt).getTime();
  return Math.abs(gap) > 10 * 60 * 1000;
};

export const isIntakeMessage = (message: any) => {
  const t = message?.messageType;
  return t === "SYSTEM" || (typeof t === "string" && t.startsWith("INTAKE_"));
};


