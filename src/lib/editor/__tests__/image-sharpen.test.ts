/**
 * @vitest-environment jsdom
 *
 * Uses jsdom to provide document.createElement and other DOM APIs.
 * jsdom does NOT implement real Canvas 2D rendering, so we mock
 * getContext("2d") to return controllable ImageData.
 *
 * What these tests cover:
 *   - Module shape (export exists, correct arity)
 *   - sharpenImage with amount=0 passes image through without sharpening
 *   - sharpenImage with amount>0 calls the unsharp mask pipeline
 *   - sharpenImage rejects on image load error
 *   - sharpenImage scales down images wider than 1500px
 *
 * What needs E2E / browser testing:
 *   - Actual pixel-level sharpening correctness (Canvas 2D is not real in jsdom)
 *   - Real image loading from URLs / data URIs
 *   - Performance on large images / mobile devices
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { sharpenImage } from "../image-sharpen";

// ---------------------------------------------------------------------------
// Polyfill ImageData — jsdom does not provide it
// ---------------------------------------------------------------------------

if (typeof globalThis.ImageData === "undefined") {
  (globalThis as Record<string, unknown>).ImageData = class ImageData {
    readonly width: number;
    readonly height: number;
    readonly data: Uint8ClampedArray;
    constructor(width: number, height: number) {
      this.width = width;
      this.height = height;
      this.data = new Uint8ClampedArray(width * height * 4);
    }
  };
}

// ---------------------------------------------------------------------------
// Shared state for mocks
// ---------------------------------------------------------------------------

let putImageDataSpy: ReturnType<typeof vi.fn>;
let drawImageSpy: ReturnType<typeof vi.fn>;
let mockImageData: ImageData;

const OrigImage = globalThis.Image;

function setupCanvasMock(): void {
  mockImageData = new ImageData(100, 80);
  // Fill with non-trivial pixel values so unsharp mask has something to process
  for (let i = 0; i < mockImageData.data.length; i += 4) {
    mockImageData.data[i] = 128; // R
    mockImageData.data[i + 1] = 64; // G
    mockImageData.data[i + 2] = 32; // B
    mockImageData.data[i + 3] = 255; // A
  }

  putImageDataSpy = vi.fn();
  drawImageSpy = vi.fn();

  const origCreateElement = document.createElement.bind(document);
  vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
    if (tag === "canvas") {
      const fakeCanvas = origCreateElement("canvas");
      fakeCanvas.getContext = vi.fn(() => ({
        drawImage: drawImageSpy,
        getImageData: vi.fn(() => mockImageData),
        putImageData: putImageDataSpy,
      })) as unknown as typeof fakeCanvas.getContext;
      fakeCanvas.toDataURL = vi.fn(() => "data:image/png;base64,MOCK");
      return fakeCanvas;
    }
    return origCreateElement(tag);
  });
}

/**
 * Replace globalThis.Image with a mock class that triggers onload
 * asynchronously when .src is set, with configurable width/height.
 */
function mockImageConstructor(width: number, height: number): void {
  // Must use a function (not arrow) so it can be called with `new`
  globalThis.Image = function MockImage(this: HTMLImageElement) {
    const img = new OrigImage();
    Object.defineProperty(img, "width", { get: () => width, configurable: true });
    Object.defineProperty(img, "height", { get: () => height, configurable: true });
    Object.defineProperty(img, "src", {
      set(_val: string) {
        Promise.resolve().then(() => {
          if (img.onload) {
            (img.onload as (ev: Event) => void).call(img, new Event("load"));
          }
        });
      },
      get() {
        return "";
      },
      configurable: true,
    });
    return img;
  } as unknown as typeof Image;
}

/**
 * Replace globalThis.Image with a mock that triggers onerror.
 */
function mockImageConstructorError(): void {
  globalThis.Image = function MockImageError(this: HTMLImageElement) {
    const img = new OrigImage();
    Object.defineProperty(img, "src", {
      set(_val: string) {
        Promise.resolve().then(() => {
          if (img.onerror) {
            (img.onerror as (ev: Event) => void).call(img, new Event("error"));
          }
        });
      },
      get() {
        return "";
      },
      configurable: true,
    });
    return img;
  } as unknown as typeof Image;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("image-sharpen module", () => {
  afterEach(() => {
    globalThis.Image = OrigImage;
    vi.restoreAllMocks();
  });

  describe("module shape", () => {
    it("exports sharpenImage as a function", () => {
      expect(typeof sharpenImage).toBe("function");
    });

    it("sharpenImage accepts 2 parameters (imageUrl, amount)", () => {
      expect(sharpenImage.length).toBe(2);
    });
  });

  describe("sharpenImage", () => {
    beforeEach(() => {
      setupCanvasMock();
    });

    it("returns a data URL string", async () => {
      mockImageConstructor(100, 80);

      const result = await sharpenImage("http://example.com/photo.jpg", 50);
      expect(typeof result).toBe("string");
      expect(result).toBe("data:image/png;base64,MOCK");
    });

    it("with amount=0 does NOT apply unsharp mask (putImageData not called)", async () => {
      mockImageConstructor(100, 80);

      await sharpenImage("http://example.com/photo.jpg", 0);

      // When amount=0 the code skips the sharpening branch entirely
      expect(putImageDataSpy).not.toHaveBeenCalled();
    });

    it("with amount>0 applies unsharp mask (putImageData IS called)", async () => {
      mockImageConstructor(100, 80);

      await sharpenImage("http://example.com/photo.jpg", 50);

      expect(putImageDataSpy).toHaveBeenCalledTimes(1);
    });

    it("scales down images wider than 1500px", async () => {
      mockImageConstructor(3000, 2000);

      await sharpenImage("http://example.com/huge.jpg", 30);

      // drawImage is called with scaled dimensions: 1500 x 1000
      expect(drawImageSpy).toHaveBeenCalledTimes(1);
      const [, , , drawW, drawH] = drawImageSpy.mock.calls[0];
      expect(drawW).toBe(1500);
      expect(drawH).toBe(1000);
    });

    it("does NOT scale images at exactly 1500px wide", async () => {
      mockImageConstructor(1500, 1000);

      await sharpenImage("http://example.com/exact.jpg", 30);

      const [, , , drawW, drawH] = drawImageSpy.mock.calls[0];
      expect(drawW).toBe(1500);
      expect(drawH).toBe(1000);
    });

    it("does NOT scale images narrower than 1500px", async () => {
      mockImageConstructor(800, 600);

      await sharpenImage("http://example.com/small.jpg", 30);

      const [, , , drawW, drawH] = drawImageSpy.mock.calls[0];
      expect(drawW).toBe(800);
      expect(drawH).toBe(600);
    });

    it("rejects when image fails to load (negative test)", async () => {
      mockImageConstructorError();

      await expect(
        sharpenImage("http://example.com/broken.jpg", 50),
      ).rejects.toThrow("Failed to load image for sharpening");
    });
  });
});
