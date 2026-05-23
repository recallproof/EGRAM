import { describe, expect, it } from 'vitest'
import {
  appendLedgerEvent,
  createMemoryPacket,
  createMemorySnapshot,
  createRecallProof,
  verifyPacketBundle,
} from './index'

const source = {
  kind: 'user_input' as const,
  label: 'verifier-test',
  observedAt: '2026-05-23T04:00:00.000Z',
}

describe('packet bundle verifier', () => {
  it('returns a detailed pass report for packet, proof, ledger, and snapshot', async () => {
    const packet = await createMemoryPacket({
      content: 'Verifier reports should explain packet trust.',
      source,
      createdAt: '2026-05-23T04:01:00.000Z',
    })
    const proof = await createRecallProof(packet, {
      query: 'Why did the agent use this memory?',
      reason: 'Explain recall verification.',
      recalledAt: '2026-05-23T04:02:00.000Z',
    })
    const ledger = await appendLedgerEvent([], {
      type: 'memory.created',
      packet,
      timestamp: packet.createdAt,
    })
    const snapshot = await createMemorySnapshot({
      packets: [packet],
      ledger,
      exportedAt: '2026-05-23T04:03:00.000Z',
    })

    const report = await verifyPacketBundle({ packet, proof, ledger, snapshot })

    expect(report.status).toBe('pass')
    expect(report.checks.map((check) => check.name)).toEqual([
      'packet.integrity',
      'proof.binding',
      'ledger.chain',
      'snapshot.integrity',
    ])
  })

  it('returns a fail report for tampered packets', async () => {
    const packet = await createMemoryPacket({
      content: 'Original memory.',
      source,
      createdAt: '2026-05-23T04:04:00.000Z',
    })
    const tampered = { ...packet, content: 'Tampered memory.' }

    const report = await verifyPacketBundle({ packet: tampered })

    expect(report.status).toBe('fail')
    expect(report.checks[0]).toMatchObject({
      name: 'packet.integrity',
      status: 'fail',
    })
  })
})
