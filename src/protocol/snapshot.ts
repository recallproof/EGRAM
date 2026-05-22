import { hashCanonical } from './hash'
import { verifyLedger } from './ledger'
import { verifyMemoryPacket } from './packet'
import type { LedgerEvent, MemoryPacket } from './types'

export interface MemorySnapshot {
  schema: 'engram.snapshot.v1'
  exportedAt: string
  packetCount: number
  ledgerCount: number
  packets: MemoryPacket[]
  ledger: LedgerEvent[]
  snapshotHash: string
}

export async function createMemorySnapshot(input: {
  packets: MemoryPacket[]
  ledger: LedgerEvent[]
  exportedAt?: string
}): Promise<MemorySnapshot> {
  const body = {
    schema: 'engram.snapshot.v1' as const,
    exportedAt: input.exportedAt ?? new Date().toISOString(),
    packetCount: input.packets.length,
    ledgerCount: input.ledger.length,
    packets: input.packets,
    ledger: input.ledger,
  }

  return {
    ...body,
    snapshotHash: await hashCanonical(body),
  }
}

export async function verifyMemorySnapshot(snapshot: MemorySnapshot): Promise<boolean> {
  const { snapshotHash, ...body } = snapshot

  if (snapshotHash !== (await hashCanonical(body))) {
    return false
  }

  if (snapshot.packetCount !== snapshot.packets.length) {
    return false
  }

  if (snapshot.ledgerCount !== snapshot.ledger.length) {
    return false
  }

  const packetsValid = await Promise.all(
    snapshot.packets.map((packet) => verifyMemoryPacket(packet)),
  )

  return packetsValid.every(Boolean) && (await verifyLedger(snapshot.ledger))
}
