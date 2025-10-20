export function formatMessageTimestamp(dateString: string | Date): string {
  const messageDate = new Date(dateString);
  const now = new Date();
  
  // Reset time to midnight for date comparison
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const messageDateStart = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate());
  
  // Calculate difference in days
  const diffTime = todayStart.getTime() - messageDateStart.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  // Format time as 12-hour format with am/pm
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).toLowerCase();
  };
  
  // Format date as DD/M/YY
  const formatDate = (date: Date): string => {
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear().toString().slice(-2);
    return `${day}/${month}/${year}`;
  };
  
  // Today
  if (diffDays === 0) {
    return `Today, ${formatTime(messageDate)}`;
  }
  
  // Yesterday
  if (diffDays === 1) {
    return `Yesterday, ${formatTime(messageDate)}`;
  }
  
  // This week (2-6 days ago)
  if (diffDays >= 2 && diffDays <= 6) {
    return `This week ${formatDate(messageDate)}`;
  }
  
  // Last week (7-13 days ago)
  if (diffDays >= 7 && diffDays <= 13) {
    return `Last week ${formatDate(messageDate)}`;
  }
  
  // Calculate month difference
  const monthDiff = (now.getFullYear() - messageDate.getFullYear()) * 12 + 
                    (now.getMonth() - messageDate.getMonth());
  
  // This month (same month and year, but more than 2 weeks ago)
  if (monthDiff === 0 && diffDays >= 14) {
    return `This month ${formatDate(messageDate)}`;
  }
  
  // Last month
  if (monthDiff === 1) {
    return `Last month ${formatDate(messageDate)}`;
  }
  
  // 2-11 months ago
  if (monthDiff >= 2 && monthDiff <= 11) {
    return `${monthDiff} month${monthDiff > 1 ? 's' : ''} ago ${formatDate(messageDate)}`;
  }
  
  // Calculate year difference
  const yearDiff = now.getFullYear() - messageDate.getFullYear();
  
  // 1+ years ago
  if (yearDiff >= 1) {
    return `${yearDiff} year${yearDiff > 1 ? 's' : ''} ago ${formatDate(messageDate)}`;
  }
  
  // Fallback
  return formatDate(messageDate);
}

