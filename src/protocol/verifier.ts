import { verifyLedger } from './ledger'
import { verifyMemoryPacket } from './packet'
import { verifyRecallProof } from './proof'
import { verifyMemorySnapshot, type MemorySnapshot } from './snapshot'
import type { LedgerEvent, MemoryPacket, RecallProof } from './types'

export type VerificationStatus = 'pass' | 'fail'

export interface VerificationCheck {
  name: string
  status: VerificationStatus
  detail: string
}

export interface VerificationReport {
  status: VerificationStatus
  checks: VerificationCheck[]
}

export async function verifyPacketBundle(input: {
  packet?: MemoryPacket
  proof?: RecallProof
  ledger?: LedgerEvent[]
  snapshot?: MemorySnapshot
}): Promise<VerificationReport> {
  const checks: VerificationCheck[] = []

  if (input.packet) {
    const valid = await verifyMemoryPacket(input.packet)
    checks.push({
      name: 'packet.integrity',
      status: toStatus(valid),
      detail: valid ? 'Packet hash matches canonical packet body.' : 'Packet hash mismatch.',
    })
  }

  if (input.packet && input.proof) {
    const valid = await verifyRecallProof(input.proof, input.packet)
    checks.push({
      name: 'proof.binding',
      status: toStatus(valid),
      detail: valid
        ? 'Recall proof is bound to the packet id and hash.'
        : 'Recall proof does not match the packet.',
    })
  }

  if (input.ledger) {
    const valid = await verifyLedger(input.ledger)
    checks.push({
      name: 'ledger.chain',
      status: toStatus(valid),
      detail: valid
        ? 'Ledger event hashes and previous links are valid.'
        : 'Ledger chain integrity check failed.',
    })
  }

  if (input.snapshot) {
    const valid = await verifyMemorySnapshot(input.snapshot)
    checks.push({
      name: 'snapshot.integrity',
      status: toStatus(valid),
      detail: valid
        ? 'Snapshot hash, packet count, ledger count, and embedded objects are valid.'
        : 'Snapshot integrity check failed.',
    })
  }

  return {
    status: checks.every((check) => check.status === 'pass') ? 'pass' : 'fail',
    checks,
  }
}

function toStatus(valid: boolean): VerificationStatus {
  return valid ? 'pass' : 'fail'
}
