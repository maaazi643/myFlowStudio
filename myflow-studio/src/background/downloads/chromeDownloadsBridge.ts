import type { DownloadsLike } from "./downloadNaming";

/** The one call in this module that touches the real chrome API — everything else is pure/testable. */
export function createChromeDownloadsBridge(): DownloadsLike {
  return {
    onDeterminingFilename(listener) {
      chrome.downloads.onDeterminingFilename.addListener((item, suggest) => {
        const newFilename = listener(item.filename);
        if (newFilename) {
          suggest({ filename: newFilename });
          return true;
        }
        return false;
      });
    },
  };
}
