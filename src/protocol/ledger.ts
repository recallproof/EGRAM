import { hashCanonical } from './hash'
import type { LedgerEvent, MemoryPacket } from './types'

export async function appendLedgerEvent(
  ledger: LedgerEvent[],
  input: {
    type: LedgerEvent['type']
    packet: MemoryPacket
    timestamp?: string
    payload?: Record<string, string | number | boolean>
  },
): Promise<LedgerEvent[]> {
  const previousEventHash = ledger.at(-1)?.eventHash
  const eventBody = {
    type: input.type,
    packetId: input.packet.id,
    packetHash: input.packet.hash,
    timestamp: input.timestamp ?? new Date().toISOString(),
    payload: input.payload ?? {},
    previousEventHash,
  }

  return [
    ...ledger,
    {
      ...eventBody,
      eventHash: await hashCanonical(eventBody),
    },
  ]
}

export async function verifyLedger(ledger: LedgerEvent[]): Promise<boolean> {
  for (const [index, event] of ledger.entries()) {
    const { eventHash, ...eventBody } = event
    const expectedPrevious = index === 0 ? undefined : ledger[index - 1].eventHash

    if (event.previousEventHash !== expectedPrevious) {
      return false
    }

    if (eventHash !== (await hashCanonical(eventBody))) {
      return false
    }
  }

  return true
}
