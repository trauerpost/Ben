/**
 * Canvas-based unsharp mask for image sharpening.
 *
 * Always works on the SOURCE image (imageUrl), never on a previously
 * sharpened result. Performance guard: scales down to max 1500px width
 * before processing to stay safe on mobile devices.
 */

/**
 * Apply a 3x3 Gaussian-like box blur, then subtract from original
 * scaled by `strength` to produce an unsharp-mask effect.
 */
function applyUnsharpMask(
  imageData: ImageData,
  strength: number
): ImageData {
  const { width, height, data } = imageData;
  const len = data.length;

  // Create blurred copy using a 3x3 kernel:
  //   1 2 1
  //   2 4 2  / 16
  //   1 2 1
  const blurred = new Uint8ClampedArray(len);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      for (let c = 0; c < 4; c++) {
        let sum = 0;
        let weight = 0;

        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const ny = y + ky;
            const nx = x + kx;

            if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
              const idx = (ny * width + nx) * 4 + c;
              // Kernel weights: corners=1, edges=2, center=4
              const w =
                kx === 0 && ky === 0
                  ? 4
                  : kx === 0 || ky === 0
                    ? 2
                    : 1;
              sum += data[idx] * w;
              weight += w;
            }
          }
        }

        blurred[(y * width + x) * 4 + c] = sum / weight;
      }
    }
  }

  // Subtract blurred from original, scaled by strength, and clamp
  const result = new ImageData(width, height);
  const out = result.data;

  for (let i = 0; i < len; i++) {
    // Alpha channel: pass through unchanged
    if (i % 4 === 3) {
      out[i] = data[i];
      continue;
    }
    const sharpened = data[i] + (data[i] - blurred[i]) * strength;
    out[i] = Math.min(255, Math.max(0, Math.round(sharpened)));
  }

  return result;
}

/**
 * Apply unsharp mask sharpening to an image.
 * Always works on the SOURCE image, never on a previously sharpened result.
 * Performance guard: scales image down to max 1500px width before processing.
 *
 * @param imageUrl - Source image URL or data URL
 * @param amount - Sharpening amount (0-100). 0 = no sharpening.
 * @returns data URL of the sharpened image (PNG)
 */
export function sharpenImage(
  imageUrl: string,
  amount: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      // Scale down for performance (mobile safety)
      let w = img.width;
      let h = img.height;
      const MAX_W = 1500;
      if (w > MAX_W) {
        h = Math.round(h * (MAX_W / w));
        w = MAX_W;
      }

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, w, h);

      if (amount > 0) {
        const imageData = ctx.getImageData(0, 0, w, h);
        const sharpened = applyUnsharpMask(imageData, amount / 100);
        ctx.putImageData(sharpened, 0, 0);
      }

      resolve(canvas.toDataURL("image/png"));
    };

    img.onerror = () => reject(new Error("Failed to load image for sharpening"));
    img.src = imageUrl;
  });
}
