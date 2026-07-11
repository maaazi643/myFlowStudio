/**
 * The subset of chrome.downloads this module needs, narrowed to our own
 * interface — same rationale as PortLike/StorageArea/TabsLike. The listener
 * is a plain (originalFilename) => newFilename | undefined function; the
 * chrome-specific plumbing (calling suggest(), returning true/false to
 * claim the event) lives entirely in the real adapter.
 */
export interface DownloadsLike {
  onDeterminingFilename(listener: (originalFilename: string) => string | undefined): void;
}

export interface DownloadRenamer {
  /** Call right before triggering a download this run should own the name of. */
  expectNextDownloadAs(filename: string): void;
}

/**
 * Renames the *next* download to happen after expectNextDownloadAs() was
 * called, keeping the original extension. Downloads the extension didn't
 * trigger (or a second one that arrives after the expectation was already
 * consumed) are left completely alone — this never renames a download it
 * wasn't told to expect.
 */
export function createDownloadRenamer(downloads: DownloadsLike): DownloadRenamer {
  let pendingName: string | null = null;

  downloads.onDeterminingFilename((originalFilename) => {
    if (!pendingName) {
      return undefined;
    }
    const name = pendingName;
    pendingName = null;
    const dotIndex = originalFilename.lastIndexOf(".");
    const extension = dotIndex >= 0 ? originalFilename.slice(dotIndex + 1) : undefined;
    return extension ? `${name}.${extension}` : name;
  });

  return {
    expectNextDownloadAs(filename) {
      pendingName = filename;
    },
  };
}
