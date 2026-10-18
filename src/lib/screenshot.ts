// Browser-only: shrinks a listing screenshot before it leaves the device, so it
// uploads quickly and fits the server's 5 MB limit. Returns a JPEG data URL.
const MAX_SIDE = 1600;

export async function compressScreenshot(file: File): Promise<string> {
  if (file.size > 5 * 1024 * 1024) throw new Error("Use an image no larger than 5 MB.");
  let source: Blob = file;
  if (/image\/hei[cf]/.test(file.type) || /\.hei[cf]$/i.test(file.name)) {
    const { heicTo } = await import("heic-to");
    source = await heicTo({ blob: file, type: "image/jpeg", quality: 0.85 });
  } else if (!/^image\/(png|jpeg|webp)$/.test(file.type)) {
    throw new Error("Use a JPG, PNG, WebP, or HEIC screenshot.");
  }
  const bitmap = await createImageBitmap(source);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("This browser could not read that image.");
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.85);
}

export const PREFILL_TEXT_KEY = "scout.prefill";
export const PREFILL_IMAGE_KEY = "scout.prefillImage";
