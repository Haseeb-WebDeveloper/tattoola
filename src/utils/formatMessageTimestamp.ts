export function formatMessageTimestamp(dateString: string | Date): string {

  //  PARSE DATE SAFELY
  let utcDate = new Date(dateString);
  if (isNaN(utcDate.getTime())) {
    // Supabase format: "2025-12-10T12:30:32.956"
    const safe = String(dateString).replace(" ", "T");
    utcDate = new Date(safe);
  }

  if (isNaN(utcDate.getTime())) {
    console.log("❌ STILL INVALID DATE:", dateString);
    return "Invalid date";
  }

  // 2) MANUAL TIMEZONE CONVERSION 
  const tzOffsetMinutes = -utcDate.getTimezoneOffset(); 

  const localDate = new Date(utcDate.getTime() + tzOffsetMinutes * 60 * 1000);


  // 3) Now normal logic works
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const messageStart = new Date(
    localDate.getFullYear(),
    localDate.getMonth(),
    localDate.getDate()
  );

  const diffDays = Math.floor(
    (todayStart.getTime() - messageStart.getTime()) / (1000 * 60 * 60 * 24)
  );

  const formatTime = (d: Date) =>
    `${(d.getHours() % 12) || 12}:${String(d.getMinutes()).padStart(2, "0")} ${
      d.getHours() >= 12 ? "pm" : "am"
    }`;

  const formatDate = (d: Date) =>
    `${d.getDate()}/${d.getMonth() + 1}/${String(d.getFullYear()).slice(-2)}`;

  if (diffDays === 0) return `Today, ${formatTime(localDate)}`;
  if (diffDays === 1) return `Yesterday, ${formatTime(localDate)}`;
  if (diffDays >= 2 && diffDays <= 6) return `This week ${formatDate(localDate)}`;
  if (diffDays >= 7 && diffDays <= 13) return `Last week ${formatDate(localDate)}`;

  const monthDiff =
    (now.getFullYear() - localDate.getFullYear()) * 12 +
    (now.getMonth() - localDate.getMonth());

  if (monthDiff === 0 && diffDays >= 14)
    return `This month ${formatDate(localDate)}`;

  if (monthDiff === 1) return `Last month ${formatDate(localDate)}`;

  if (monthDiff >= 2 && monthDiff <= 11)
    return `${monthDiff} months ago ${formatDate(localDate)}`;

  const yearDiff = now.getFullYear() - localDate.getFullYear();

  if (yearDiff >= 1)
    return `${yearDiff} year${yearDiff > 1 ? "s" : ""} ago ${formatDate(
      localDate
    )}`;

  return formatDate(localDate);
}
