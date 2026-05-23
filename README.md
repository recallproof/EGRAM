# Engram Protocol

Verifiable memory protocol for autonomous agents.

[Website](http://egram.fun/) | [X / Twitter](https://x.com/recallproof) | [Protocol Spec](docs/protocol-spec.md) | [Roadmap](docs/roadmap.md)

[![CI](https://github.com/recallproof/EGRAM/actions/workflows/ci.yml/badge.svg)](https://github.com/recallproof/EGRAM/actions/workflows/ci.yml)
[![Deploy website](https://github.com/recallproof/EGRAM/actions/workflows/deploy.yml/badge.svg)](https://github.com/recallproof/EGRAM/actions/workflows/deploy.yml)

Engram turns agent memory into structured, traceable, and verifiable memory packets.

Agents should not only remember. They should prove what they remember.

## Why

Long-lived agents will remember preferences, tasks, decisions, tools, transactions, risks, and failures. But memory can be stale, poisoned, hallucinated, overwritten, or recalled without explanation.

Engram is a trust layer for agent memory:

- packets instead of loose text
- source trace instead of unknown provenance
- hashes instead of silent mutation
- revision trails instead of overwrites
- policy gates instead of unsafe recall
- ledger events instead of invisible memory state
- recall proofs instead of unexplained context injection

## Protocol Flow

```txt
memory event
  -> MemoryPacket
  -> canonical hash
  -> policy decision
  -> ledger event
  -> recall proof
  -> verification report
  -> verifiable snapshot
```

## Core Objects

| Object | Purpose |
| --- | --- |
| `MemoryPacket` | Atomic verifiable memory object with source, hash, flags, trust score, revisions, and conflict state. |
| `RecallProof` | Proof that a specific packet hash was recalled for a specific reason. |
| `LedgerEvent` | Append-only event for created, revised, recalled, flagged, expired, or deleted memory. |
| `MemorySnapshot` | Portable export of packets and ledger events with a snapshot hash. |
| `MemoryPolicy` | Rule layer for remember/recall approvals, sensitive memory, expiry, and trust caps. |
| `VerificationReport` | Detailed verifier output for packet, proof, ledger, and snapshot checks. |

## Quick Verification

```bash
npm install
npm run demo
```

The demo emits a real packet, recall proof, ledger chain, and verification result:

```json
{
  "verified": {
    "packet": true,
    "proof": true,
    "ledger": true
  },
  "verificationReport": {
    "status": "pass"
  }
}
```

Run the full check:

```bash
npm run check
```

## SDK Example

```ts
import { EngramMemory, verifyPacketBundle } from './src/protocol'

const memory = new EngramMemory()

const packet = await memory.remember({
  content: 'The user prefers verifiable memory over longer context.',
  source: {
    kind: 'user_input',
    label: 'agent-session',
    observedAt: new Date().toISOString(),
  },
  metadata: {
    topic: 'agent.memory.preference',
    chain: 'solana',
  },
})

const recalls = await memory.recall({
  topic: 'agent.memory.preference',
  reason: 'Prepare an agent response from verified memory.',
})

const snapshot = await memory.snapshot()
const report = await verifyPacketBundle({
  packet,
  proof: recalls[0].proof,
  ledger: memory.ledger(),
  snapshot,
})

console.log(packet.hash)
console.log(recalls[0].proof.proofHash)
console.log(snapshot.snapshotHash)
console.log(report.status)
```

## Agent API

| Method | Description |
| --- | --- |
| `remember()` | Create and store a verified memory packet. |
| `recall()` | Search memory and return recall proofs. |
| `revise()` | Update memory while preserving the previous hash. |
| `flag()` | Mark memory as sensitive, stale, poisoned, disproven, or false. |
| `forget()` | Remove active memory while preserving a deletion ledger event. |
| `snapshot()` | Export packets and ledger events into a verifiable snapshot. |

## Verifier API

`verifyPacketBundle()` produces a structured report instead of a bare boolean.

Checks currently include:

- `packet.integrity`
- `proof.binding`
- `ledger.chain`
- `snapshot.integrity`

Each check includes a `pass` or `fail` status and a short diagnostic detail.

## Policy Layer

The default policy implements the first memory trust boundary:

- rejects memory content that is too short to be reliable
- requires approval before storing sensitive memory
- requires approval before recalling sensitive memory
- adds a seven-day expiry and trust cap to `tool_result` memory
- preserves policy rule IDs in ledger payloads

```ts
await memory.recall({
  topic: 'credential',
  includeFlagged: true,
  reason: 'User approved sensitive recall.',
  approvedPolicyIds: ['recall.sensitive'],
})
```

Custom policies can be injected:

```ts
const memory = new EngramMemory(store, policy)
```

## Repository Map

```txt
src/protocol/
  agentMemory.ts      high-level SDK
  packet.ts           packet creation, revision, flags, verification
  proof.ts            recall proof generation and verification
  ledger.ts           append-only ledger events
  policy.ts           remember/recall policy layer
  store.ts            pluggable memory store interface
  snapshot.ts         portable snapshot export and verification
  verifier.ts         detailed packet/proof/ledger verification reports
  conflict.ts         direct memory conflict detection
  canonical.ts        deterministic canonical serialization
  hash.ts             SHA-256 hashing helpers
  cli.ts              runnable protocol demo

examples/
  basic-agent.ts      minimal agent integration

docs/
  protocol-spec.md    object model and verification rules
  roadmap.md          current and planned protocol work
```

## Scripts

```bash
npm run demo      # run packet/proof/ledger verification demo
npm run example   # run the agent integration example
npm run test      # run protocol tests
npm run lint      # lint the codebase
npm run build     # build the website
npm run check     # lint + test + build
```

## Status

Implemented:

- deterministic packet hashing
- packet integrity verification
- recall proof binding
- revision history
- memory flags
- expiry checks
- conflict detection
- policy-gated remember and recall
- chained ledger events
- verifiable snapshots
- detailed verifier reports
- in-memory store
- CLI demo
- CI verification

Next:

- JSON schema exports
- packet verifier CLI commands
- persistent storage adapters
- signed packet attestations
- Solana-oriented ledger root checkpointing

## Launch Line

Engram Protocol ($ENG) is the trust layer for agent memory.
