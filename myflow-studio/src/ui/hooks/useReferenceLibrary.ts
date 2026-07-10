import { useCallback, useEffect, useState } from "react";
import { createImagesRepository } from "@shared/storage/indexedDb/repositories";
import type { StoredImage } from "@shared/types/image";
import { validateImageFile } from "@shared/utils/validators/imageFileValidator";

const repo = createImagesRepository();

export interface UseReferenceLibraryResult {
  images: StoredImage[];
  loading: boolean;
  upload: (file: File) => Promise<StoredImage>;
  remove: (id: string) => Promise<void>;
}

/** The full reference-image library — every uploaded reference is a reusable preset, not tied to one prompt. */
export function useReferenceLibrary(): UseReferenceLibraryResult {
  const [images, setImages] = useState<StoredImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void repo.getByKind("reference").then((list) => {
      if (!cancelled) {
        setImages(list);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const upload = useCallback(async (file: File): Promise<StoredImage> => {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      throw new Error(validation.error ?? "That file can't be used as a reference image.");
    }
    const image: StoredImage = {
      id: crypto.randomUUID(),
      kind: "reference",
      projectId: null,
      promptId: null,
      fileName: file.name,
      mimeType: file.type,
      blob: file,
      createdAt: Date.now(),
    };
    await repo.put(image);
    setImages((current) => [...current, image]);
    return image;
  }, []);

  const remove = useCallback(async (id: string): Promise<void> => {
    await repo.delete(id);
    setImages((current) => current.filter((image) => image.id !== id));
  }, []);

  return { images, loading, upload, remove };
}
