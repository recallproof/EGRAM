import type { MemoryFlag, MemoryPacket } from './types'

export type PolicySubject = 'remember' | 'recall'
export type PolicyDecisionStatus = 'allow' | 'block' | 'requires_approval'

export interface PolicyDecision {
  status: PolicyDecisionStatus
  subject: PolicySubject
  ruleId: string
  reason: string
}

export interface RememberPolicyInput {
  content: string
  sourceKind: string
  expiresAt?: string
  trustScore?: number
  metadata?: Record<string, string | number | boolean>
  approvedPolicyIds?: string[]
  now: string
}

export interface RecallPolicyInput {
  packet: MemoryPacket
  reason: string
  approvedPolicyIds?: string[]
  now: string
}

export interface RememberPolicyResult {
  decision: PolicyDecision
  flags: MemoryFlag[]
  expiresAt?: string
  trustScore?: number
  metadata: Record<string, string | number | boolean>
}

export interface RecallPolicyResult {
  decision: PolicyDecision
}

export interface MemoryPolicy {
  evaluateRemember(input: RememberPolicyInput): RememberPolicyResult
  evaluateRecall(input: RecallPolicyInput): RecallPolicyResult
}

export class PolicyViolationError extends Error {
  readonly decision: PolicyDecision

  constructor(decision: PolicyDecision) {
    super(`${decision.ruleId}: ${decision.reason}`)
    this.name = 'PolicyViolationError'
    this.decision = decision
  }
}

export const defaultMemoryPolicy: MemoryPolicy = {
  evaluateRemember(input) {
    const content = input.content.trim()
    const metadata = { ...(input.metadata ?? {}) }
    const flags: MemoryFlag[] = []

    if (content.length < 3) {
      return {
        decision: {
          status: 'block',
          subject: 'remember',
          ruleId: 'remember.content_too_short',
          reason: 'Memory content is too short to become a reliable packet.',
        },
        flags,
        metadata,
      }
    }

    if (looksSensitive(content)) {
      if (isApproved(input.approvedPolicyIds, 'remember.sensitive')) {
        return {
          decision: {
            status: 'allow',
            subject: 'remember',
            ruleId: 'remember.sensitive',
            reason: 'Sensitive memory was approved for storage.',
          },
          flags: ['sensitive'],
          expiresAt: input.expiresAt,
          trustScore: input.trustScore,
          metadata: { ...metadata, policy: 'remember.sensitive' },
        }
      }

      return {
        decision: {
          status: 'requires_approval',
          subject: 'remember',
          ruleId: 'remember.sensitive',
          reason: 'Sensitive memory requires explicit approval before storage.',
        },
        flags: ['sensitive'],
        metadata: { ...metadata, policy: 'remember.sensitive' },
      }
    }

    if (input.sourceKind === 'tool_result') {
      return {
        decision: {
          status: 'allow',
          subject: 'remember',
          ruleId: 'remember.tool_result_ttl',
          reason: 'Tool results are allowed with a short default expiry and capped trust.',
        },
        flags,
        expiresAt: input.expiresAt ?? addDays(input.now, 7),
        trustScore: Math.min(input.trustScore ?? 0.62, 0.62),
        metadata: { ...metadata, policy: 'remember.tool_result_ttl' },
      }
    }

    return {
      decision: {
        status: 'allow',
        subject: 'remember',
        ruleId: 'remember.default_allow',
        reason: 'Memory satisfies the default write policy.',
      },
      flags,
      expiresAt: input.expiresAt,
      trustScore: input.trustScore,
      metadata,
    }
  },

  evaluateRecall(input) {
    if (input.packet.flags.includes('sensitive')) {
      if (isApproved(input.approvedPolicyIds, 'recall.sensitive')) {
        return {
          decision: {
            status: 'allow',
            subject: 'recall',
            ruleId: 'recall.sensitive',
            reason: 'Sensitive memory was approved for recall.',
          },
        }
      }

      return {
        decision: {
          status: 'requires_approval',
          subject: 'recall',
          ruleId: 'recall.sensitive',
          reason: 'Sensitive memory requires explicit approval before recall.',
        },
      }
    }

    if (
      input.packet.conflictState === 'suspected' &&
      !isApproved(input.approvedPolicyIds, 'recall.conflict')
    ) {
      return {
        decision: {
          status: 'requires_approval',
          subject: 'recall',
          ruleId: 'recall.conflict',
          reason: 'Conflicting memory requires approval before recall.',
        },
      }
    }

    return {
      decision: {
        status: 'allow',
        subject: 'recall',
        ruleId: 'recall.default_allow',
        reason: 'Memory satisfies the default recall policy.',
      },
    }
  },
}

export function enforcePolicyDecision(decision: PolicyDecision, approvedPolicyIds?: string[]) {
  if (decision.status === 'allow') {
    return
  }

  if (decision.status === 'requires_approval' && isApproved(approvedPolicyIds, decision.ruleId)) {
    return
  }

  throw new PolicyViolationError(decision)
}

function isApproved(approvedPolicyIds: string[] | undefined, ruleId: string): boolean {
  return Boolean(approvedPolicyIds?.includes(ruleId))
}

function looksSensitive(content: string): boolean {
  return /\b(seed phrase|private key|password|passport|ssn|secret|api key)\b/i.test(content)
}

function addDays(isoDate: string, days: number): string {
  const date = new Date(isoDate)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString()
}
