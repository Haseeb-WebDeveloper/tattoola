export function normalizeItalianPhone(input: string): string {
  // Remove spaces, trailing and leading, and non-numeric except for "+"
  let val = input.replace(/\s+/g, "").replace(/[^\d+]/g, "");
  // Remove leading '00' and replace with '+'
  if (val.startsWith("00")) val = "+" + val.slice(2);
  // If it starts with "39" but no +, add +
  if (val.startsWith("39") && !val.startsWith("+39"))
    val = "+39" + val.slice(2);
  // If it starts with "0", assume Italian local, so add +39
  if (/^0\d+/.test(val)) val = "+39" + val;
  // If it's 10 digits, assume missing prefix, add +39
  if (/^\d{10}$/.test(val)) val = "+39" + val;
  // If it starts with '+', good
  return val;
}
