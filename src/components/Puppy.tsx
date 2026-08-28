import { PUPPY_POSE_SRC, type PuppyPose } from '../lib/puppyArt'
import './Puppy.css'

/**
 * Recurring illustrated puppy character, drawn in the same hand-sketched line
 * style as the save-the-date.
 *
 * Both poses stay mounted and cross-fade, which preloads the second image and
 * avoids a flash when the pose changes mid-animation. The artwork shares one
 * frame across poses so the puppy does not shift or rescale between them.
 *
 * The art has a real alpha channel with the ink colour baked in, so it needs no
 * blend mode and keeps working inside transformed ancestors.
 */
export function Puppy({
  pose = 'run',
  className = '',
  facing = 'right',
}: {
  pose?: PuppyPose
  className?: string
  facing?: 'left' | 'right'
}) {
  return (
    <div
      className={`puppy puppy--facing-${facing} ${className}`.trim()}
      data-pose={pose}
      aria-hidden="true"
    >
      {Object.entries(PUPPY_POSE_SRC).map(([name, src]) => (
        <img key={name} className={`puppy__pose puppy__pose--${name}`} src={src} alt="" />
      ))}
    </div>
  )
}
