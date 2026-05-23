import { describe, expect, it } from 'vitest'
import {
  appendLedgerEvent,
  createMemoryPacket,
  createRecallProof,
  detectMemoryConflict,
  flagMemoryPacket,
  isExpired,
  reviseMemoryPacket,
  verifyLedger,
  verifyMemoryPacket,
  verifyRecallProof,
} from './index'

const source = {
  kind: 'user_input' as const,
  label: 'launch-chat',
  observedAt: '2026-05-23T00:00:00.000Z',
}

describe('Engram protocol core', () => {
  it('creates verifiable memory packets with deterministic hashes', async () => {
    const packet = await createMemoryPacket({
      content: 'The user prefers cold black premium branding.',
      source,
      createdAt: '2026-05-23T00:01:00.000Z',
      metadata: { topic: 'brand.preference' },
    })

    expect(packet.id).toMatch(/^mem_/)
    expect(packet.hash).toHaveLength(64)
    expect(await verifyMemoryPacket(packet)).toBe(true)
  })

  it('detects tampered packets', async () => {
    const packet = await createMemoryPacket({
      content: 'Agents should prove what they remember.',
      source,
      createdAt: '2026-05-23T00:02:00.000Z',
    })
    const tampered = { ...packet, content: 'Agents should trust every memory silently.' }

    expect(await verifyMemoryPacket(tampered)).toBe(false)
  })

  it('revises memory while preserving previous hash', async () => {
    const packet = await createMemoryPacket({
      content: 'Ticker is undecided.',
      source,
      createdAt: '2026-05-23T00:03:00.000Z',
    })
    const revised = await reviseMemoryPacket(packet, {
      content: 'Ticker is ENGRAM.',
      reason: 'User selected a short ticker.',
      changedAt: '2026-05-23T00:04:00.000Z',
    })

    expect(revised.revisions).toHaveLength(1)
    expect(revised.revisions[0].previousHash).toBe(packet.hash)
    expect(await verifyMemoryPacket(revised)).toBe(true)
  })

  it('creates recall proofs bound to a specific packet hash', async () => {
    const packet = await createMemoryPacket({
      content: 'Engram Protocol is the trust layer for agent memory.',
      source,
      createdAt: '2026-05-23T00:05:00.000Z',
    })
    const proof = await createRecallProof(packet, {
      query: 'What is the one-line narrative?',
      reason: 'Used to answer launch positioning.',
      recalledAt: '2026-05-23T00:06:00.000Z',
    })

    expect(proof.proofHash).toHaveLength(64)
    expect(await verifyRecallProof(proof, packet)).toBe(true)
  })

  it('chains ledger events and verifies event integrity', async () => {
    const packet = await createMemoryPacket({
      content: 'Memory without proof is persistent hallucination risk.',
      source,
      createdAt: '2026-05-23T00:07:00.000Z',
    })
    const first = await appendLedgerEvent([], {
      type: 'memory.created',
      packet,
      timestamp: '2026-05-23T00:08:00.000Z',
    })
    const proof = await createRecallProof(packet, {
      query: 'Why does recall proof matter?',
      reason: 'Explain protocol trust.',
      recalledAt: '2026-05-23T00:09:00.000Z',
    })
    const ledger = await appendLedgerEvent(first, {
      type: 'memory.recalled',
      packet,
      timestamp: proof.recalledAt,
      payload: { proofHash: proof.proofHash },
    })

    expect(ledger[1].previousEventHash).toBe(ledger[0].eventHash)
    expect(await verifyLedger(ledger)).toBe(true)
  })

  it('flags, expires, and detects conflicting memory', async () => {
    const oldPacket = await createMemoryPacket({
      content: 'The project name is POMEM.',
      source,
      createdAt: '2026-05-23T00:10:00.000Z',
      expiresAt: '2026-05-23T00:11:00.000Z',
      metadata: { topic: 'project.name' },
    })
    const newPacket = await createMemoryPacket({
      content: 'The project name is Engram Protocol.',
      source: { ...source, label: 'renaming-chat' },
      createdAt: '2026-05-23T00:12:00.000Z',
      metadata: { topic: 'project.name' },
    })
    const flagged = await flagMemoryPacket(oldPacket, 'stale', '2026-05-23T00:13:00.000Z')
    const conflict = detectMemoryConflict(flagged, newPacket)

    expect(flagged.flags).toContain('stale')
    expect(isExpired(flagged, '2026-05-23T00:12:00.000Z')).toBe(true)
    expect(conflict.conflicting).toBe(true)
  })
})
