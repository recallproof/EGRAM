import {
  appendLedgerEvent,
  createMemoryPacket,
  createRecallProof,
  reviseMemoryPacket,
  verifyLedger,
  verifyMemoryPacket,
  verifyRecallProof,
} from './index'

export async function runProtocolDemo() {
  const packet = await createMemoryPacket({
    content: 'Engram Protocol is the trust layer for agent memory.',
    source: {
      kind: 'user_input',
      label: 'project-narrative-session',
      observedAt: '2026-05-23T00:00:00.000Z',
    },
    createdAt: '2026-05-23T00:01:00.000Z',
    metadata: {
      topic: 'project.positioning',
      launchTicker: 'ENGRAM',
    },
  })

  const revised = await reviseMemoryPacket(packet, {
    content: 'Engram Protocol gives autonomous agents verifiable memory.',
    reason: 'Tightened launch wording.',
    changedAt: '2026-05-23T00:02:00.000Z',
  })

  const proof = await createRecallProof(revised, {
    query: 'What does Engram Protocol do?',
    reason: 'Produce launch copy from verified memory.',
    recalledAt: '2026-05-23T00:03:00.000Z',
  })

  const createdLedger = await appendLedgerEvent([], {
    type: 'memory.created',
    packet,
    timestamp: packet.createdAt,
  })
  const revisedLedger = await appendLedgerEvent(createdLedger, {
    type: 'memory.revised',
    packet: revised,
    timestamp: revised.updatedAt,
    payload: { previousHash: packet.hash },
  })
  const ledger = await appendLedgerEvent(revisedLedger, {
    type: 'memory.recalled',
    packet: revised,
    timestamp: proof.recalledAt,
    payload: { proofHash: proof.proofHash },
  })

  return {
    packet: revised,
    proof,
    ledger,
    verified: {
      packet: await verifyMemoryPacket(revised),
      proof: await verifyRecallProof(proof, revised),
      ledger: await verifyLedger(ledger),
    },
  }
}
