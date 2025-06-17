// frontend/src/utils/canvasPreview.ts
// Version 1.0.2 (Removed unused centerX, centerY for current logic)
import { PixelCrop } from 'react-image-crop';

const TO_RADIANS = Math.PI / 180;

export async function canvasPreview(
  image: HTMLImageElement,
  canvas: HTMLCanvasElement,
  crop: PixelCrop,
  scale = 1,
  rotate = 0,
  outputWidth?: number,
  outputHeight?: number
) {
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context');
  }

  const scaleX = image.naturalWidth / image.width;  // Relación entre tamaño natural y tamaño mostrado
  const scaleY = image.naturalHeight / image.height; // Usado para convertir crop de % a px si fuera el caso

  canvas.width = Math.floor(outputWidth || crop.width);   // Usar outputWidth o el ancho del crop en píxeles
  canvas.height = Math.floor(outputHeight || crop.height); // Usar outputHeight o el alto del crop en píxeles

  ctx.imageSmoothingQuality = 'high';

  const cropXInOriginal = crop.x * scaleX; // Coordenada X del crop en la imagen original
  const cropYInOriginal = crop.y * scaleY; // Coordenada Y del crop en la imagen original
  const cropWidthInOriginal = crop.width * scaleX; // Ancho del crop en la imagen original
  const cropHeightInOriginal = crop.height * scaleY; // Alto del crop en la imagen original

  const rotateRads = rotate * TO_RADIANS;

  ctx.save();
  // Mover el origen del canvas al centro del canvas para la rotación/escalado
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(rotateRads);
  ctx.scale(scale, scale);
  // Mover el origen de nuevo para que (0,0) del drawImage sea la esquina superior izquierda del área de destino
  ctx.translate(-canvas.width / 2, -canvas.height / 2);

  // Dibujar la porción recortada de la imagen original,
  // y que se ajuste a las dimensiones completas del canvas (que son outputWidth/Height o el tamaño del crop).
  ctx.drawImage(
    image,
    cropXInOriginal,
    cropYInOriginal,
    cropWidthInOriginal,
    cropHeightInOriginal,
    0, // Dibujar en la esquina (0,0) del canvas (ya transformado)
    0,
    canvas.width,  // Estirar/encoger a todo el ancho del canvas
    canvas.height  // Estirar/encoger a todo el alto del canvas
  );

  ctx.restore();
}

// canvasToBlob (sin cambios)
export function canvasToBlob(
  canvas: HTMLCanvasElement,
  type = 'image/png',
  quality = 0.9
): Promise<Blob | null> {
    return new Promise((resolve) => {
        canvas.toBlob(
            (blob) => { resolve(blob); },
            type,
            quality
        );
    });
}