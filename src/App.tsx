import { useState } from 'react'
import {
  ArrowRight,
  BadgeCheck,
  Clock3,
  Code2,
  FileCode2,
  FileCheck2,
  Fingerprint,
  GitBranch,
  GitCompareArrows,
  KeyRound,
  LockKeyhole,
  Network,
  ShieldCheck,
  Split,
  TerminalSquare,
} from 'lucide-react'
import './App.css'

const sdkViews = [
  {
    id: 'sdk',
    label: 'SDK Integration',
    icon: Code2,
    language: 'TypeScript',
    proofTitle: 'Recall Proof',
    proofStatus: 'verified',
    code: [
      "import { EngramMemory } from 'engram-protocol'",
      '',
      'const memory = new EngramMemory()',
      '',
      'const packet = await memory.remember({',
      "  content: 'User prefers cold black premium branding.',",
      '  source,',
      "  metadata: { topic: 'brand.preference' },",
      '})',
      '',
      'const recall = await memory.recall({',
      "  text: 'premium branding',",
      "  reason: 'Answer a design direction question.',",
      '})',
    ],
    proof: [
      ['memory_hash', '8f13Kp9...a91cQz'],
      ['source_trace', 'user_input.launch-chat'],
      ['policy_rule', 'recall.default_allow'],
      ['recall_proof', 'verified'],
      ['ledger_event', 'memory.recalled'],
    ],
  },
  {
    id: 'runtime',
    label: 'Agent Runtime',
    icon: Network,
    language: 'Runtime',
    proofTitle: 'Agent Memory',
    proofStatus: 'resolved',
    code: [
      'const recall = await memory.recall({',
      "  topic: 'project.positioning',",
      "  reason: 'Select launch narrative.',",
      '  limit: 3,',
      '})',
      '',
      'for (const result of recall) {',
      '  agent.context.add({',
      '    content: result.packet.content,',
      '    proof: result.proof.proofHash,',
      '  })',
      '}',
    ],
    proof: [
      ['query', 'project.positioning'],
      ['packets_used', '3'],
      ['conflict_state', 'none'],
      ['agent_context', 'proof-bound'],
      ['runtime_event', 'memory.injected'],
    ],
  },
  {
    id: 'policy',
    label: 'Policy Layer',
    icon: ShieldCheck,
    language: 'Policy',
    proofTitle: 'Policy Gate',
    proofStatus: 'passed',
    code: [
      'await memory.recall({',
      "  topic: 'credential',",
      "  includeFlagged: true,",
      "  reason: 'User approved sensitive recall.',",
      '  approvedPolicyIds: [',
      "    'recall.sensitive'",
      '  ],',
      '})',
      '',
      'const snapshot = await memory.snapshot()',
    ],
    proof: [
      ['policy_rule', 'recall.sensitive'],
      ['approval', 'explicit'],
      ['packet_flag', 'sensitive'],
      ['ledger_payload', 'policyRuleId'],
      ['recall_status', 'allowed'],
    ],
  },
]

const proofStats = [
  ['Packet hash', 'deterministic', '#packet'],
  ['Ledger events', 'append-only', '#protocol'],
  ['Policy rules', 'auditable', '#policy'],
  ['Recall proof', 'hash-bound', '#sdk'],
]

const repoProofs = [
  {
    icon: GitBranch,
    title: 'CI verified',
    text: 'GitHub Actions runs lint, tests, build, and the protocol demo on every push.',
    label: 'View CI',
    href: 'https://github.com/recallproof/EGRAM/actions/workflows/ci.yml',
  },
  {
    icon: TerminalSquare,
    title: 'Runnable CLI demo',
    text: 'npm run demo emits a packet hash, recall proof, ledger chain, and verification result.',
    label: 'CLI source',
    href: 'https://github.com/recallproof/EGRAM/blob/main/src/protocol/cli.ts',
  },
  {
    icon: FileCode2,
    title: 'Agent example',
    text: 'A minimal agent integration shows remember, recall, ledger events, and snapshot verification.',
    label: 'Example',
    href: 'https://github.com/recallproof/EGRAM/blob/main/examples/basic-agent.ts',
  },
  {
    icon: FileCheck2,
    title: 'Protocol spec',
    text: 'MemoryPacket, RecallProof, LedgerEvent, policy decisions, and snapshot rules are documented.',
    label: 'Read spec',
    href: 'https://github.com/recallproof/EGRAM/blob/main/docs/protocol-spec.md',
  },
]

