import sharp from 'sharp'

/**
 * Converts the save-the-date card (brown ink on white paper) into a
 * transparent WebP.
 *
 * The card is drawn onto the page's cream paper and revealed behind an animated
 * mask, and neither works with a baked-in white background: the card would show
 * as a white block on cream, and the mask would reveal visible white rectangles.
 * `mix-blend-mode: multiply` is not a safe alternative here, since a
 * transformed ancestor isolates blending — the same trap that made the puppy
 * sprite render as an opaque box.
 */

const SOURCE = 'art/save-the-date.png'
const OUT = 'public/images/save-the-date.webp'

/**
 * Luminance mapped onto alpha. Paper sits just under pure white, and the ink is
 * a mid brown rather than black, so the range is narrower than it would be for
 * a high-contrast drawing.
 */
const WHITE_POINT = 250
const BLACK_POINT = 140

const { data, info } = await sharp(SOURCE).ensureAlpha().raw().toBuffer({ resolveWithObject: true })

if (info.channels !== 4) throw new Error(`expected RGBA, got ${info.channels} channels`)

const pixels = info.width * info.height
const out = Buffer.alloc(pixels * 4)

for (let i = 0; i < pixels; i++) {
  const r = data[i * 4]
  const g = data[i * 4 + 1]
  const b = data[i * 4 + 2]
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b

  const alpha = Math.max(0, Math.min(1, (WHITE_POINT - luma) / (WHITE_POINT - BLACK_POINT)))

  if (alpha <= 0) {
    out[i * 4 + 3] = 0
    continue
  }

  /*
   * The source pixel is the ink composited over white, so recovering the ink
   * means undoing that blend. Skipping this step leaves part-transparent edge
   * pixels holding pale, whitened colour, which reads as a washed-out drawing.
   */
  for (let c = 0; c < 3; c++) {
    const over = data[i * 4 + c]
    const ink = (over - 255 * (1 - alpha)) / alpha
    out[i * 4 + c] = Math.max(0, Math.min(255, Math.round(ink)))
  }
  out[i * 4 + 3] = Math.round(alpha * 255)
}

const result = await sharp(out, {
  raw: { width: info.width, height: info.height, channels: 4 },
})
  .webp({ quality: 92, alphaQuality: 95 })
  .toFile(OUT)

console.log(OUT, `${result.width}x${result.height}`, `${Math.round(result.size / 1024)} KB`)
