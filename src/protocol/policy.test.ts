import { describe, expect, it } from 'vitest'
import { EngramMemory, PolicyViolationError } from './index'

const source = {
  kind: 'user_input' as const,
  label: 'policy-session',
  observedAt: '2026-05-23T02:00:00.000Z',
}

describe('Engram policy layer', () => {
  it('blocks low-quality memory packets', async () => {
    const memory = new EngramMemory()

    await expect(
      memory.remember({
        content: 'x',
        source,
        createdAt: '2026-05-23T02:01:00.000Z',
      }),
    ).rejects.toBeInstanceOf(PolicyViolationError)
  })

  it('requires approval before storing sensitive memory', async () => {
    const memory = new EngramMemory()

    await expect(
      memory.remember({
        content: 'The user password is swordfish.',
        source,
        createdAt: '2026-05-23T02:02:00.000Z',
      }),
    ).rejects.toMatchObject({
      decision: { ruleId: 'remember.sensitive', status: 'requires_approval' },
    })

    const packet = await memory.remember({
      content: 'The user password is swordfish.',
      source,
      createdAt: '2026-05-23T02:03:00.000Z',
      approvedPolicyIds: ['remember.sensitive'],
    })

    expect(packet.flags).toContain('sensitive')
    expect(packet.metadata.policy).toBe('remember.sensitive')
  })

  it('requires approval before recalling sensitive memory', async () => {
    const memory = new EngramMemory()
    await memory.remember({
      content: 'The user api key is redacted.',
      source,
      createdAt: '2026-05-23T02:04:00.000Z',
      approvedPolicyIds: ['remember.sensitive'],
      metadata: { topic: 'credential' },
    })

    const blockedRecall = await memory.recall({
      topic: 'credential',
      reason: 'Attempt normal recall.',
      recalledAt: '2026-05-23T02:05:00.000Z',
      includeFlagged: true,
    })
    const approvedRecall = await memory.recall({
      topic: 'credential',
      reason: 'User approved sensitive recall.',
      recalledAt: '2026-05-23T02:06:00.000Z',
      includeFlagged: true,
      approvedPolicyIds: ['recall.sensitive'],
    })

    expect(blockedRecall).toHaveLength(0)
    expect(approvedRecall).toHaveLength(1)
    expect(approvedRecall[0].policy.ruleId).toBe('recall.sensitive')
  })

  it('adds expiry and trust cap to tool-result memories', async () => {
    const memory = new EngramMemory()
    const packet = await memory.remember({
      content: 'Token price observation came from a tool call.',
      source: {
        kind: 'tool_result',
        label: 'price-tool',
        observedAt: '2026-05-23T02:07:00.000Z',
      },
      createdAt: '2026-05-23T02:07:00.000Z',
      trustScore: 0.95,
    })

    expect(packet.expiresAt).toBe('2026-05-30T02:07:00.000Z')
    expect(packet.trustScore).toBe(0.62)
    expect(packet.metadata.policy).toBe('remember.tool_result_ttl')
  })
})
