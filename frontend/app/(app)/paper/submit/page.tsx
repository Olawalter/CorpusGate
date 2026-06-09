"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useWallet } from "@/lib/wallet";
import { submitPaper, reviewPaper, getAllCorporaIds, getCorpus, generateId } from "@/lib/contract";
import type { Corpus } from "@/lib/types";
import TagInput from "@/components/TagInput";
import WalletRequired from "@/components/WalletRequired";

function SubmitPaperForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { writeContract } = useWallet();

  const [corpora, setCorpora] = useState<Corpus[]>([]);
  const [form, setForm] = useState({
    corpus_id: params.get("corpus") ?? "",
    title: "", authors: "", abstract: "", methodology: "",
    conclusion: "", keywords: [] as string[], doi: "", paper_url: "", file_hash: "",
  });
  const [step, setStep]   = useState<"form" | "submitting" | "reviewing">("form");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAllCorporaIds()
      .then((ids) => Promise.all(ids.map(getCorpus)))
      .then((cs) => setCorpora(cs.filter(Boolean) as Corpus[]));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.corpus_id)               { setError("Select a corpus."); return; }
    if (!form.title || !form.abstract) { setError("Title and abstract are required."); return; }
    setError(null);
    setStep("submitting");
    try {
      const pid = generateId("paper");
      const { corpus_id, ...rest } = form;
      await submitPaper(writeContract, pid, corpus_id, rest);
      setStep("reviewing");
      await reviewPaper(writeContract, pid);
      router.push(`/paper/${pid}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Transaction failed");
      setStep("form");
    }
  }

  if (step === "submitting") return (
    <div className="max-w-lg mx-auto text-center py-20 space-y-4">
      <div className="relative w-16 h-16 mx-auto">
        <div className="absolute inset-0 rounded-full border-2 border-[#2E3338]" />
        <div className="absolute inset-0 rounded-full border-2 border-t-[#D6A84F] border-r-transparent border-b-transparent border-l-transparent animate-spin" />
      </div>
      <h2 className="text-xl font-bold text-[#F4EFE7]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Submitting on-chain…</h2>
      <p className="text-[#9BA7B4] text-sm">Confirm the transaction in your wallet, then wait for finalization.</p>
    </div>
  );

  if (step === "reviewing") return (
    <div className="max-w-lg mx-auto text-center py-20 space-y-4">
      <div className="relative w-16 h-16 mx-auto">
        <div className="absolute inset-0 rounded-full border-2 border-[#2B183F]" />
        <div className="absolute inset-0 rounded-full border-2 border-t-[#D6A84F] border-r-transparent border-b-transparent border-l-transparent animate-spin" style={{ animationDuration: "2s" }} />
      </div>
      <h2 className="text-xl font-bold text-[#F4EFE7]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>GenLayer validators reviewing…</h2>
      <p className="text-[#9BA7B4] text-sm max-w-sm mx-auto">Validators are independently assessing semantic relevance and methodology quality. Consensus is being reached on GenLayer Studio.</p>
      <div className="flex items-center justify-center gap-2 mt-2">
        {[0,1,2,3,4].map((i) => (
          <div key={i} className="w-2 h-2 rounded-full bg-[#D6A84F]"
            style={{ animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite` }} />
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#F4EFE7]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Submit Paper</h1>
        <p className="text-sm text-[#9BA7B4] mt-1">GenLayer validators will assess your paper for relevance and quality after submission.</p>
      </div>

      {error && <div className="p-4 rounded-lg bg-[#D65A5A]/10 border border-[#D65A5A]/30 text-[#D65A5A] text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="card space-y-4">
          <h2 className="text-sm font-semibold text-[#F4EFE7] uppercase tracking-wider font-mono">Target Corpus</h2>
          <div>
            <label className="block text-sm text-[#9BA7B4] mb-1.5">Select Corpus *</label>
            <select className="input" value={form.corpus_id} onChange={(e) => setForm({ ...form, corpus_id: e.target.value })} required>
              <option value="">— Select a corpus —</option>
              {corpora.map((c) => <option key={c.corpus_id} value={c.corpus_id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        <div className="card space-y-4">
          <h2 className="text-sm font-semibold text-[#F4EFE7] uppercase tracking-wider font-mono">Paper Identity</h2>
          <div>
            <label className="block text-sm text-[#9BA7B4] mb-1.5">Title *</label>
            <input className="input" placeholder="Full paper title" value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm text-[#9BA7B4] mb-1.5">Authors</label>
            <input className="input" placeholder="Author names, separated by commas" value={form.authors}
              onChange={(e) => setForm({ ...form, authors: e.target.value })} />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[#9BA7B4] mb-1.5">DOI</label>
              <input className="input" placeholder="10.xxxx/example" value={form.doi}
                onChange={(e) => setForm({ ...form, doi: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm text-[#9BA7B4] mb-1.5">Paper URL</label>
              <input className="input" placeholder="https://arxiv.org/…" value={form.paper_url}
                onChange={(e) => setForm({ ...form, paper_url: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-sm text-[#9BA7B4] mb-1.5">File Hash (SHA-256)</label>
            <input className="input font-mono" placeholder="sha256:…" value={form.file_hash}
              onChange={(e) => setForm({ ...form, file_hash: e.target.value })} />
          </div>
        </div>

        <div className="card space-y-4">
          <h2 className="text-sm font-semibold text-[#F4EFE7] uppercase tracking-wider font-mono">Content for Review</h2>
          <div>
            <label className="block text-sm text-[#9BA7B4] mb-1.5">Abstract *</label>
            <textarea className="input" rows={5}
              placeholder="Paste the full abstract. Validators will read this carefully."
              value={form.abstract} onChange={(e) => setForm({ ...form, abstract: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm text-[#9BA7B4] mb-1.5">Methodology Excerpt</label>
            <textarea className="input" rows={4}
              placeholder="Describe the research method, experiments, dataset, or evaluation approach."
              value={form.methodology} onChange={(e) => setForm({ ...form, methodology: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm text-[#9BA7B4] mb-1.5">Conclusion Excerpt</label>
            <textarea className="input" rows={3}
              placeholder="Key findings and contributions."
              value={form.conclusion} onChange={(e) => setForm({ ...form, conclusion: e.target.value })} />
          </div>
          <TagInput label="Keywords" tags={form.keywords}
            onChange={(tags) => setForm({ ...form, keywords: tags })}
            placeholder="fault detection, transformer, sensor networks…" />
        </div>

        <div className="card" style={{ background: "#D6A84F0D", border: "1px solid #D6A84F33" }}>
          <div className="flex items-start gap-3">
            <span className="text-[#D6A84F] text-lg mt-0.5">⬡</span>
            <div>
              <p className="text-sm font-semibold text-[#D6A84F] mb-1">GenLayer Validator Review</p>
              <p className="text-xs text-[#9BA7B4]">After submission, GenLayer validators independently evaluate semantic relevance, methodology quality, and corpus fit. A consensus decision is recorded on-chain on GenLayer Studio.</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button type="button" className="btn-secondary" onClick={() => router.back()}>Cancel</button>
          <button type="submit" className="btn-primary">Submit & Review</button>
        </div>
      </form>
    </div>
  );
}

export default function SubmitPaperPage() {
  return (
    <WalletRequired>
      <Suspense fallback={<div className="py-20 text-center text-[#9BA7B4]">Loading…</div>}>
        <SubmitPaperForm />
      </Suspense>
    </WalletRequired>
  );
}