const packetFields = [
  {
    icon: Fingerprint,
    title: 'Source Trace',
    text: 'Every packet records where the memory came from: user input, tool result, document, transaction, web source, or agent observation.',
  },
  {
    icon: LockKeyhole,
    title: 'Memory Hash',
    text: 'A deterministic hash seals the memory body. Change the packet, and the verification result changes with it.',
  },
  {
    icon: BadgeCheck,
    title: 'Recall Proof',
    text: 'When a memory is used, Engram can show which packet was recalled and why it influenced the response.',
  },
  {
    icon: Clock3,
    title: 'Expiry Rule',
    text: 'Some memory should decay. Tool results and stale assumptions can expire before they silently control future behavior.',
  },
  {
    icon: GitCompareArrows,
    title: 'Revision Trail',
    text: 'Agents can correct memory without deleting the past. Every revision keeps the previous hash.',
  },
  {
    icon: Split,
    title: 'Conflict State',
    text: 'When two memories disagree, the conflict is surfaced instead of being blended into false certainty.',
  },
]

const flowSteps = [
  ['01', 'Capture', 'Memory is created from user input, tools, documents, transactions, or agent observations.'],
  ['02', 'Seal', 'Engram packages the memory with source trace, timestamp, hash, expiry, and trust metadata.'],
  ['03', 'Govern', 'Policy decides what can be stored, recalled, flagged, revised, or forgotten.'],
  ['04', 'Prove', 'Recall creates a proof bound to the packet hash and ledger event.'],
]

const policies = [
  ['remember.sensitive', 'Requires approval before sensitive memory can be stored.'],
  ['recall.sensitive', 'Requires approval before sensitive memory can be recalled.'],
  ['remember.tool_result_ttl', 'Adds a short expiry and trust cap to tool-output memory.'],
  ['memory.deleted', 'Removes active memory while preserving an auditable deletion event.'],
]

const comparisonRows = [
  ['Memory type', 'Stored text', 'Verifiable packet'],
  ['Source', 'Often unclear', 'Source trace required'],
  ['Mutation', 'Silent overwrite', 'Revision trail'],
  ['Recall', 'Unexplained context', 'Recall proof'],
  ['Risk', 'Persistent hallucination', 'Flag, expire, resolve'],
]

const packetJson = [
  '{',
  '  "id": "mem_7Lh9QeV2mKp4cN8a",',
  '  "content": "User prefers cold black premium branding.",',
  '  "source": {',
  '    "kind": "user_input",',
  '    "label": "launch-chat",',
  '    "observedAt": "2026-05-23T02:14:00Z"',
  '  },',
  '  "hash": "8f13Kp9rYtV6a91cQz2mN4bL",',
  '  "policy": "recall.default_allow",',
  '  "revision": 0,',
  '  "conflictState": "none",',
  '  "trustScore": 0.92',
  '}',
]

const packetChecks = [
  ['source_trace', 'attached'],
  ['hash_integrity', 'valid'],
  ['policy_gate', 'passed'],
  ['ledger_event', 'memory.recalled'],
  ['recall_proof', '8NqR4...pZ7T'],
]

const demoOutput = [
  '{',
  '  "verified": {',
  '    "packet": true,',
  '    "proof": true,',
  '    "ledger": true',
  '  },',
  '  "ledger": [',
  '    { "type": "memory.created" },',
  '    { "type": "memory.revised" },',
  '    { "type": "memory.recalled" }',
  '  ]',
  '}',
]

const useCases = [
  ['Personal agents', 'Preferences, routines, relationships, and long-term intent with user-controlled deletion.'],
  ['Trading agents', 'Risk signals, failed strategies, suspicious wallets, and decision trails with proof.'],
  ['Enterprise agents', 'Meeting decisions, customer state, review history, and stale-data protection.'],
  ['Multi-agent systems', 'Shared memory that other agents can verify, question, revise, or reject.'],
]

