import {
  ArrowUpRight,
  BadgeCheck,
  Clock3,
  Fingerprint,
  GitCompareArrows,
  History,
  ShieldAlert,
  Sparkles,
} from 'lucide-react'
import './App.css'

const packetFields = [
  'Source Trace',
  'Memory Hash',
  'Recall Proof',
  'Expiry Rule',
  'Revision Trail',
  'Conflict State',
  'Trust Score',
]

const utilities = [
  {
    icon: Fingerprint,
    title: 'Prove where a memory came from',
    text: 'Each memory can carry source, timestamp, hash, and provenance instead of living as loose text in a vector store.',
  },
  {
    icon: History,
    title: 'Correct memory without erasing history',
    text: 'Agents can update stale or false memories while preserving the revision trail that explains what changed.',
  },
  {
    icon: ShieldAlert,
    title: 'Flag poisoned or hallucinated memory',
    text: 'Suspicious, disproven, or prompt-injected memory can be marked instead of silently shaping future decisions.',
  },
  {
    icon: Clock3,
    title: 'Let old memory expire',
    text: 'Preferences, risk signals, and assumptions should decay when they stop being reliable.',
  },
  {
    icon: GitCompareArrows,
    title: 'Surface conflicts between memories',
    text: 'When two memories disagree, Engram exposes the conflict instead of letting the agent blend them into a false certainty.',
  },
  {
    icon: BadgeCheck,
    title: 'Generate recall proofs',
    text: 'When an agent acts on memory, it can show which packet was recalled and why it mattered.',
  },
]

const protocolSteps = [
  'Capture a memory event from user input, tool output, transaction, document, or agent observation.',
  'Package it with source trace, timestamp, hash, expiry, and trust metadata.',
  'Revise, expire, flag, or resolve conflicts as the agent learns over time.',
  'Produce a recall proof when the memory influences a future answer or action.',
]

function App() {
  return (
    <main>
      <section className="hero-section" id="top">
        <nav className="nav-bar" aria-label="Primary navigation">
          <a className="brand-lockup" href="#top" aria-label="Engram Protocol home">
            <img src="/brand/engram-logo.png" alt="" />
            <span>Engram Protocol</span>
          </a>
          <div className="nav-links">
            <a href="#packet">Packet</a>
            <a href="#protocol">Protocol</a>
            <a href="#launch">Launch</a>
          </div>
        </nav>

        <div className="hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">$ENG / VERIFIABLE MEMORY</p>
            <h1>Engram Protocol</h1>
            <p className="lede">The trust layer for agent memory.</p>
            <p className="hero-text">
              Autonomous agents should not only remember. They should prove what they remember,
              where it came from, whether it changed, and why it is being recalled now.
            </p>
            <div className="hero-actions">
              <a className="primary-action" href="#packet">
                Explore packets
                <ArrowUpRight size={18} strokeWidth={1.8} />
              </a>
              <a className="secondary-action" href="#launch">
                Launch narrative
              </a>
            </div>
          </div>

          <div className="symbol-stage" aria-hidden="true">
            <img src="/brand/engram-logo.png" alt="" />
            <div className="proof-strip">
              <span>source: user.intent</span>
              <span>hash: 0x7E4C</span>
              <span>recall: verified</span>
            </div>
          </div>
        </div>
      </section>

      <section className="thesis-band">
        <p>
          The future of agents is not bigger context. It is verifiable memory.
        </p>
      </section>

      <section className="section packet-section" id="packet">
        <div className="section-heading">
          <p className="eyebrow">MEMORY PACKET</p>
          <h2>Memory becomes an object agents can prove.</h2>
        </div>
        <div className="packet-grid">
          <div className="packet-visual">
            <div className="packet-core">
              <Sparkles size={18} strokeWidth={1.6} />
              <span>memory.object</span>
            </div>
            {packetFields.map((field) => (
              <div className="packet-row" key={field}>
                <span>{field}</span>
                <span>sealed</span>
              </div>
            ))}
          </div>
          <div className="packet-copy">
            <h3>Not stored text. Verifiable agent memory.</h3>
            <p>
              Engram turns a memory into a structured packet with provenance, revision state,
              expiry logic, conflict awareness, and recall evidence. An agent no longer says
              it remembers. It can show the shape of that memory.
            </p>
          </div>
        </div>
      </section>

      <section className="section utilities-section">
        <div className="section-heading">
          <p className="eyebrow">WHAT USERS GET</p>
          <h2>Control, correction, and proof for long-lived agents.</h2>
        </div>
        <div className="utility-grid">
          {utilities.map(({ icon: Icon, title, text }) => (
            <article className="utility-card" key={title}>
              <Icon size={22} strokeWidth={1.55} />
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section protocol-section" id="protocol">
        <div className="section-heading">
          <p className="eyebrow">PROTOCOL FLOW</p>
          <h2>From memory event to recall proof.</h2>
        </div>
        <div className="step-list">
          {protocolSteps.map((step, index) => (
            <div className="step" key={step}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <p>{step}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="launch-section" id="launch">
        <div>
          <p className="eyebrow">PUMP LAUNCH LINE</p>
          <h2>Engram Protocol ($ENG)</h2>
          <p>Verifiable memory for autonomous agents.</p>
        </div>
        <a className="primary-action" href="#top">
          Back to top
          <ArrowUpRight size={18} strokeWidth={1.8} />
        </a>
      </section>
    </main>
  )
}

export default App
