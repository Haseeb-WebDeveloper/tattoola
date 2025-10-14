export const getFileNameFromUri = (uri: string) => {
  try {
    return decodeURIComponent(uri.split("/").pop() || "Media");
  } catch {
    return "Media";
  }
};
