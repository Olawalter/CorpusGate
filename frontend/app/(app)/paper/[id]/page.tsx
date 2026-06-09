"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getPaper, getReviewResult, getCorpus } from "@/lib/contract";
import type { Paper, ReviewResult, Corpus } from "@/lib/types";
import DecisionBadge from "@/components/DecisionBadge";
import ScoreBar from "@/components/ScoreBar";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function PaperPage() {
  const { id } = useParams<{ id: string }>();
  const [paper, setPaper]   = useState<Paper | null>(null);
  const [review, setReview] = useState<ReviewResult | null>(null);
  const [corpus, setCorpus] = useState<Corpus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, [id]);

  async function load() {
    try {
      const p = await getPaper(id);
      if (p) {
        setPaper(p);
        const [r, c] = await Promise.all([getReviewResult(id), getCorpus(p.corpus_id)]);
        setReview(r);
        setCorpus(c);
      }
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <LoadingSpinner text="Loading paper…" />;
  if (!paper)  return <div className="text-[#94A3B8]">Paper not found.</div>;

  const decisionColor: Record<string, string> = {
    ACCEPT: "#4CAF7D", REJECT: "#D65A5A",
    NEEDS_HUMAN_REVIEW: "#3B82F6", ACCEPT_WITH_LOW_CONFIDENCE: "#94A3B8",
    DUPLICATE_OR_ALREADY_INDEXED: "#3B82F6", SUBMITTED: "#94A3B8",
  };
  const dc = decisionColor[paper.status] ?? "#94A3B8";

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xs font-mono text-[#94A3B8]">{paper.paper_id}</span>
            <DecisionBadge decision={paper.status} />
          </div>
          <h1 className="text-2xl font-bold text-[#F5F7FA] leading-snug" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{paper.title}</h1>
          {paper.authors && <p className="text-sm text-[#94A3B8] mt-1">{paper.authors}</p>}
        </div>
        <div className="flex gap-2">
          {paper.doi && (
            <a href={`https://doi.org/${paper.doi}`} target="_blank" rel="noopener noreferrer" className="btn-secondary text-sm">DOI ↗</a>
          )}
          {paper.paper_url && (
            <a href={paper.paper_url} target="_blank" rel="noopener noreferrer" className="btn-secondary text-sm">Paper ↗</a>
          )}
        </div>
      </div>

      {review ? (
        <div className="card border-2" style={{ borderColor: `${dc}33` }}>
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div>
              <p className="text-xs font-mono text-[#94A3B8] mb-1 tracking-widest uppercase">Review Receipt</p>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-2xl font-bold" style={{ color: dc, fontFamily: "'Space Grotesk', sans-serif" }}>
                  {paper.status.replace(/_/g, " ")}
                </span>
                <span className="badge badge-low">{review.confidence} CONFIDENCE</span>
              </div>
            </div>
            {review.timestamp > 0 && (
              <span className="text-xs font-mono text-[#334155]">{new Date(review.timestamp * 1000).toLocaleDateString()}</span>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <ScoreBar label="Relevance Score" score={review.relevance_score} color="#3B82F6" />
            <ScoreBar label="Quality Score"   score={review.quality_score}   color={review.quality_score >= 70 ? "#4CAF7D" : "#D65A5A"} />
          </div>

          <div className="mb-5">
            <p className="text-xs font-mono text-[#94A3B8] mb-2 uppercase tracking-wider">Validator Reasoning</p>
            <p className="text-sm text-[#F5F7FA] leading-relaxed bg-[#07111F]/50 rounded-lg p-3 border border-[#1E2D42]">
              {review.primary_reason}
            </p>
          </div>

          {review.weaknesses.length > 0 && (
            <div className="mb-5">
              <p className="text-xs font-mono text-[#94A3B8] mb-2 uppercase tracking-wider">Identified Weaknesses</p>
              <ul className="space-y-1">
                {review.weaknesses.map((w, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[#94A3B8]">
                    <span className="text-[#3B82F6] mt-0.5 shrink-0">▸</span>{w}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {review.recommended_tags.length > 0 && (
            <div className="mb-5">
              <p className="text-xs font-mono text-[#94A3B8] mb-2 uppercase tracking-wider">Recommended Tags</p>
              <div className="flex flex-wrap gap-2">
                {review.recommended_tags.map((t) => (
                  <span key={t} className="text-xs px-2.5 py-1 rounded-full bg-[#1E2D42] text-[#94A3B8] font-mono">{t}</span>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-[#1E2D42] flex-wrap">
            {paper.status === "REJECT" && (
              <Link href={`/disputes?paper=${paper.paper_id}`} className="btn-secondary text-sm">Dispute Decision</Link>
            )}
            <Link href={`/corpus/${paper.corpus_id}`} className="btn-secondary text-sm ml-auto">View Corpus →</Link>
          </div>
        </div>
      ) : paper.status === "SUBMITTED" ? (
        <div className="card text-center py-8"><LoadingSpinner text="Review in progress…" /></div>
      ) : null}

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card space-y-3">
          <h2 className="text-sm font-semibold text-[#F5F7FA] uppercase tracking-wider font-mono">Abstract</h2>
          <p className="text-sm text-[#94A3B8] leading-relaxed">{paper.abstract}</p>
        </div>
        <div className="space-y-4">
          {paper.methodology && (
            <div className="card">
              <h2 className="text-sm font-semibold text-[#F5F7FA] uppercase tracking-wider font-mono mb-3">Methodology</h2>
              <p className="text-sm text-[#94A3B8] leading-relaxed">{paper.methodology}</p>
            </div>
          )}
          {paper.conclusion && (
            <div className="card">
              <h2 className="text-sm font-semibold text-[#F5F7FA] uppercase tracking-wider font-mono mb-3">Conclusion</h2>
              <p className="text-sm text-[#94A3B8] leading-relaxed">{paper.conclusion}</p>
            </div>
          )}
          <div className="card">
            <h2 className="text-sm font-semibold text-[#F5F7FA] uppercase tracking-wider font-mono mb-3">Metadata</h2>
            <div className="space-y-2 text-sm">
              {paper.doi && (
                <div className="flex justify-between"><span className="text-[#94A3B8]">DOI</span>
                  <span className="font-mono text-[#F5F7FA] text-xs">{paper.doi}</span></div>
              )}
              {paper.file_hash && (
                <div className="flex justify-between"><span className="text-[#94A3B8]">File Hash</span>
                  <span className="font-mono text-[#94A3B8] text-xs truncate max-w-[160px]">{paper.file_hash}</span></div>
              )}
              <div className="flex justify-between"><span className="text-[#94A3B8]">Corpus</span>
                <Link href={`/corpus/${paper.corpus_id}`} className="font-mono text-[#3B82F6] text-xs hover:opacity-80">{paper.corpus_id}</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
