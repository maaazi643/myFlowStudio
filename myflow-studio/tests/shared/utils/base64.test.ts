import { describe, expect, it } from "vitest";
import { base64ToBlob, blobToBase64 } from "@shared/utils/base64";

describe("base64", () => {
  it("round-trips arbitrary bytes through blobToBase64/base64ToBlob", async () => {
    const bytes = new Uint8Array([0, 1, 2, 253, 254, 255, 42, 128]);
    const blob = new Blob([bytes], { type: "image/png" });

    const encoded = blobToBase64(blob);
    await expect(encoded).resolves.toEqual(expect.any(String));

    const decoded = base64ToBlob(await encoded, "image/png");
    expect(decoded.type).toBe("image/png");
    const decodedBytes = new Uint8Array(await decoded.arrayBuffer());
    expect(Array.from(decodedBytes)).toEqual(Array.from(bytes));
  });

  it("round-trips an empty blob", async () => {
    const blob = new Blob([], { type: "image/png" });
    const encoded = await blobToBase64(blob);
    const decoded = base64ToBlob(encoded, "image/png");
    expect(decoded.size).toBe(0);
  });

  it("round-trips text content", async () => {
    const text = "hello reference image bytes";
    const blob = new Blob([text], { type: "text/plain" });
    const encoded = await blobToBase64(blob);
    const decoded = base64ToBlob(encoded, "text/plain");
    expect(await decoded.text()).toBe(text);
  });
});
