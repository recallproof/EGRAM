import { detectMemoryConflict } from './conflict'
import { appendLedgerEvent, verifyLedger } from './ledger'
import {
  createMemoryPacket,
  flagMemoryPacket,
  reviseMemoryPacket,
  setConflictState,
} from './packet'
import {
  defaultMemoryPolicy,
  enforcePolicyDecision,
  type MemoryPolicy,
  type PolicyDecision,
} from './policy'
import { createRecallProof } from './proof'
import { createMemorySnapshot, type MemorySnapshot } from './snapshot'
import { InMemoryMemoryStore, type MemoryQuery, type MemorySearchResult, type MemoryStore } from './store'
import type {
  CreateMemoryPacketInput,
  LedgerEvent,
  MemoryFlag,
  MemoryPacket,
  MemorySource,
  RecallProof,
} from './types'

export interface RememberInput {
  content: string
  source: MemorySource
  createdAt?: string
  expiresAt?: string
  trustScore?: number
  metadata?: Record<string, string | number | boolean>
  flags?: MemoryFlag[]
  approvedPolicyIds?: string[]
}

export interface RecallInput extends MemoryQuery {
  reason: string
  recalledAt?: string
  approvedPolicyIds?: string[]
}

export interface RecallResult extends MemorySearchResult {
  proof: RecallProof
  policy: PolicyDecision
}

export class EngramMemory {
  readonly #store: MemoryStore
  readonly #policy: MemoryPolicy
  #ledger: LedgerEvent[] = []

  constructor(store: MemoryStore = new InMemoryMemoryStore(), policy: MemoryPolicy = defaultMemoryPolicy) {
    this.#store = store
    this.#policy = policy
  }

  async remember(input: RememberInput): Promise<MemoryPacket> {
    const createdAt = input.createdAt ?? new Date().toISOString()
    const policyResult = this.#policy.evaluateRemember({
      content: input.content,
      sourceKind: input.source.kind,
      expiresAt: input.expiresAt,
      trustScore: input.trustScore,
      metadata: input.metadata,
      approvedPolicyIds: input.approvedPolicyIds,
      now: createdAt,
    })
    enforcePolicyDecision(policyResult.decision, input.approvedPolicyIds)

    const packet = await createMemoryPacket({
      content: input.content,
      source: input.source,
      createdAt,
      expiresAt: policyResult.expiresAt,
      trustScore: policyResult.trustScore ?? input.trustScore,
      metadata: policyResult.metadata,
      flags: Array.from(new Set([...(input.flags ?? []), ...policyResult.flags])).sort(),
    } satisfies CreateMemoryPacketInput)
    await this.#store.put(packet)
    this.#ledger = await appendLedgerEvent(this.#ledger, {
      type: 'memory.created',
      packet,
      timestamp: packet.createdAt,
      payload: {
        policyRuleId: policyResult.decision.ruleId,
        policyStatus: policyResult.decision.status,
      },
    })
    await this.#markConflicts(packet)
    return packet
  }

  async recall(input: RecallInput): Promise<RecallResult[]> {
    const results = await this.#store.search(input)
    const recalledAt = input.recalledAt ?? new Date().toISOString()
    const recalls: RecallResult[] = []

    for (const result of results) {
      const policyResult = this.#policy.evaluateRecall({
        packet: result.packet,
        reason: input.reason,
        approvedPolicyIds: input.approvedPolicyIds,
        now: recalledAt,
      })

      if (policyResult.decision.status !== 'allow') {
        if (input.approvedPolicyIds?.includes(policyResult.decision.ruleId)) {
          enforcePolicyDecision(policyResult.decision, input.approvedPolicyIds)
        } else {
          continue
        }
      }

      const proof = await createRecallProof(result.packet, {
        query: input.text ?? input.topic ?? input.sourceLabel ?? '*',
        reason: input.reason,
        recalledAt,
      })
      this.#ledger = await appendLedgerEvent(this.#ledger, {
        type: 'memory.recalled',
        packet: result.packet,
        timestamp: recalledAt,
        payload: {
          proofHash: proof.proofHash,
          reason: input.reason,
          policyRuleId: policyResult.decision.ruleId,
          policyStatus: policyResult.decision.status,
        },
      })
      recalls.push({ ...result, proof, policy: policyResult.decision })
    }

    return recalls
  }

  async revise(id: string, input: { content: string; reason: string; changedAt?: string }) {
    const packet = await this.#mustGet(id)
    const revised = await reviseMemoryPacket(packet, input)
    await this.#store.put(revised)
    this.#ledger = await appendLedgerEvent(this.#ledger, {
      type: 'memory.revised',
      packet: revised,
      timestamp: revised.updatedAt,
      payload: { previousHash: packet.hash, reason: input.reason },
    })
    await this.#markConflicts(revised)
    return revised
  }

  async flag(id: string, flag: MemoryFlag, changedAt?: string): Promise<MemoryPacket> {
    const packet = await this.#mustGet(id)
    const flagged = await flagMemoryPacket(packet, flag, changedAt)
    await this.#store.put(flagged)
    this.#ledger = await appendLedgerEvent(this.#ledger, {
      type: 'memory.flagged',
      packet: flagged,
      timestamp: flagged.updatedAt,
      payload: { flag },
    })
    return flagged
  }

  async forget(id: string, input: { reason: string; deletedAt?: string }): Promise<boolean> {
    const packet = await this.#mustGet(id)
    const deletedAt = input.deletedAt ?? new Date().toISOString()
    const deleted = await this.#store.delete(id)
    this.#ledger = await appendLedgerEvent(this.#ledger, {
      type: 'memory.deleted',
      packet,
      timestamp: deletedAt,
      payload: { reason: input.reason },
    })
    return deleted
  }

  async get(id: string): Promise<MemoryPacket | undefined> {
    return this.#store.get(id)
  }

  async list(): Promise<MemoryPacket[]> {
    return this.#store.list()
  }

  ledger(): LedgerEvent[] {
    return structuredClone(this.#ledger)
  }

  async verifyLedger(): Promise<boolean> {
    return verifyLedger(this.#ledger)
  }

  async snapshot(exportedAt = new Date().toISOString()): Promise<MemorySnapshot> {
    return createMemorySnapshot({
      packets: await this.#store.list(),
      ledger: this.#ledger,
      exportedAt,
    })
  }

  async #mustGet(id: string): Promise<MemoryPacket> {
    const packet = await this.#store.get(id)
    if (!packet) {
      throw new Error(`Memory packet not found: ${id}`)
    }
    return packet
  }

  async #markConflicts(packet: MemoryPacket): Promise<void> {
    const packets = await this.#store.list()
    await Promise.all(
      packets
        .filter((candidate) => candidate.id !== packet.id)
        .map(async (candidate) => {
          const conflict = detectMemoryConflict(packet, candidate)
          if (!conflict.conflicting) {
            return
          }

          const suspectedPacket = await setConflictState(packet, 'suspected')
          const suspectedCandidate = await setConflictState(candidate, 'suspected')
          await this.#store.put(suspectedPacket)
          await this.#store.put(suspectedCandidate)
        }),
    )
  }
}
