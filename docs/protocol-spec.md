# Engram Protocol Specification

Engram Protocol defines verifiable memory objects for autonomous agents. The goal is not to store more context. The goal is to make memory traceable, correctable, governable, and provable.

## Core Objects

### MemoryPacket

A `MemoryPacket` is the atomic unit of agent memory.

Required fields:

- `id`: deterministic packet identifier derived from the packet hash
- `content`: memory content
- `source`: provenance object describing where the memory came from
- `createdAt`: ISO timestamp
- `updatedAt`: ISO timestamp
- `trustScore`: numeric score from `0` to `1`
- `conflictState`: `none`, `suspected`, `confirmed`, or `resolved`
- `flags`: policy and safety labels
- `metadata`: structured application metadata
- `revisions`: previous packet states
- `hash`: canonical SHA-256 hash of the packet body

### RecallProof

A `RecallProof` binds a recall decision to a specific packet hash.

Required fields:

- `memoryId`
- `memoryHash`
- `recalledAt`
- `query`
- `reason`
- `proofHash`

### LedgerEvent

A `LedgerEvent` records packet lifecycle events in an append-only chain.

Event types:

- `memory.created`
- `memory.revised`
- `memory.recalled`
- `memory.flagged`
- `memory.expired`
- `memory.deleted`

Each event includes `previousEventHash`, which lets a verifier detect missing or reordered events.

### MemorySnapshot

A `MemorySnapshot` exports packets and ledger events into a portable object with a `snapshotHash`.

Schema:

```txt
engram.snapshot.v1
```

## Policy Layer

The default policy enforces the first trust boundary:

- blocks memory that is too short to be reliable
- requires approval before storing sensitive memory
- requires approval before recalling sensitive memory
- caps trust and adds a seven-day expiry to tool-result memory
- writes policy rule IDs into ledger payloads

Policy decisions:

- `allow`
- `block`
- `requires_approval`

## Verification Guarantees

Engram currently verifies:

- packet integrity through canonical hashing
- recall proof binding to packet hash
- ledger event chain integrity
- snapshot hash integrity
- packet count and ledger count consistency

## Non-Goals

Engram is not a vector database, model provider, wallet, or chain indexer. It is a protocol layer that can be attached to agent runtimes, memory stores, and application-specific infrastructure.
