// filename: frontend/src/utils/canvasPreview.ts
import { PixelCrop } from 'react-image-crop';

const TO_RADIANS = Math.PI / 180;

/**
 * Draws the cropped image onto a canvas element.
 * @param image The source image element.
 * @param canvas The target canvas element.
 * @param crop The crop details (in pixels).
 * @param scale The scaling factor (default 1).
 * @param rotate The rotation angle in degrees (default 0).
 */
export async function canvasPreview(
  image: HTMLImageElement,
  canvas: HTMLCanvasElement,
  crop: PixelCrop,
  scale = 1,
  rotate = 0,
) {
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context');
  }

  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  // devicePixelRatio slightly increases sharpness on retina devices
  // at the expense of slightly slower render times and needing to change image.width and height a bit
  // const pixelRatio = window.devicePixelRatio;
  // canvas.width = Math.floor(crop.width * scaleX * pixelRatio);
  // canvas.height = Math.floor(crop.height * scaleY * pixelRatio);

  canvas.width = Math.floor(crop.width * scaleX);
  canvas.height = Math.floor(crop.height * scaleY);

  // ctx.scale(pixelRatio, pixelRatio);
  ctx.imageSmoothingQuality = 'high';

  const cropX = crop.x * scaleX;
  const cropY = crop.y * scaleY;

  const rotateRads = rotate * TO_RADIANS;
  const centerX = image.naturalWidth / 2;
  const centerY = image.naturalHeight / 2;

  ctx.save();

  // 5) Move the crop origin to the canvas origin (0,0)
  ctx.translate(-cropX, -cropY);
  // 4) Move the origin to the center of the original position
  ctx.translate(centerX, centerY);
  // 3) Rotate around the origin
  ctx.rotate(rotateRads);
  // 2) Scale the image
  ctx.scale(scale, scale);
  // 1) Move the center of the image to the origin (0,0)
  ctx.translate(-centerX, -centerY);

  ctx.drawImage(
    image,
    0,
    0,
    image.naturalWidth,
    image.naturalHeight,
    0,
    0,
    image.naturalWidth,
    image.naturalHeight,
  );

  ctx.restore();
}

/**
 * Utility to get a Blob from a canvas element.
 * @param canvas The canvas element.
 * @param type MIME type for the blob (e.g., 'image/png').
 * @param quality Quality for formats like 'image/jpeg'.
 * @returns A Promise that resolves with the Blob or null.
 */
export function canvasToBlob(
  canvas: HTMLCanvasElement,
  type = 'image/png', // Default to PNG for lossless
  quality = 0.9 // Default quality for lossy formats
): Promise<Blob | null> {
    return new Promise((resolve) => {
        canvas.toBlob(
            (blob) => {
                resolve(blob);
            },
            type,
            quality
        );
    });
}