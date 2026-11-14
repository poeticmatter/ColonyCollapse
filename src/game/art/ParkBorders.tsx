import { memo } from 'react'
import { DISTRICT_BORDER_SEGMENTS } from '../board/geometry'
import { PARK_GRASS_WIDTH, buildSegmentWildflowers } from './parkWildflowers'

// District borders are narrow parks: a strip of grass, edged dark so it reads
// against both chalk issue cells and the dark slots, with wildflowers growing in.
const PARK_EDGE_COLOR = '#12261A'
const PARK_EDGE_WIDTH = 26
const PARK_GRASS_COLOR = '#3F7A3B'

// The board is static, so the flowers are computed once.
const SEGMENT_WILDFLOWERS = DISTRICT_BORDER_SEGMENTS.map(buildSegmentWildflowers)

function ParkStrip({ stroke, strokeWidth }: { stroke: string; strokeWidth: number }) {
  return (
    <g strokeLinecap="round" stroke={stroke} strokeWidth={strokeWidth}>
      {DISTRICT_BORDER_SEGMENTS.map(({ from, to }, index) => (
        <line key={index} x1={from.x} y1={from.y} x2={to.x} y2={to.y} />
      ))}
    </g>
  )
}

/** The grass strips between districts, in board coordinates around the hub. */
export const ParkBorders = memo(function ParkBorders() {
  return (
    <g pointerEvents="none">
      <ParkStrip stroke={PARK_EDGE_COLOR} strokeWidth={PARK_EDGE_WIDTH} />
      <ParkStrip stroke={PARK_GRASS_COLOR} strokeWidth={PARK_GRASS_WIDTH} />
      {SEGMENT_WILDFLOWERS.map(({ origin, angleDegrees, patches }, segmentIndex) => (
        <g key={segmentIndex} transform={`translate(${origin.x}, ${origin.y}) rotate(${angleDegrees})`}>
          {patches.map((patch, patchIndex) => (
            <path key={patchIndex} d={patch.path} fill={patch.color} />
          ))}
        </g>
      ))}
    </g>
  )
})
