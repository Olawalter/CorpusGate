"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getAllCorporaIds, getCorpus, getCorpusPapers, getPaper, getReviewResult } from "@/lib/contract";
import type { Paper, Corpus, ReviewResult } from "@/lib/types";
import DecisionBadge from "@/components/DecisionBadge";
import ScoreBar from "@/components/ScoreBar";
import LoadingSpinner from "@/components/LoadingSpinner";

interface PaperWithReview { paper: Paper; review: ReviewResult | null; corpus: Corpus | null }

export default function LibraryPage() {
  const [items, setItems]         = useState<PaperWithReview[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [filterCorpus, setFilter] = useState("all");
  const [corpora, setCorpora]     = useState<Corpus[]>([]);
  const [minScore, setMinScore]   = useState(0);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const ids = await getAllCorporaIds();
      const corpusList = (await Promise.all(ids.map(getCorpus))).filter(Boolean) as Corpus[];
      setCorpora(corpusList);
      const paperIdSets = await Promise.all(ids.map(getCorpusPapers));
      const allIds = Array.from(new Set(paperIdSets.flat()));
      const papers = (await Promise.all(allIds.map(getPaper))).filter(Boolean) as Paper[];
      const accepted = papers.filter((p) => p.status === "ACCEPT" || p.status === "ACCEPT_WITH_LOW_CONFIDENCE");
      const withReview = await Promise.all(
        accepted.map(async (p) => ({
          paper: p,
          review: await getReviewResult(p.paper_id),
          corpus: corpusList.find((c) => c.corpus_id === p.corpus_id) ?? null,
        }))
      );
      setItems(withReview);
    } finally {
      setLoading(false);
    }
  }

  const filtered = items.filter(({ paper, review, corpus }) => {
    if (filterCorpus !== "all" && paper.corpus_id !== filterCorpus) return false;
    if (review && review.relevance_score < minScore) return false;
    if (search) {
      const q = search.toLowerCase();
      return paper.title.toLowerCase().includes(q) ||
             (paper.abstract?.toLowerCase().includes(q) ?? false) ||
             (paper.authors?.toLowerCase().includes(q) ?? false) ||
             (corpus?.name.toLowerCase().includes(q) ?? false);
    }
    return true;
  });

  if (loading) return <LoadingSpinner text="Loading library…" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#F5F7FA]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Corpus Library</h1>
          <p className="text-sm text-[#94A3B8] mt-1">{filtered.length} accepted paper{filtered.length !== 1 ? "s" : ""}</p>
        </div>
        <Link href="/paper/submit" className="btn-primary text-sm">Submit Paper</Link>
      </div>

      <div className="card p-4 flex flex-wrap gap-4 items-center">
        <input className="input flex-1 min-w-[200px]" placeholder="Search papers, authors, topics…"
          value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="input w-auto" value={filterCorpus} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All Corpora</option>
          {corpora.map((c) => <option key={c.corpus_id} value={c.corpus_id}>{c.name}</option>)}
        </select>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#94A3B8] whitespace-nowrap">Min relevance</span>
          <input type="range" min={0} max={100} value={minScore}
            onChange={(e) => setMinScore(parseInt(e.target.value))}
            className="w-24 accent-[#3B82F6]" />
          <span className="text-xs font-mono text-[#3B82F6] w-8">{minScore}</span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-[#94A3B8] mb-4">No accepted papers match your filters.</p>
          <Link href="/paper/submit" className="btn-primary">Submit a Paper</Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map(({ paper, review, corpus }) => (
            <Link key={paper.paper_id} href={`/paper/${paper.paper_id}`}
              className="card hover:border-[#3B82F6]/30 transition-colors block space-y-3">
              <div className="flex items-start justify-between gap-2">
                <DecisionBadge decision={paper.status} />
                {review && <span className="text-xs font-mono text-[#94A3B8]">{review.confidence}</span>}
              </div>
              <h3 className="font-semibold text-[#F5F7FA] leading-snug line-clamp-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {paper.title}
              </h3>
              {paper.authors && <p className="text-xs text-[#94A3B8]">{paper.authors}</p>}
              <p className="text-sm text-[#94A3B8] line-clamp-2">{paper.abstract}</p>
              {review && (
                <div className="space-y-2">
                  <ScoreBar label="Relevance" score={review.relevance_score} color="#3B82F6" />
                  <ScoreBar label="Quality"   score={review.quality_score}   color={review.quality_score >= 70 ? "#4CAF7D" : "#3B82F6"} />
                </div>
              )}
              <div className="flex items-center justify-between pt-2 border-t border-[#1E2D42]">
                {corpus && <span className="text-xs text-[#94A3B8]">{corpus.name}</span>}
                <div className="flex flex-wrap gap-1 ml-auto">
                  {paper.keywords?.slice(0, 3).map((k) => (
                    <span key={k} className="text-xs px-1.5 py-0.5 rounded bg-[#1E2D42] text-[#94A3B8] font-mono">{k}</span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
