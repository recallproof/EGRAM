#!/usr/bin/env node
import { runProtocolDemo } from './demo'

const result = await runProtocolDemo()

console.log(
  JSON.stringify(
    {
      protocol: 'Engram Protocol',
      packet: {
        id: result.packet.id,
        hash: result.packet.hash,
        conflictState: result.packet.conflictState,
        revisions: result.packet.revisions.length,
      },
      recallProof: result.proof,
      ledger: result.ledger.map((event) => ({
        type: event.type,
        eventHash: event.eventHash,
        previousEventHash: event.previousEventHash,
      })),
      verified: result.verified,
    },
    null,
    2,
  ),
)
