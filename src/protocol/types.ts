export type MemorySourceKind =
  | 'user_input'
  | 'agent_observation'
  | 'tool_result'
  | 'web_source'
  | 'transaction'
  | 'sensor'
  | 'document'

export type MemoryFlag = 'false_memory' | 'poisoned' | 'disproven' | 'stale' | 'sensitive'

export type ConflictState = 'none' | 'suspected' | 'confirmed' | 'resolved'

export interface MemorySource {
  kind: MemorySourceKind
  label: string
  uri?: string
  observedAt: string
}

export interface MemoryRevision {
  revision: number
  previousHash: string
  reason: string
  changedAt: string
  content: string
}

export interface MemoryPacket {
  id: string
  content: string
  source: MemorySource
  createdAt: string
  updatedAt: string
  expiresAt?: string
  trustScore: number
  conflictState: ConflictState
  flags: MemoryFlag[]
  metadata: Record<string, string | number | boolean>
  revisions: MemoryRevision[]
  hash: string
}

export interface CreateMemoryPacketInput {
  content: string
  source: MemorySource
  createdAt?: string
  expiresAt?: string
  trustScore?: number
  metadata?: Record<string, string | number | boolean>
  flags?: MemoryFlag[]
}

export interface RecallProof {
  memoryId: string
  memoryHash: string
  recalledAt: string
  query: string
  reason: string
  proofHash: string
}

export interface LedgerEvent {
  type:
    | 'memory.created'
    | 'memory.revised'
    | 'memory.recalled'
    | 'memory.flagged'
    | 'memory.expired'
    | 'memory.deleted'
  packetId: string
  packetHash: string
  timestamp: string
  payload: Record<string, string | number | boolean>
  previousEventHash?: string
  eventHash: string
}
