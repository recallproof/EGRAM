import type { MemoryPacket } from './types'

export interface ConflictReport {
  conflicting: boolean
  reason: string
  packetIds: [string, string]
}

export function detectMemoryConflict(a: MemoryPacket, b: MemoryPacket): ConflictReport {
  const topicA = a.metadata.topic
  const topicB = b.metadata.topic
  const sameTopic = Boolean(topicA && topicB && topicA === topicB)
  const sameSourceLabel = a.source.label === b.source.label
  const differentContent = normalize(a.content) !== normalize(b.content)

  return {
    conflicting: (sameTopic || sameSourceLabel) && differentContent,
    reason:
      (sameTopic || sameSourceLabel) && differentContent
        ? 'Packets share a topic or source label but contain different claims.'
        : 'No direct memory conflict detected.',
    packetIds: [a.id, b.id],
  }
}

function normalize(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase()
}
