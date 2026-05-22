import { hashCanonical } from './hash'
import type { MemoryPacket, RecallProof } from './types'

export async function createRecallProof(
  packet: MemoryPacket,
  input: { query: string; reason: string; recalledAt?: string },
): Promise<RecallProof> {
  const proofBody = {
    memoryId: packet.id,
    memoryHash: packet.hash,
    recalledAt: input.recalledAt ?? new Date().toISOString(),
    query: input.query,
    reason: input.reason,
  }

  return {
    ...proofBody,
    proofHash: await hashCanonical(proofBody),
  }
}

export async function verifyRecallProof(
  proof: RecallProof,
  packet: MemoryPacket,
): Promise<boolean> {
  const { proofHash, ...proofBody } = proof
  return (
    proof.memoryId === packet.id &&
    proof.memoryHash === packet.hash &&
    proofHash === (await hashCanonical(proofBody))
  )
}
