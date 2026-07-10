import { useEffect, useState } from "react";
import { createImagesRepository } from "@shared/storage/indexedDb/repositories";
import type { StoredImage } from "@shared/types/image";

const repo = createImagesRepository();

/** Resolves a prompt's referenceImageIds to the actual StoredImage records. */
export function useImagesByIds(ids: readonly string[]): StoredImage[] {
  const [images, setImages] = useState<StoredImage[]>([]);
  // Array identity changes every render even for the same contents — key on
  // the joined value so the effect only re-runs when the ids actually change.
  const idsKey = ids.join(",");

  useEffect(() => {
    let cancelled = false;
    const requestedIds = idsKey ? idsKey.split(",") : [];
    if (requestedIds.length === 0) {
      setImages([]);
      return;
    }
    void Promise.all(requestedIds.map((id) => repo.getById(id))).then((results) => {
      if (!cancelled) {
        setImages(results.filter((image): image is StoredImage => image !== undefined));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [idsKey]);

  return images;
}
