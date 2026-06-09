"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getAllCorporaIds, getCorpus, getCorpusPapers, getPaper } from "@/lib/contract";
import type { Corpus, Paper } from "@/lib/types";
import DecisionBadge from "@/components/DecisionBadge";
import LoadingSpinner from "@/components/LoadingSpinner";

interface Stats { total: number; submitted: number; accepted: number; rejected: number; pending: number; disputes: number }

export default function Dashboard() {
  const [corpora, setCorpora]     = useState<Corpus[]>([]);
  const [stats, setStats]         = useState<Stats>({ total:0, submitted:0, accepted:0, rejected:0, pending:0, disputes:0 });
  const [recentPapers, setRecent] = useState<Paper[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const ids = await getAllCorporaIds();
      const corpusData = (await Promise.all(ids.map(getCorpus))).filter(Boolean) as Corpus[];
      setCorpora(corpusData);

      const paperIdSets = await Promise.all(ids.map(getCorpusPapers));
      const allIds = Array.from(new Set(paperIdSets.flat()));
      const papers = (await Promise.all(allIds.map(getPaper))).filter(Boolean) as Paper[];

      const s: Stats = { total: papers.length, submitted:0, accepted:0, rejected:0, pending:0, disputes:0 };
      for (const p of papers) {
        if (p.status === "SUBMITTED")                                               s.submitted++;
        else if (p.status === "ACCEPT" || p.status === "ACCEPT_WITH_LOW_CONFIDENCE") s.accepted++;
        else if (p.status === "REJECT")                                             s.rejected++;
        else if (p.status === "NEEDS_HUMAN_REVIEW")                                 s.pending++;
        else if (p.status === "DISPUTED")                                           s.disputes++;
      }
      setStats(s);
      setRecent(papers.slice(-5).reverse());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <LoadingSpinner text="Loading dashboard…" />;

  const STAT_CARDS = [
    { label: "Total Papers",   value: stats.total,     color: "#9BA7B4" },
    { label: "Accepted",       value: stats.accepted,  color: "#4CAF7D" },
    { label: "Rejected",       value: stats.rejected,  color: "#D65A5A" },
    { label: "Pending Review", value: stats.pending,   color: "#E0A33A" },
    { label: "In Review",      value: stats.submitted, color: "#D6A84F" },
    { label: "Disputes",       value: stats.disputes,  color: "#9BA7B4" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#F4EFE7]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Dashboard</h1>
          <p className="text-sm text-[#9BA7B4] mt-1">Research corpus overview</p>
        </div>
        <div className="flex gap-3">
          <Link href="/corpus/create" className="btn-primary">New Corpus</Link>
          <Link href="/paper/submit" className="btn-secondary">Submit Paper</Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-[#D65A5A]/10 border border-[#D65A5A]/30 text-[#D65A5A] text-sm">
          {error} — check that the contract is deployed on GenLayer Studio.
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {STAT_CARDS.map((s) => (
          <div key={s.label} className="card p-4 text-center">
            <div className="text-3xl font-bold font-mono mb-1" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs text-[#9BA7B4]">{s.label}</div>
          </div>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#F4EFE7]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Your Corpora</h2>
          <Link href="/corpus/create" className="text-sm text-[#D6A84F] hover:opacity-80">+ New</Link>
        </div>
        {corpora.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-[#9BA7B4] mb-4">No corpora yet.</p>
            <Link href="/corpus/create" className="btn-primary">Create your first corpus</Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {corpora.map((c) => (
              <Link key={c.corpus_id} href={`/corpus/${c.corpus_id}`} className="card hover:border-[#D6A84F]/40 transition-colors block">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-xs font-mono text-[#9BA7B4] truncate max-w-[140px]">{c.corpus_id}</span>
                  <span className={`badge ${c.status === "ACTIVE" ? "badge-accept" : "badge-submitted"}`}>{c.status}</span>
                </div>
                <h3 className="font-semibold text-[#F4EFE7] mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{c.name}</h3>
                <p className="text-sm text-[#9BA7B4] line-clamp-2">{c.description}</p>
                <div className="mt-3 flex gap-2 flex-wrap">
                  {c.include_topics?.slice(0, 3).map((t) => (
                    <span key={t} className="text-xs px-2 py-0.5 rounded bg-[#2E3338] text-[#9BA7B4] font-mono">{t}</span>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-[#2E3338] flex gap-4 text-xs text-[#9BA7B4]">
                  <span>Relevance ≥ {c.min_relevance_score}</span>
                  <span>Quality ≥ {c.min_quality_score}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {recentPapers.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-[#F4EFE7] mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Recent Papers</h2>
          <div className="card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2E3338]">
                  <th className="text-left p-4 text-xs text-[#9BA7B4] font-normal">Paper</th>
                  <th className="text-left p-4 text-xs text-[#9BA7B4] font-normal hidden md:table-cell">Corpus</th>
                  <th className="text-left p-4 text-xs text-[#9BA7B4] font-normal">Status</th>
                  <th className="text-right p-4 text-xs text-[#9BA7B4] font-normal">Action</th>
                </tr>
              </thead>
              <tbody>
                {recentPapers.map((p) => (
                  <tr key={p.paper_id} className="border-b border-[#2E3338]/50 hover:bg-[#2E3338]/20">
                    <td className="p-4 text-[#F4EFE7] font-medium max-w-xs truncate">{p.title}</td>
                    <td className="p-4 text-[#9BA7B4] font-mono text-xs hidden md:table-cell">{p.corpus_id}</td>
                    <td className="p-4"><DecisionBadge decision={p.status} /></td>
                    <td className="p-4 text-right">
                      <Link href={`/paper/${p.paper_id}`} className="text-xs text-[#D6A84F] hover:opacity-80">View →</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