function App() {
  const [activeViewId, setActiveViewId] = useState(sdkViews[0].id)
  const activeView = sdkViews.find((view) => view.id === activeViewId) ?? sdkViews[0]

  return (
    <main>
      <section className="hero-shell" id="top">
        <nav className="nav-bar" aria-label="Primary navigation">
          <a className="brand" href="#top" aria-label="Engram Protocol">
            <img src="/brand/engram-logo.png" alt="" />
            <span>Engram Protocol</span>
          </a>
          <div className="nav-links">
            <a href="#sdk">SDK</a>
            <a href="#protocol">Protocol</a>
            <a href="#policy">Policy</a>
            <a href="#repo">Repo</a>
            <a href="#use-cases">Use Cases</a>
          </div>
          <a className="nav-cta" href="https://github.com/recallproof/EGRAM" target="_blank">
            GitHub
            <ArrowRight size={16} strokeWidth={1.8} />
          </a>
        </nav>

        <div className="hero-content">
          <div className="announcement">
            <span>$ENGRAM</span>
            <span>Verifiable memory protocol for autonomous agents</span>
          </div>
          <h1>Memory agents can prove.</h1>
          <p className="hero-lede">
            Engram Protocol turns agent memory into structured, policy-governed packets
            with source trace, hash, revision history, expiry, and recall proof.
          </p>
          <div className="hero-actions">
            <a className="primary-action" href="#sdk">
              Build with Engram
              <ArrowRight size={18} strokeWidth={1.8} />
            </a>
            <a className="secondary-action" href="#protocol">
              Explore protocol
            </a>
          </div>
        </div>

        <section className="developer-panel" id="sdk" aria-label="Engram SDK preview">
          <div className="panel-tabs">
            {sdkViews.map(({ id, label, icon: Icon }) => (
              <button
                type="button"
                className={id === activeView.id ? 'active-tab' : undefined}
                aria-pressed={id === activeView.id}
                onClick={() => setActiveViewId(id)}
                key={id}
              >
                <Icon size={15} strokeWidth={1.8} />
                {label}
              </button>
            ))}
          </div>

          <div className="console-grid">
            <div className="code-window">
              <div className="window-bar">
                <span className="dot red"></span>
                <span className="dot yellow"></span>
                <span className="dot green"></span>
                <span className="language-pill">{activeView.language}</span>
              </div>
              <pre aria-label="Engram SDK code example">
                {activeView.code.map((line, index) => (
                  <code key={`${line}-${index}`}>
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    {line || ' '}
                  </code>
                ))}
              </pre>
            </div>

            <div className="proof-window">
              <div className="proof-header">
                <img src="/brand/engram-logo.png" alt="" />
                <div>
                  <span>{activeView.proofTitle}</span>
                  <strong>{activeView.proofStatus}</strong>
                </div>
              </div>
              <div className="proof-list">
                {activeView.proof.map(([label, value]) => (
                  <div className="proof-row" key={label}>
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </section>

      <section className="signal-strip" aria-label="Protocol signals">
        {proofStats.map(([label, value, href]) => (
          <a href={href} key={label}>
            <strong>{value}</strong>
            <span>{label}</span>
          </a>
        ))}
      </section>

      <section className="section repo-section" id="repo">
        <div className="section-heading">
          <span className="section-kicker">Repository Proof</span>
          <h2>Not a landing page wrapped around an empty repo.</h2>
          <p>
            The repository ships with protocol code, tests, CI, a runnable demo,
            an agent example, and a written object model.
          </p>
        </div>
        <div className="repo-layout">
          <div className="repo-card-grid">
            {repoProofs.map(({ icon: Icon, title, text, label, href }) => (
              <article className="repo-card" key={title}>
                <Icon size={22} strokeWidth={1.6} />
                <h3>{title}</h3>
                <p>{text}</p>
                <a href={href} target="_blank">
                  {label}
                  <ArrowRight size={15} strokeWidth={1.8} />
                </a>
              </article>
            ))}
          </div>
          <div className="demo-output">
            <div className="window-bar">
              <span className="dot red"></span>
              <span className="dot yellow"></span>
              <span className="dot green"></span>
              <span className="language-pill">npm run demo</span>
            </div>
            <pre aria-label="Protocol demo output">
              {demoOutput.map((line, index) => (
                <code key={`${line}-${index}`}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  {line}
                </code>
              ))}
            </pre>
          </div>
        </div>
      </section>

      <section className="section packet-section" id="protocol">
        <div className="section-heading">
          <span className="section-kicker">Memory Packet</span>
          <h2>Not chat history. A verifiable memory object.</h2>
          <p>
            Engram is built around packets that can be inspected, corrected, expired,
            flagged, and proven at recall time.
          </p>
        </div>
        <div className="feature-grid">
          {packetFields.map(({ icon: Icon, title, text }) => (
            <article className="feature-card" key={title}>
              <Icon size={22} strokeWidth={1.6} />
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section comparison-section">
        <div className="section-heading">
          <span className="section-kicker">Why Engram</span>
          <h2>Memory without proof is just context with persistence.</h2>
          <p>
            Most AI memory products optimize for remembering more. Engram optimizes
            for knowing which memory deserves trust.
          </p>
        </div>
        <div className="comparison-table" aria-label="AI memory compared with Engram memory">
          <div className="comparison-head">
            <span></span>
            <strong>Ordinary AI Memory</strong>
            <strong>Engram Protocol</strong>
          </div>
          {comparisonRows.map(([label, ordinary, engram]) => (
            <div className="comparison-row" key={label}>
              <span>{label}</span>
              <p>{ordinary}</p>
              <p>
                <FileCheck2 size={16} strokeWidth={1.7} />
                {engram}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="section live-packet-section" id="packet">
        <div className="section-heading">
          <span className="section-kicker">Live Packet</span>
          <h2>A memory packet should be inspectable before it is trusted.</h2>
          <p>
            Engram exposes the packet body, integrity state, policy decision, and recall
            proof as first-class protocol objects.
          </p>
        </div>
        <div className="live-packet-grid">
          <div className="json-window">
            <div className="window-bar">
              <span className="dot red"></span>
              <span className="dot yellow"></span>
              <span className="dot green"></span>
              <span className="language-pill">MemoryPacket</span>
            </div>
            <pre aria-label="Live memory packet JSON">
              {packetJson.map((line, index) => (
                <code key={`${line}-${index}`}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  {line}
                </code>
              ))}
            </pre>
          </div>
          <div className="inspection-panel">
            <div>
              <span className="section-kicker">Inspection Result</span>
              <h3>trusted for recall</h3>
            </div>
            <div className="inspection-list">
              {packetChecks.map(([label, value]) => (
                <div className="inspection-row" key={label}>
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section flow-section">
        <div className="section-heading compact">
          <span className="section-kicker">Protocol Flow</span>
          <h2>Capture, seal, govern, prove.</h2>
        </div>
        <div className="flow-list">
          {flowSteps.map(([number, title, text]) => (
            <div className="flow-step" key={number}>
              <span>{number}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section policy-section" id="policy">
        <div className="policy-layout">
          <div className="section-heading compact">
            <span className="section-kicker">Policy Layer</span>
            <h2>Memory needs rules before it becomes infrastructure.</h2>
            <p>
              Engram policies decide what can be remembered, recalled, approved, capped,
              expired, or deleted. The rule ID is written into the ledger for auditability.
            </p>
          </div>
          <div className="policy-console">
            <div className="policy-line">
              <KeyRound size={18} strokeWidth={1.6} />
              <span>approvedPolicyIds: ['recall.sensitive']</span>
            </div>
            {policies.map(([rule, text]) => (
              <div className="policy-row" key={rule}>
                <strong>{rule}</strong>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section usecase-section" id="use-cases">
        <div className="section-heading">
          <span className="section-kicker">Use Cases</span>
          <h2>For agents that live longer than one session.</h2>
        </div>
        <div className="usecase-grid">
          {useCases.map(([title, text]) => (
            <article className="usecase-card" key={title}>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section final-section">
        <div>
          <span className="section-kicker">$ENGRAM</span>
          <h2>The trust layer for agent memory.</h2>
          <p>
            Agents should not only remember. They should prove what they remember.
          </p>
        </div>
        <div className="final-actions">
          <a className="primary-action" href="https://github.com/recallproof/EGRAM" target="_blank">
            View repository
            <ArrowRight size={18} strokeWidth={1.8} />
          </a>
        </div>
      </section>

      <footer>
        <a className="brand" href="#top" aria-label="Engram Protocol">
          <img src="/brand/engram-logo.png" alt="" />
          <span>Engram Protocol</span>
        </a>
        <div>
          <span>Verifiable memory for autonomous agents.</span>
        </div>
      </footer>
    </main>
  )
}

export default App
