"use client";

const PDF_IMAGE_TYPES = new Set(["image/jpeg", "image/png"]);

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error("Could not read the image."));
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("Could not read the image."));
        return;
      }
      resolve(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Resizes and rasterizes an image file onto a canvas to ensure
 * lightweight base64 output (max dimension 1200px, JPEG quality 0.75),
 * preventing Vercel payload size limits (413 Request Entity Too Large).
 */
export async function rasterizeAndCompressImage(file: File, maxDimension = 1200, quality = 0.75): Promise<string> {
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("This image cannot be processed. Please select a valid image file."));
      element.src = objectUrl;
    });

    let width = image.naturalWidth || image.width;
    let height = image.naturalHeight || image.height;
    if (!width || !height) {
      throw new Error("Could not determine image dimensions.");
    }

    if (width > maxDimension || height > maxDimension) {
      if (width > height) {
        height = Math.round((height * maxDimension) / width);
        width = maxDimension;
      } else {
        width = Math.round((width * maxDimension) / height);
        height = maxDimension;
      }
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Could not process image on canvas.");
    }

    // JPEG has no alpha channel; a white background preserves transparent elements.
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL("image/jpeg", quality);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/**
 * Produces JPEG data URLs supported by @react-pdf/renderer while keeping image size small.
 */
export async function readPdfCompatibleImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please select an image file.");
  }

  try {
    return await rasterizeAndCompressImage(file, 1200, 0.75);
  } catch (err) {
    if (PDF_IMAGE_TYPES.has(file.type)) {
      return readFileAsDataUrl(file);
    }
    throw err instanceof Error ? err : new Error("Could not process image.");
  }
}

export async function normalizeImageFileForPdf(file: File): Promise<File> {
  const dataUrl = await readPdfCompatibleImage(file);
  const bytes = await (await fetch(dataUrl)).blob();
  const baseName = file.name.replace(/\.[^.]+$/, "") || "image";
  return new File([bytes], `${baseName}.jpg`, { type: "image/jpeg" });
}

