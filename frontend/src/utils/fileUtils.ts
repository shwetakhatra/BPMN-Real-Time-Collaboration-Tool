/**
 * Downloads a file with the given content and filename
 */
export const downloadFile = (content: string, filename: string, mimeType = "application/xml"): void => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Generates a filename with the current date
 */
export const generateFilename = (prefix: string, extension: string): string => {
  const date = new Date().toISOString().split("T")[0];
  return `${prefix}-${date}.${extension}`;
};

