// ======================================================
// SAFE TIMESTAMP PARSER (Supabase → JS Date) FOR RN
// ======================================================
function parseTimestamp(timestamp: string | Date): Date {
  if (timestamp instanceof Date) return timestamp;

  if (!timestamp) return new Date(NaN);

  let raw = String(timestamp).trim();

  // If already has timezone info (+00:00, Z, etc.), parse as-is
  if (raw.match(/[+-]\d{2}:\d{2}$/) || raw.endsWith('Z')) {
    return new Date(raw);
  }

  // Supabase format: "2025-12-09 14:15:34.361" - replace space with T and add Z for UTC
  if (raw.match(/^\d{4}-\d{2}-\d{2} \d/)) {
    raw = raw.replace(" ", "T") + "Z";
    return new Date(raw);
  }

  // ISO format without timezone: "2025-12-09T14:15:34.361" - add Z for UTC
  if (raw.match(/^\d{4}-\d{2}-\d{2}T\d/) && !raw.endsWith('Z')) {
    raw = raw + "Z";
    return new Date(raw);
  }

  // Try parsing as-is
  const parsed = new Date(raw);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }

  return new Date(NaN);
}

// ======================================================
// FORMAT MESSAGE TIME FOR INBOX (RN-SAFE)
// ======================================================
/**
 * - Shows time if < 24 hours old → "2:14 PM"
 * - Shows date if >= 24 hours old → "10/15/25"
 */
export function formatMessageTime(timestamp: string | null | undefined): string {
  if (!timestamp) return "";

  // Parse safely - Date constructor already handles UTC to local conversion
  const localDate = parseTimestamp(timestamp);

  if (isNaN(localDate.getTime())) {
    console.log("❌ Invalid timestamp received:", timestamp);
    return "";
  }

  const now = new Date();
  const diff = now.getTime() - localDate.getTime();
  const hoursDiff = diff / (1000 * 60 * 60);

  // --- Local Time Formatter ---
  const formatTime = (d: Date) => {
    const hours = d.getHours();
    const mins = d.getMinutes();
    const displayHours = (hours % 12) || 12;
    const ampm = hours >= 12 ? "PM" : "AM";
    return `${displayHours}:${mins.toString().padStart(2, "0")} ${ampm}`;
  };

  // --- Local Date Formatter ---
  const formatDate = (d: Date) => {
    const mm = (d.getMonth() + 1).toString().padStart(2, "0");
    const dd = d.getDate().toString().padStart(2, "0");
    const yy = d.getFullYear().toString().slice(-2);
    return `${mm}/${dd}/${yy}`;
  };

  // If < 24 hours → show time
  if (hoursDiff < 24) return formatTime(localDate);

  // Otherwise → show date
  return formatDate(localDate);
}

// ======================================================
// MESSAGE PREVIEW HANDLER
// ======================================================
export function getMessagePreview(message: {
  content?: string;
  messageType?: string;
  mediaUrl?: string;
}): string {
  if (!message) return "New conversation";

  const { content, messageType, mediaUrl } = message;

  // Media messages
  if (mediaUrl) {
    switch (messageType) {
      case "IMAGE":
        return "📷 Photo";
      case "VIDEO":
        return "🎥 Video";
      case "FILE":
        return "📎 File";
      default:
        return "Media";
    }
  }

  // System messages
  if (messageType === "SYSTEM") {
    return content || "System message";
  }

  if (messageType === "INTAKE_QUESTION") return content || "Question";
  if (messageType === "INTAKE_ANSWER") return content || "Answer";

  // Regular text message
  return content || "New conversation";
}
