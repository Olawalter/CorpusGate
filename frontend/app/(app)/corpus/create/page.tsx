"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/lib/wallet";
import { createCorpus, generateId } from "@/lib/contract";
import TagInput from "@/components/TagInput";
import WalletRequired from "@/components/WalletRequired";

function CreateCorpusForm() {
  const router = useRouter();
  const { writeContract, address } = useWallet();
  const [form, setForm] = useState({
    name: "",
    description: "",
    include_topics: [] as string[],
    exclude_topics: [] as string[],
    min_relevance_score: 75,
    min_quality_score: 70,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.description.trim()) { setError("Name and description are required."); return; }
    if (!address) { setError("Wallet not connected. Please reconnect."); return; }
    setLoading(true);
    setError(null);
    try {
      const corpusId = generateId("corpus");
      await createCorpus(writeContract, corpusId, form);
      router.push(`/corpus/${corpusId}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Transaction failed");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#F5F7FA]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Create Corpus</h1>
        <p className="text-sm text-[#94A3B8] mt-1">Define a curated research domain with GenLayer-validated admission criteria.</p>
      </div>

      {error && <div className="p-4 rounded-lg bg-[#D65A5A]/10 border border-[#D65A5A]/30 text-[#D65A5A] text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="card space-y-5">
          <h2 className="text-sm font-semibold text-[#F5F7FA] uppercase tracking-wider font-mono">Identity</h2>
          <div>
            <label className="block text-sm text-[#94A3B8] mb-1.5">Corpus Name *</label>
            <input className="input" placeholder="e.g. Industrial AI Fault Detection" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm text-[#94A3B8] mb-1.5">Description *</label>
            <textarea className="input" rows={4}
              placeholder="Describe what papers belong in this corpus. Be specific — validators will use this to judge submissions."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })} required />
            <p className="text-xs text-[#334155] mt-1">GenLayer validators will read this to assess paper relevance.</p>
          </div>
        </div>

        <div className="card space-y-5">
          <h2 className="text-sm font-semibold text-[#F5F7FA] uppercase tracking-wider font-mono">Topic Scope</h2>
          <TagInput label="Include Topics" tags={form.include_topics}
            onChange={(tags) => setForm({ ...form, include_topics: tags })}
            placeholder="machine learning, fault detection…" color="#4CAF7D" />
          <TagInput label="Exclude Topics" tags={form.exclude_topics}
            onChange={(tags) => setForm({ ...form, exclude_topics: tags })}
            placeholder="price prediction, opinion pieces…" color="#D65A5A" />
        </div>

        <div className="card space-y-5">
          <h2 className="text-sm font-semibold text-[#F5F7FA] uppercase tracking-wider font-mono">Quality Thresholds</h2>
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm text-[#94A3B8]">Minimum Relevance Score</label>
              <span className="text-sm font-mono text-[#3B82F6]">{form.min_relevance_score}/100</span>
            </div>
            <input type="range" min={0} max={100} value={form.min_relevance_score}
              onChange={(e) => setForm({ ...form, min_relevance_score: parseInt(e.target.value) })}
              className="w-full accent-[#3B82F6]" />
            <div className="flex justify-between text-xs text-[#334155] mt-1"><span>Permissive (0)</span><span>Strict (100)</span></div>
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm text-[#94A3B8]">Minimum Quality Score</label>
              <span className="text-sm font-mono text-[#3B82F6]">{form.min_quality_score}/100</span>
            </div>
            <input type="range" min={0} max={100} value={form.min_quality_score}
              onChange={(e) => setForm({ ...form, min_quality_score: parseInt(e.target.value) })}
              className="w-full accent-[#3B82F6]" />
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button type="button" className="btn-secondary" onClick={() => router.back()}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={loading || !address}>
            {loading ? "Creating on-chain…" : "Create Corpus"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function CreateCorpusPage() {
  return <WalletRequired><CreateCorpusForm /></WalletRequired>;
}
