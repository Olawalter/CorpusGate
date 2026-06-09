import Link from "next/link";

const FEATURES = [
  {
    icon: "◈",
    title: "Semantic Relevance Gate",
    desc: "GenLayer validators judge whether a paper truly belongs in your corpus — beyond keyword matching.",
  },
  {
    icon: "⬡",
    title: "Methodology Assessment",
    desc: "Evaluates research rigour: experimental design, dataset mention, reproducibility, and evidence strength.",
  },
  {
    icon: "◇",
    title: "Consensus Decision",
    desc: "Optimistic Democracy consensus produces tamper-proof, auditable admission decisions stored on-chain.",
  },
  {
    icon: "⊞",
    title: "Dispute Resolution",
    desc: "Rejected authors can provide additional context. Validators re-evaluate with the new evidence.",
  },
];

const FLOW = [
  { step: "01", title: "Create Corpus",     desc: "Define your research domain, accepted topics, and quality thresholds." },
  { step: "02", title: "Submit Paper",       desc: "Provide title, abstract, methodology, and DOI." },
  { step: "03", title: "Validator Review",   desc: "GenLayer validators semantically assess relevance and quality." },
  { step: "04", title: "Consensus Decision", desc: "Accept, reject, or flag for human review — all on-chain." },
  { step: "05", title: "Corpus Admission",   desc: "Accepted papers enter the trusted library, ready for RAG and search." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#07111F]">
      {/* Nav */}
      <nav className="border-b border-[#1E2D42] bg-[#07111F]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded bg-[#3B82F6] flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="1" width="5" height="5" rx="1" fill="#07111F" />
                <rect x="8" y="1" width="5" height="5" rx="1" fill="#07111F" opacity="0.6" />
                <rect x="1" y="8" width="5" height="5" rx="1" fill="#07111F" opacity="0.6" />
                <rect x="8" y="8" width="5" height="5" rx="1" fill="#07111F" />
              </svg>
            </span>
            <span className="font-semibold text-[#F5F7FA] tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              CorpusGate
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="btn-secondary text-sm px-4 py-2">Dashboard</Link>
            <Link href="/corpus/create" className="btn-primary text-sm px-4 py-2">Create Corpus</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "linear-gradient(rgba(59,130,246,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.05) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #0F1E35 0%, transparent 70%)" }} />
        <div className="relative max-w-7xl mx-auto px-6 py-28 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#3B82F6]/30 bg-[#3B82F6]/5 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4CAF7D]" />
            <span className="text-xs text-[#3B82F6] font-mono">Powered by GenLayer</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-[#F5F7FA] leading-[1.05] tracking-tight mb-6"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            The Trust Layer<br />
            <span className="text-[#3B82F6]">for Research</span>
          </h1>
          <p className="text-lg text-[#94A3B8] max-w-2xl mx-auto leading-relaxed mb-10">
            CorpusGate uses GenLayer validator consensus to decide whether a research paper is semantically
            relevant, methodologically sound, and worthy of entering your curated knowledge base.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/corpus/create" className="btn-primary px-6 py-3 text-base">
              Create Your First Corpus →
            </Link>
            <Link href="/dashboard" className="btn-secondary px-6 py-3 text-base">
              View Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="border border-[#1E2D42] rounded-2xl bg-[#0D1B2E] p-8 md:p-12">
          <div className="max-w-3xl">
            <p className="text-xs font-mono text-[#3B82F6] tracking-widest mb-4 uppercase">The Problem</p>
            <h2 className="text-3xl font-bold text-[#F5F7FA] mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Keyword search is not enough.
            </h2>
            <p className="text-[#94A3B8] leading-relaxed mb-6">
              A paper may contain the right keywords but be completely irrelevant to your domain.
              Another may use entirely different vocabulary but be deeply aligned with your research goals.
              Traditional deterministic systems cannot bridge this gap.
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                "Papers that mention AI casually, not substantively",
                "Weak methodology with unverifiable claims",
                "Misleading abstracts that misrepresent content",
                "Keyword matches without conceptual alignment",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 p-3 rounded-lg bg-[#D65A5A]/5 border border-[#D65A5A]/20">
                  <span className="text-[#D65A5A] mt-0.5 shrink-0">✕</span>
                  <span className="text-sm text-[#94A3B8]">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <p className="text-xs font-mono text-[#3B82F6] tracking-widest mb-3 uppercase">Features</p>
        <h2 className="text-3xl font-bold text-[#F5F7FA] mb-10" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Intelligent judgement, not rules.
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="card hover:border-[#3B82F6]/30 transition-colors">
              <div className="text-2xl text-[#3B82F6] mb-3">{f.icon}</div>
              <h3 className="font-semibold text-[#F5F7FA] mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {f.title}
              </h3>
              <p className="text-sm text-[#94A3B8] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Flow */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <p className="text-xs font-mono text-[#3B82F6] tracking-widest mb-3 uppercase">Product Flow</p>
        <h2 className="text-3xl font-bold text-[#F5F7FA] mb-10" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          From submission to admission.
        </h2>
        <div className="relative">
          <div className="absolute left-[19px] top-6 bottom-6 w-px bg-[#1E2D42] hidden md:block" />
          <div className="space-y-4">
            {FLOW.map((f) => (
              <div key={f.step} className="flex gap-6 items-start">
                <div className="relative z-10 w-10 h-10 shrink-0 rounded-full border border-[#3B82F6]/40 bg-[#07111F] flex items-center justify-center">
                  <span className="text-xs font-mono text-[#3B82F6]">{f.step}</span>
                </div>
                <div className="card flex-1 py-4">
                  <h3 className="font-semibold text-[#F5F7FA] mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    {f.title}
                  </h3>
                  <p className="text-sm text-[#94A3B8]">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <div className="border border-[#3B82F6]/20 rounded-2xl bg-[#3B82F6]/5 p-12">
          <h2 className="text-3xl font-bold text-[#F5F7FA] mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Build a trusted research corpus.
          </h2>
          <p className="text-[#94A3B8] mb-8 max-w-lg mx-auto">
            Start with a single corpus and let GenLayer validators curate it for you.
          </p>
          <Link href="/corpus/create" className="btn-primary px-8 py-3 text-base inline-block">
            Get Started
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1E2D42] py-8">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <span className="text-sm text-[#334155] font-mono">CorpusGate · Powered by GenLayer</span>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#4CAF7D]" />
            <span className="text-xs text-[#334155] font-mono">Studio network</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
