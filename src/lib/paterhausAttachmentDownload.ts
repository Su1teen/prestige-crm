/**
 * Starts the already-authorized S3 download with one browser action.
 * The signed URL supplies Content-Disposition=attachment, so no popup or
 * navigation fallback is needed.
 */
export function downloadSignedAttachment(url: string): void {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.rel = "noopener noreferrer";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}
