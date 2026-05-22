# Engram Protocol

The trust layer for agent memory.

[![Deploy website](https://github.com/recallproof/EGRAM/actions/workflows/deploy.yml/badge.svg)](https://github.com/recallproof/EGRAM/actions/workflows/deploy.yml)
[![CI](https://github.com/recallproof/EGRAM/actions/workflows/ci.yml/badge.svg)](https://github.com/recallproof/EGRAM/actions/workflows/ci.yml)

Engram Protocol turns autonomous agent memory into structured, traceable, and verifiable memory packets. The project narrative is built around a simple claim:

> The future of agents is not bigger context. It is verifiable memory.

## Core Idea

Every memory packet can carry:

- Source trace
- Memory hash
- Recall proof
- Expiry rule
- Revision history
- Conflict state
- Trust score

## Protocol Modules

- `src/protocol/agentMemory.ts`: high-level SDK for `remember`, `recall`, `revise`, `flag`, and `forget`
- `src/protocol/store.ts`: pluggable memory store interface with an in-memory implementation
- `src/protocol/packet.ts`: create, revise, flag, expire, and verify memory packets
- `src/protocol/policy.ts`: enforce write and recall policy for sensitive, low-quality, or short-lived memory
- `src/protocol/proof.ts`: create and verify recall proofs
- `src/protocol/ledger.ts`: append and verify chained memory events
- `src/protocol/conflict.ts`: detect direct conflicts between memory packets
- `src/protocol/snapshot.ts`: export and verify portable memory snapshots
- `src/protocol/demo.ts`: runnable protocol flow for product demos

## Repository Map

- `src/protocol`: protocol SDK core
- `examples/basic-agent.ts`: minimal agent integration example
- `docs/protocol-spec.md`: protocol object model and verification rules
- `docs/roadmap.md`: current and planned protocol work
- `src/App.tsx`: project website

## Quick Verification

Run the protocol demo:

```bash
npm run demo
```

Expected output includes:

- a memory packet hash
- a recall proof hash
- chained ledger events
- `verified.packet: true`
- `verified.proof: true`
- `verified.ledger: true`

## SDK Shape

```ts
import { EngramMemory } from './src/protocol'

const memory = new EngramMemory()

const packet = await memory.remember({
  content: 'The user prefers cold black premium branding.',
  source: {
    kind: 'user_input',
    label: 'brand-session',
    observedAt: new Date().toISOString(),
  },
  metadata: { topic: 'brand.preference' },
})

const recalls = await memory.recall({
  text: 'premium branding',
  reason: 'Answer a design direction question.',
})

await memory.revise(packet.id, {
  content: 'The user prefers cold black premium branding with minimal symbols.',
  reason: 'User refined the logo direction.',
})

await memory.flag(packet.id, 'sensitive')
await memory.forget(packet.id, { reason: 'User requested deletion.' })

const snapshot = await memory.snapshot()
```

`recall()` returns packets with recall proofs. `forget()` removes the packet from the active store while writing a `memory.deleted` event to the ledger.

## Policy Layer

The default policy handles the first trust boundary:

- Rejects memory content that is too short to be reliable
- Requires explicit approval before storing sensitive memory
- Requires explicit approval before recalling sensitive memory
- Adds a seven-day expiry and trust cap to `tool_result` memories
- Preserves policy rule IDs in ledger payloads for auditability

```ts
await memory.remember({
  content: 'The user api key is redacted.',
  source,
  approvedPolicyIds: ['remember.sensitive'],
})

await memory.recall({
  topic: 'credential',
  includeFlagged: true,
  reason: 'User approved credential recall.',
  approvedPolicyIds: ['recall.sensitive'],
})
```

Custom policies can be injected with `new EngramMemory(store, policy)`.

## Launch Line

Engram Protocol ($ENG) is verifiable memory for autonomous agents.

## Development

```bash
npm install
npm run dev
npm run test
npm run build
npm run lint
npm run demo
```
