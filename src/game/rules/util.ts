import type { Seat } from './types'

/** The numbers 0..count-1. */
export function range(count: number): number[] {
  return Array.from({ length: count }, (_, index) => index)
}

/**
 * A seat named in log text. The log is stored with the game, but a seat's look (and so its
 * colour name) depends on who is viewing (the solo playtest disguises seats), so the text
 * holds a token that the board replaces with the seat's displayed name. See `splitLogText`.
 */
export function seatName(seat: Seat): string {
  return `{seat:${seat}}`
}

const SEAT_TOKEN = /\{seat:(\d+)\}/g

export type LogTextPart = { kind: 'text'; text: string } | { kind: 'seat'; seat: Seat }

/** Splits log text into plain runs and the seats named in it. */
export function splitLogText(text: string): LogTextPart[] {
  const parts: LogTextPart[] = []
  let cursor = 0
  for (const match of text.matchAll(SEAT_TOKEN)) {
    const start = match.index ?? 0
    if (start > cursor) parts.push({ kind: 'text', text: text.slice(cursor, start) })
    parts.push({ kind: 'seat', seat: Number(match[1]) })
    cursor = start + match[0].length
  }
  if (cursor < text.length) parts.push({ kind: 'text', text: text.slice(cursor) })
  return parts
}
