import sharp from 'sharp';
import { logger } from '../utils/logger';

export interface ProcessedImage {
  buffer: Buffer;
  width: number;
  height: number;
  format: string;
  size: number;
}

export interface ThumbnailResult {
  buffer: Buffer;
  width: number;
  height: number;
}

export async function processImage(
  buffer: Buffer,
  options?: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    format?: 'jpeg' | 'png' | 'webp';
  }
): Promise<ProcessedImage> {
  const {
    maxWidth = 2048,
    maxHeight = 2048,
    quality = 85,
    format = 'jpeg',
  } = options || {};

  const sharpInstance = sharp(buffer);
  const metadata = await sharpInstance.metadata();

  let pipeline = sharpInstance;

  // Resize if needed
  if (
    (metadata.width && metadata.width > maxWidth) ||
    (metadata.height && metadata.height > maxHeight)
  ) {
    pipeline = pipeline.resize(maxWidth, maxHeight, {
      fit: 'inside',
      withoutEnlargement: true,
    });
  }

  // Auto-rotate based on EXIF data
  pipeline = pipeline.rotate();

  // Convert format and compress
  let outputBuffer: Buffer;
  let outputFormat: string = format;

  if (format === 'webp') {
    outputBuffer = await pipeline.webp({ quality }).toBuffer();
  } else if (format === 'png') {
    outputBuffer = await pipeline.png({ compressionLevel: 8 }).toBuffer();
  } else {
    outputBuffer = await pipeline.jpeg({ quality, progressive: true }).toBuffer();
  }

  const outputMeta = await sharp(outputBuffer).metadata();

  return {
    buffer: outputBuffer,
    width: outputMeta.width || 0,
    height: outputMeta.height || 0,
    format: outputFormat,
    size: outputBuffer.length,
  };
}

export async function generateThumbnail(
  buffer: Buffer,
  width = 400,
  height = 400
): Promise<ThumbnailResult> {
  const thumbnailBuffer = await sharp(buffer)
    .rotate()
    .resize(width, height, {
      fit: 'cover',
      position: 'center',
    })
    .jpeg({ quality: 75, progressive: true })
    .toBuffer();

  return {
    buffer: thumbnailBuffer,
    width,
    height,
  };
}

export async function addWatermark(
  buffer: Buffer,
  watermarkText: string,
  options?: {
    fontSize?: number;
    opacity?: number;
    position?: 'bottomRight' | 'bottomLeft' | 'center' | 'topRight';
  }
): Promise<Buffer> {
  try {
    const { opacity = 0.95, position = 'bottomRight' } = options || {};

    const meta = await sharp(buffer).metadata();
    const imgWidth = meta.width || 800;
    const imgHeight = meta.height || 600;

    // Escape XML special chars so event names like "Tom & Jerry" don't break the SVG
    const escapeXml = (s: string) =>
      s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    const text = escapeXml(watermarkText);

    // Adaptive font size: scales with the image, clamped to a sane range.
    // Honours an explicit fontSize option if the caller passes one.
    const fontSize =
      options?.fontSize ??
      Math.round(Math.max(16, Math.min(40, Math.min(imgWidth, imgHeight) * 0.032)));

    // Pill geometry
    const charW = fontSize * 0.6;                 // rough advance width for bold sans
    const textW = watermarkText.length * charW;   // estimate (use raw length, not escaped)
    const padX = Math.round(fontSize * 0.75);
    const padY = Math.round(fontSize * 0.45);
    const pillW = Math.round(textW + padX * 2);
    const pillH = Math.round(fontSize + padY * 2);
    const radius = Math.round(fontSize * 0.45);

    // Transparent margin around the pill — gives an edge offset AND room for the blur
    const margin = Math.round(fontSize * 1.0);
    const svgWidth = pillW + margin * 2;
    const svgHeight = pillH + margin * 2;

    // Centre the text inside the pill
    const cx = margin + pillW / 2;
    const cy = margin + pillH / 2;
    const baseline = cy + fontSize * 0.34;

    const svgText = `
      <svg width="${svgWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="softShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="${Math.max(3, fontSize * 0.18)}" />
          </filter>
        </defs>
        <g opacity="${opacity}">
          <!-- soft drop shadow -->
          <rect
            x="${margin}" y="${margin + 3}"
            width="${pillW}" height="${pillH}"
            rx="${radius}" ry="${radius}"
            fill="#000000" fill-opacity="0.45"
            filter="url(#softShadow)" />
          <!-- glass pill -->
          <rect
            x="${margin}" y="${margin}"
            width="${pillW}" height="${pillH}"
            rx="${radius}" ry="${radius}"
            fill="#1f2024" fill-opacity="0.82"
            stroke="#ffffff" stroke-opacity="0.14" stroke-width="1" />
          <!-- label -->
          <text
            x="${cx}" y="${baseline}"
            text-anchor="middle"
            font-family="'Helvetica Neue', Helvetica, Arial, sans-serif"
            font-size="${fontSize}px"
            font-weight="600"
            letter-spacing="0.4"
            fill="#ffffff">${text}</text>
        </g>
      </svg>
    `;

    const svgBuffer = Buffer.from(svgText);

    let gravity: sharp.Gravity = 'southeast';
    if (position === 'bottomLeft') gravity = 'southwest';
    else if (position === 'center') gravity = 'center';
    else if (position === 'topRight') gravity = 'northeast';

    const watermarked = await sharp(buffer)
      .composite([
        {
          input: svgBuffer,
          gravity,
          blend: 'over',
        },
      ])
      .jpeg({ quality: 90 })
      .toBuffer();

    return watermarked;
  } catch (error) {
    logger.error('Watermark error:', error);
    return buffer; // Return original if watermark fails
  }
}

export async function computePerceptualHash(buffer: Buffer): Promise<string> {
  try {
    // Resize to 8x8 grayscale for simple hash
    const data = await sharp(buffer)
      .resize(8, 8, { fit: 'fill' })
      .greyscale()
      .raw()
      .toBuffer();

    // Compute average
    const avg = data.reduce((sum, val) => sum + val, 0) / data.length;

    // Build hash
    let hash = '';
    for (let i = 0; i < data.length; i++) {
      hash += data[i] >= avg ? '1' : '0';
    }

    return hash;
  } catch (error) {
    logger.error('Perceptual hash error:', error);
    return '';
  }
}

export function hammingDistance(hash1: string, hash2: string): number {
  let distance = 0;
  for (let i = 0; i < Math.min(hash1.length, hash2.length); i++) {
    if (hash1[i] !== hash2[i]) distance++;
  }
  return distance;
}

export async function getImageMetadata(buffer: Buffer) {
  const meta = await sharp(buffer).metadata();
  return {
    width: meta.width || 0,
    height: meta.height || 0,
    format: meta.format || 'unknown',
    size: buffer.length,
  };
}