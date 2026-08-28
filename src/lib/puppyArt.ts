/**
 * Metadata about the puppy artwork, kept out of the component file so the
 * component module only exports components.
 */

export const PUPPY_POSE_SRC = {
  run: '/images/puppy-run.webp',
  look: '/images/puppy-look.webp',
} as const

export type PuppyPose = keyof typeof PUPPY_POSE_SRC

/**
 * Where the muzzle sits within the artwork frame, as fractions of the frame's
 * width and height. Animations use this to hand objects to the puppy's mouth.
 */
export const PUPPY_MOUTH = { x: 0.82, y: 0.38 } as const
