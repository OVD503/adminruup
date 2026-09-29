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

async function rasterizeAsJpeg(file: File): Promise<string> {
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("This image cannot be converted. Please use a JPEG or PNG image."));
      element.src = objectUrl;
    });

    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext("2d");
    if (!context || !canvas.width || !canvas.height) {
      throw new Error("This image cannot be converted. Please use a JPEG or PNG image.");
    }

    // JPEG has no alpha channel; a white background preserves transparent signatures.
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0);
    return canvas.toDataURL("image/jpeg", 0.92);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/**
 * Produces the JPEG/PNG data URLs supported by @react-pdf/renderer.
 * Safari commonly supplies HEIC files from Photos; those must be rasterized
 * before they are included in a server-generated PDF.
 */
export async function readPdfCompatibleImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please select an image file.");
  }

  return PDF_IMAGE_TYPES.has(file.type) ? readFileAsDataUrl(file) : rasterizeAsJpeg(file);
}

export async function normalizeImageFileForPdf(file: File): Promise<File> {
  if (PDF_IMAGE_TYPES.has(file.type)) return file;

  const dataUrl = await readPdfCompatibleImage(file);
  const bytes = await (await fetch(dataUrl)).blob();
  const baseName = file.name.replace(/\.[^.]+$/, "") || "image";
  return new File([bytes], `${baseName}.jpg`, { type: "image/jpeg" });
}
