export interface ConvertImageToWebPOptions {
  quality?: number;
  maxWidth?: number;
}

/**
 * Convierte un nombre de archivo en un slug seguro:
 * minúsculas, sin tildes, sin espacios, solo [a-z0-9-].
 */
export function sanitizeFileSlug(fileName: string): string {
  const withoutExt = (fileName || 'archivo').replace(/\.[^/.]+$/, '');
  const slug = withoutExt
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || 'archivo';
}

async function isAnimatedGif(file: File): Promise<boolean> {
  try {
    const buffer = await file.slice(0, 512 * 1024).arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let frames = 0;
    for (let i = 0; i < bytes.length - 3; i++) {
      // Graphic Control Extension (0x21 0xF9 0x04)
      if (bytes[i] === 0x21 && bytes[i + 1] === 0xf9 && bytes[i + 2] === 0x04) {
        frames++;
        if (frames > 1) return true;
      }
    }
    return false;
  } catch {
    return true;
  }
}

function loadHtmlImage(objectUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('No se pudo decodificar la imagen con <img>.'));
    img.src = objectUrl;
  });
}

function canvasToWebPBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/webp', quality);
  });
}

/**
 * Convierte cualquier imagen soportada por el navegador a WebP en el cliente.
 * Mantiene intactos archivos que no son imagen (PDF, videos), WebP existentes,
 * SVG y GIFs animados, y hace fallback seguro al archivo original ante cualquier incompatibilidad.
 */
export async function convertImageToWebP(
  file: File,
  opts: ConvertImageToWebPOptions = { quality: 0.85, maxWidth: 1920 }
): Promise<File> {
  if (!file) return file;

  const mime = (file.type || '').toLowerCase();
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  const imageFallbackExts = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'avif', 'heic', 'heif', 'webp', 'svg'];
  const isImage = mime.startsWith('image/') || (mime === '' && imageFallbackExts.includes(ext));

  if (!isImage) {
    return file;
  }

  if (mime === 'image/webp' || ext === 'webp') {
    return file;
  }

  if (mime === 'image/svg+xml' || ext === 'svg') {
    return file;
  }

  if (mime === 'image/gif' || ext === 'gif') {
    const animated = await isAnimatedGif(file);
    if (animated) {
      return file;
    }
  }

  const quality = typeof opts?.quality === 'number' ? opts.quality : 0.85;
  const maxWidth = typeof opts?.maxWidth === 'number' ? opts.maxWidth : 1920;

  let bitmap: ImageBitmap | null = null;
  let objectUrl: string | null = null;

  try {
    let source: CanvasImageSource;
    let srcWidth = 0;
    let srcHeight = 0;

    if (typeof createImageBitmap === 'function') {
      try {
        bitmap = await createImageBitmap(file);
        source = bitmap;
        srcWidth = bitmap.width;
        srcHeight = bitmap.height;
      } catch {
        objectUrl = URL.createObjectURL(file);
        const img = await loadHtmlImage(objectUrl);
        source = img;
        srcWidth = img.naturalWidth || img.width;
        srcHeight = img.naturalHeight || img.height;
      }
    } else {
      objectUrl = URL.createObjectURL(file);
      const img = await loadHtmlImage(objectUrl);
      source = img;
      srcWidth = img.naturalWidth || img.width;
      srcHeight = img.naturalHeight || img.height;
    }

    if (!srcWidth || !srcHeight) {
      return file;
    }

    let targetWidth = srcWidth;
    let targetHeight = srcHeight;
    if (maxWidth > 0 && srcWidth > maxWidth) {
      targetWidth = maxWidth;
      targetHeight = Math.max(1, Math.round((srcHeight * maxWidth) / srcWidth));
    }

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return file;
    }

    ctx.drawImage(source, 0, 0, targetWidth, targetHeight);
    const blob = await canvasToWebPBlob(canvas, quality);

    if (!blob || blob.type !== 'image/webp') {
      return file;
    }

    const safeName = `${sanitizeFileSlug(file.name)}.webp`;
    return new File([blob], safeName, {
      type: 'image/webp',
      lastModified: Date.now(),
    });
  } catch {
    return file;
  } finally {
    if (bitmap && typeof bitmap.close === 'function') {
      try { bitmap.close(); } catch {}
    }
    if (objectUrl) {
      try { URL.revokeObjectURL(objectUrl); } catch {}
    }
  }
}
