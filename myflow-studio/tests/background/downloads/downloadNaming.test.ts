import { describe, expect, it } from "vitest";
import { createDownloadRenamer } from "@background/downloads/downloadNaming";
import type { DownloadsLike } from "@background/downloads/downloadNaming";

function createFakeDownloads(): DownloadsLike & {
  fire: (originalFilename: string) => string | undefined;
} {
  let registered: ((originalFilename: string) => string | undefined) | null = null;
  return {
    onDeterminingFilename(listener) {
      registered = listener;
    },
    fire(originalFilename) {
      if (!registered) {
        throw new Error("No listener registered.");
      }
      return registered(originalFilename);
    },
  };
}

describe("createDownloadRenamer", () => {
  it("leaves a download alone when nothing was expected", () => {
    const downloads = createFakeDownloads();
    createDownloadRenamer(downloads);

    expect(downloads.fire("image (1).png")).toBeUndefined();
  });

  it("renames the next download to the expected name, keeping its extension", () => {
    const downloads = createFakeDownloads();
    const renamer = createDownloadRenamer(downloads);

    renamer.expectNextDownloadAs("0001_a_fox");
    expect(downloads.fire("flow-output-abc123.png")).toBe("0001_a_fox.png");
  });

  it("only consumes the expectation once — the download after that is left alone", () => {
    const downloads = createFakeDownloads();
    const renamer = createDownloadRenamer(downloads);

    renamer.expectNextDownloadAs("0001_a_fox");
    downloads.fire("flow-output.png");

    expect(downloads.fire("unrelated-download.pdf")).toBeUndefined();
  });

  it("falls back to the bare expected name when the original has no extension", () => {
    const downloads = createFakeDownloads();
    const renamer = createDownloadRenamer(downloads);

    renamer.expectNextDownloadAs("0001_a_fox");
    expect(downloads.fire("no-extension-here")).toBe("0001_a_fox");
  });

  it("supports expecting a new download after a previous one was consumed", () => {
    const downloads = createFakeDownloads();
    const renamer = createDownloadRenamer(downloads);

    renamer.expectNextDownloadAs("0001_first");
    downloads.fire("a.png");
    renamer.expectNextDownloadAs("0002_second");

    expect(downloads.fire("b.jpg")).toBe("0002_second.jpg");
  });
});
