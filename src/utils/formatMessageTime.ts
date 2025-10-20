/**
 * Formats a message timestamp for display in the inbox
 * - Shows time (e.g., "2:14 PM") if message is less than 24 hours old
 * - Shows date (e.g., "10/15/25") if message is 24+ hours old
 */
export function formatMessageTime(timestamp: string | null | undefined): string {
  if (!timestamp) return "";
  
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hoursDiff = diff / (1000 * 60 * 60);
  
  if (hoursDiff < 24) {
    // Return time: "2:14 PM"
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    });
  } else {
    // Return date: "10/15/25"
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: '2-digit'
    });
  }
}

/**
 * Gets a preview text for a message based on its type
 */
export function getMessagePreview(message: {
  content?: string;
  messageType?: string;
  mediaUrl?: string;
}): string {
  if (!message) return "New conversation";
  
  const { content, messageType, mediaUrl } = message;
  
  // Handle media messages
  if (mediaUrl) {
    switch (messageType) {
      case 'IMAGE':
        return '📷 Photo';
      case 'VIDEO':
        return '🎥 Video';
      case 'FILE':
        return '📎 File';
      default:
        return 'Media';
    }
  }
  
  // Handle system messages
  if (messageType === 'SYSTEM') {
    return content || 'System message';
  }
  
  if (messageType === 'INTAKE_QUESTION') {
    return content || 'Question';
  }
  
  if (messageType === 'INTAKE_ANSWER') {
    return content || 'Answer';
  }
  
  // Regular text message
  return content || "New conversation";
}

