import { isExpired, verifyMemoryPacket } from './packet'
import type { MemoryFlag, MemoryPacket } from './types'

export interface MemoryQuery {
  text?: string
  topic?: string
  sourceLabel?: string
  includeExpired?: boolean
  includeFlagged?: boolean
  limit?: number
  now?: string
}

export interface MemorySearchResult {
  packet: MemoryPacket
  score: number
  matchedBy: string[]
}

export interface MemoryStore {
  put(packet: MemoryPacket): Promise<void>
  get(id: string): Promise<MemoryPacket | undefined>
  delete(id: string): Promise<boolean>
  list(): Promise<MemoryPacket[]>
  search(query: MemoryQuery): Promise<MemorySearchResult[]>
}

export class InMemoryMemoryStore implements MemoryStore {
  readonly #packets = new Map<string, MemoryPacket>()

  async put(packet: MemoryPacket): Promise<void> {
    if (!(await verifyMemoryPacket(packet))) {
      throw new Error(`Cannot store packet with invalid hash: ${packet.id}`)
    }

    this.#packets.set(packet.id, structuredClone(packet))
  }

  async get(id: string): Promise<MemoryPacket | undefined> {
    const packet = this.#packets.get(id)
    return packet ? structuredClone(packet) : undefined
  }

  async delete(id: string): Promise<boolean> {
    return this.#packets.delete(id)
  }

  async list(): Promise<MemoryPacket[]> {
    return Array.from(this.#packets.values()).map((packet) => structuredClone(packet))
  }

  async search(query: MemoryQuery): Promise<MemorySearchResult[]> {
    const now = query.now ?? new Date().toISOString()
    const limit = query.limit ?? 10
    const results = Array.from(this.#packets.values())
      .filter((packet) => query.includeExpired || !isExpired(packet, now))
      .filter((packet) => query.includeFlagged || isRecallSafe(packet.flags))
      .map((packet) => scorePacket(packet, query))
      .filter((result) => result.score > 0 || !query.text)
      .sort((a, b) => b.score - a.score || b.packet.updatedAt.localeCompare(a.packet.updatedAt))
      .slice(0, limit)

    return results.map((result) => ({
      ...result,
      packet: structuredClone(result.packet),
    }))
  }
}

function scorePacket(packet: MemoryPacket, query: MemoryQuery): MemorySearchResult {
  const matchedBy: string[] = []
  let score = 0

  if (query.topic && packet.metadata.topic === query.topic) {
    score += 5
    matchedBy.push('topic')
  }

  if (query.sourceLabel && packet.source.label === query.sourceLabel) {
    score += 3
    matchedBy.push('source')
  }

  if (query.text) {
    const tokens = tokenize(query.text)
    const haystack = tokenize(
      `${packet.content} ${packet.source.label} ${Object.values(packet.metadata).join(' ')}`,
    )
    const matches = Array.from(tokens).filter((token) => haystack.has(token))
    score += matches.length
    if (matches.length > 0) {
      matchedBy.push('text')
    }
  }

  score += packet.trustScore

  if (packet.conflictState === 'confirmed' || packet.conflictState === 'suspected') {
    score -= 2
    matchedBy.push('conflict-penalty')
  }

  return { packet, score, matchedBy }
}

function isRecallSafe(flags: MemoryFlag[]): boolean {
  return !flags.some((flag) => flag === 'false_memory' || flag === 'poisoned' || flag === 'disproven')
}

function tokenize(value: string): Set<string> {
  return new Set(
    value
      .toLowerCase()
      .split(/[^a-z0-9._-]+/u)
      .filter(Boolean),
  )
}
