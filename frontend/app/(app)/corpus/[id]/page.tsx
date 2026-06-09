"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useWallet } from "@/lib/wallet";
import { getCorpus, getCorpusPapers, getPaper, pauseCorpus } from "@/lib/contract";
import type { Corpus, Paper } from "@/lib/types";
import DecisionBadge from "@/components/DecisionBadge";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function CorpusPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { writeContract, address } = useWallet();
  const [corpus, setCorpus]   = useState<Corpus | null>(null);
  const [papers, setPapers]   = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [pausing, setPausing] = useState(false);

  useEffect(() => { load(); }, [id]);

  async function load() {
    try {
      const c = await getCorpus(id);
      if (!c) { router.push("/dashboard"); return; }
      setCorpus(c);
      const paperIds = await getCorpusPapers(id);
      const paperData = (await Promise.all(paperIds.map(getPaper))).filter(Boolean) as Paper[];
      setPapers(paperData);
    } finally {
      setLoading(false);
    }
  }

  async function handlePause() {
    if (!confirm("Pause this corpus? No new papers will be accepted.")) return;
    setPausing(true);
    try { await pauseCorpus(writeContract, id); await load(); }
    finally { setPausing(false); }
  }

  if (loading) return <LoadingSpinner text="Loading corpus…" />;
  if (!corpus)  return null;

  const isOwner = address && corpus.owner.toLowerCase() === address.toLowerCase();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xs font-mono text-[#9BA7B4]">{corpus.corpus_id}</span>
            <span className={`badge ${corpus.status === "ACTIVE" ? "badge-accept" : "badge-submitted"}`}>{corpus.status}</span>
          </div>
          <h1 className="text-2xl font-bold text-[#F4EFE7]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{corpus.name}</h1>
          <p className="text-[#9BA7B4] mt-2 max-w-2xl">{corpus.description}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/paper/submit?corpus=${id}`} className="btn-primary text-sm">Submit Paper</Link>
          {isOwner && corpus.status === "ACTIVE" && (
            <button onClick={handlePause} disabled={pausing} className="btn-secondary text-sm">
              {pausing ? "Pausing…" : "Pause"}
            </button>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-xs text-[#9BA7B4] mb-2 font-mono">INCLUDE TOPICS</p>
          <div className="flex flex-wrap gap-1.5">
            {!corpus.include_topics?.length
              ? <span className="text-xs text-[#4a5568]">Any topic</span>
              : corpus.include_topics.map((t) => (
                  <span key={t} className="text-xs px-2 py-0.5 rounded bg-[#4CAF7D]/10 text-[#4CAF7D] border border-[#4CAF7D]/20 font-mono">{t}</span>
                ))}
          </div>
        </div>
        <div className="card">
          <p className="text-xs text-[#9BA7B4] mb-2 font-mono">EXCLUDE TOPICS</p>
          <div className="flex flex-wrap gap-1.5">
            {!corpus.exclude_topics?.length
              ? <span className="text-xs text-[#4a5568]">None</span>
              : corpus.exclude_topics.map((t) => (
                  <span key={t} className="text-xs px-2 py-0.5 rounded bg-[#D65A5A]/10 text-[#D65A5A] border border-[#D65A5A]/20 font-mono">{t}</span>
                ))}
          </div>
        </div>
        <div className="card">
          <p className="text-xs text-[#9BA7B4] mb-2 font-mono">THRESHOLDS</p>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-[#9BA7B4]">Min Relevance</span>
              <span className="font-mono text-[#D6A84F]">{corpus.min_relevance_score}/100</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#9BA7B4]">Min Quality</span>
              <span className="font-mono text-[#D6A84F]">{corpus.min_quality_score}/100</span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#F4EFE7]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Accepted Papers ({papers.length})
          </h2>
        </div>
        {papers.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-[#9BA7B4] mb-4">No accepted papers yet.</p>
            <Link href={`/paper/submit?corpus=${id}`} className="btn-primary">Submit the first paper</Link>
          </div>
        ) : (
          <div className="card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2E3338]">
                  <th className="text-left p-4 text-xs text-[#9BA7B4] font-normal">Title</th>
                  <th className="text-left p-4 text-xs text-[#9BA7B4] font-normal hidden md:table-cell">Authors</th>
                  <th className="text-left p-4 text-xs text-[#9BA7B4] font-normal">Status</th>
                  <th className="text-right p-4 text-xs text-[#9BA7B4] font-normal">Action</th>
                </tr>
              </thead>
              <tbody>
                {papers.map((p) => (
                  <tr key={p.paper_id} className="border-b border-[#2E3338]/50 hover:bg-[#2E3338]/20">
                    <td className="p-4 text-[#F4EFE7] font-medium max-w-xs">
                      <div className="truncate">{p.title}</div>
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {p.keywords?.slice(0, 3).map((k) => (
                          <span key={k} className="text-xs px-1.5 py-0.5 rounded bg-[#2E3338] text-[#9BA7B4] font-mono">{k}</span>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 text-[#9BA7B4] hidden md:table-cell">{p.authors}</td>
                    <td className="p-4"><DecisionBadge decision={p.status} /></td>
                    <td className="p-4 text-right">
                      <Link href={`/paper/${p.paper_id}`} className="text-xs text-[#D6A84F] hover:opacity-80">View →</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
