import sharp from 'sharp'

/**
 * Converts the generated puppy line art (dark ink on white paper) into
 * transparent WebP sprites tinted with the site's ink colour.
 *
 * Using a real alpha channel rather than `mix-blend-mode: multiply` matters
 * because a transformed ancestor isolates blending, which made the sprite
 * render as an opaque white box.
 *
 * Alpha maths is done here in JS rather than with sharp's negate/linear
 * operators, because sharp applies those in its own fixed order regardless of
 * the order they are chained in.
 */
const INK = [0x3d, 0x2c, 0x22]

/**
 * Luminance range mapped onto alpha. At or above WHITE_POINT is paper and goes
 * fully transparent, which matters because the generated paper is slightly
 * off-white and would otherwise haze the whole frame.
 */
const WHITE_POINT = 244
const BLACK_POINT = 205

/**
 * The sprite displays at roughly a third of the source width, which thins
 * single-pixel strokes to a fraction of a pixel and washes the puppy out. So
 * the strokes are blurred to spread them, then pushed back to full opacity,
 * which fattens them enough to survive the downscale.
 */
const SPREAD_RADIUS = 1.1
const SPREAD_GAIN = 2.8
const OUTPUT_WIDTH = 540

const sources = [
  ['art/puppy-run.png', 'public/images/puppy-run.webp'],
  ['art/puppy-look.png', 'public/images/puppy-look.webp'],
]

for (const [src, out] of sources) {
  // The blur goes through an encoded PNG rather than a raw single-channel
  // round-trip: feeding raw 1-channel data back into sharp comes out with a
  // different channel count, which silently misaligns the loop below and
  // produces a smeared fragment of the image.
  const blurred = await sharp(src).greyscale().blur(SPREAD_RADIUS).png().toBuffer()

  const { data, info } = await sharp(blurred)
    .toColourspace('b-w')
    .raw()
    .toBuffer({ resolveWithObject: true })

  if (info.channels !== 1) {
    throw new Error(`expected single-channel luminance, got ${info.channels}`)
  }

  const pixels = info.width * info.height
  const rgba = Buffer.alloc(pixels * 4)
  for (let i = 0; i < pixels; i++) {
    const ramp = (WHITE_POINT - data[i]) / (WHITE_POINT - BLACK_POINT)
    const alpha = Math.max(0, Math.min(255, Math.round(ramp * 255 * SPREAD_GAIN)))
    rgba[i * 4] = INK[0]
    rgba[i * 4 + 1] = INK[1]
    rgba[i * 4 + 2] = INK[2]
    rgba[i * 4 + 3] = alpha
  }

  const result = await sharp(rgba, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .resize({ width: OUTPUT_WIDTH })
    .webp({ quality: 90, alphaQuality: 92 })
    .toFile(out)

  console.log(out, `${result.width}x${result.height}`, `${Math.round(result.size / 1024)} KB`)
}
