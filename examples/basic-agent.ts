import { EngramMemory, verifyMemorySnapshot } from '../src/protocol'

const memory = new EngramMemory()

const source = {
  kind: 'user_input' as const,
  label: 'example-agent-session',
  observedAt: '2026-05-23T02:14:00.000Z',
}

const packet = await memory.remember({
  content: 'The user prefers verifiable memory over longer context.',
  source,
  metadata: {
    topic: 'agent.memory.preference',
    chain: 'solana',
  },
  createdAt: '2026-05-23T02:15:00.000Z',
})

const recalls = await memory.recall({
  topic: 'agent.memory.preference',
  reason: 'Prepare an agent response from verified memory.',
  recalledAt: '2026-05-23T02:16:00.000Z',
})

const snapshot = await memory.snapshot('2026-05-23T02:17:00.000Z')

console.log(
  JSON.stringify(
    {
      packet: {
        id: packet.id,
        hash: packet.hash,
        source: packet.source,
      },
      recallProof: recalls[0]?.proof,
      ledgerEvents: memory.ledger().map((event) => ({
        type: event.type,
        eventHash: event.eventHash,
        previousEventHash: event.previousEventHash,
      })),
      snapshot: {
        schema: snapshot.schema,
        snapshotHash: snapshot.snapshotHash,
        valid: await verifyMemorySnapshot(snapshot),
      },
    },
    null,
    2,
  ),
)
