import { hashCanonical } from './hash'
import type {
  ConflictState,
  CreateMemoryPacketInput,
  MemoryFlag,
  MemoryPacket,
  MemoryRevision,
} from './types'

type PacketBody = Omit<MemoryPacket, 'hash'>

export async function createMemoryPacket(input: CreateMemoryPacketInput): Promise<MemoryPacket> {
  const createdAt = input.createdAt ?? new Date().toISOString()
  const base: PacketBody = {
    id: '',
    content: input.content,
    source: input.source,
    createdAt,
    updatedAt: createdAt,
    expiresAt: input.expiresAt,
    trustScore: clampTrustScore(input.trustScore ?? 0.72),
    conflictState: 'none',
    flags: input.flags ?? [],
    metadata: input.metadata ?? {},
    revisions: [],
  }
  const hash = await hashPacketBody(base)

  return {
    ...base,
    id: `mem_${hash.slice(0, 16)}`,
    hash: await hashPacketBody({ ...base, id: `mem_${hash.slice(0, 16)}` }),
  }
}

export async function verifyMemoryPacket(packet: MemoryPacket): Promise<boolean> {
  const { hash, ...body } = packet
  return hash === (await hashPacketBody(body))
}

export async function reviseMemoryPacket(
  packet: MemoryPacket,
  change: { content: string; reason: string; changedAt?: string },
): Promise<MemoryPacket> {
  const changedAt = change.changedAt ?? new Date().toISOString()
  const revision: MemoryRevision = {
    revision: packet.revisions.length + 1,
    previousHash: packet.hash,
    reason: change.reason,
    changedAt,
    content: packet.content,
  }
  const body: PacketBody = {
    ...withoutHash(packet),
    content: change.content,
    updatedAt: changedAt,
    revisions: [...packet.revisions, revision],
  }

  return {
    ...body,
    hash: await hashPacketBody(body),
  }
}

export async function flagMemoryPacket(
  packet: MemoryPacket,
  flag: MemoryFlag,
  changedAt = new Date().toISOString(),
): Promise<MemoryPacket> {
  const flags = Array.from(new Set([...packet.flags, flag])).sort()
  const body: PacketBody = {
    ...withoutHash(packet),
    updatedAt: changedAt,
    flags,
  }

  return {
    ...body,
    hash: await hashPacketBody(body),
  }
}

export async function setConflictState(
  packet: MemoryPacket,
  conflictState: ConflictState,
  changedAt = new Date().toISOString(),
): Promise<MemoryPacket> {
  const body: PacketBody = {
    ...withoutHash(packet),
    updatedAt: changedAt,
    conflictState,
  }

  return {
    ...body,
    hash: await hashPacketBody(body),
  }
}

export function isExpired(packet: MemoryPacket, now = new Date().toISOString()): boolean {
  return Boolean(packet.expiresAt && packet.expiresAt <= now)
}

async function hashPacketBody(body: PacketBody): Promise<string> {
  return hashCanonical(body)
}

function withoutHash(packet: MemoryPacket): PacketBody {
  const { hash: _hash, ...body } = packet
  void _hash
  return body
}

function clampTrustScore(score: number): number {
  return Math.min(1, Math.max(0, Number(score.toFixed(4))))
}
