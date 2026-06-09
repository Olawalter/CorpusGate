"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useWallet } from "@/lib/wallet";
import { getAllCorporaIds, getCorpusPapers, getPaper, getDispute, disputeDecision, resolveDispute } from "@/lib/contract";
import type { Paper, Dispute } from "@/lib/types";
import DecisionBadge from "@/components/DecisionBadge";
import LoadingSpinner from "@/components/LoadingSpinner";
import WalletRequired from "@/components/WalletRequired";

function DisputesContent() {
  const searchParams = useSearchParams();
  const { writeContract } = useWallet();

  const [rejectedPapers, setRejected] = useState<Paper[]>([]);
  const [disputes, setDisputes]       = useState<Record<string, Dispute>>({});
  const [loading, setLoading]         = useState(true);
  const [form, setForm] = useState({
    paper_id: searchParams.get("paper") ?? "",
    additional_context: "", corrected_methodology: "", reviewer_note: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [resolving, setResolving]   = useState<string | null>(null);
  const [error, setError]           = useState<string | null>(null);
  const [success, setSuccess]       = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const ids = await getAllCorporaIds();
      const paperIdSets = await Promise.all(ids.map(getCorpusPapers));
      const allIds = Array.from(new Set(paperIdSets.flat()));
      const papers = (await Promise.all(allIds.map(getPaper))).filter(Boolean) as Paper[];
      const rejected = papers.filter((p) => p.status === "REJECT" || p.status === "DISPUTED");
      setRejected(rejected);
      const disputeData: Record<string, Dispute> = {};
      for (const p of rejected) {
        const d = await getDispute(p.paper_id);
        if (d) disputeData[p.paper_id] = d;
      }
      setDisputes(disputeData);
    } finally {
      setLoading(false);
    }
  }

  async function handleDispute(e: React.FormEvent) {
    e.preventDefault();
    if (!form.paper_id || !form.additional_context) { setError("Select a paper and provide context."); return; }
    setSubmitting(true); setError(null);
    try {
      const { paper_id, ...rest } = form;
      await disputeDecision(writeContract, paper_id, rest);
      setSuccess("Dispute filed. Validators will re-evaluate your submission.");
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to file dispute");
    } finally { setSubmitting(false); }
  }

  async function handleResolve(paperId: string) {
    setResolving(paperId); setError(null);
    try {
      await resolveDispute(writeContract, paperId);
      setSuccess("Dispute resolved by GenLayer validators.");
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to resolve");
    } finally { setResolving(null); }
  }

  if (loading) return <LoadingSpinner text="Loading disputes…" />;

  const pending  = Object.values(disputes).filter((d) => d.status === "PENDING");
  const resolved = Object.values(disputes).filter((d) => d.status === "RESOLVED");

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-[#F5F7FA]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Disputes</h1>
        <p className="text-sm text-[#94A3B8] mt-1">Challenge a rejected paper with additional evidence. Validators re-evaluate on GenLayer Studio.</p>
      </div>

      {error   && <div className="p-4 rounded-lg bg-[#D65A5A]/10 border border-[#D65A5A]/30 text-[#D65A5A] text-sm">{error}</div>}
      {success && <div className="p-4 rounded-lg bg-[#4CAF7D]/10 border border-[#4CAF7D]/30 text-[#4CAF7D] text-sm">{success}</div>}

      {pending.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-[#F5F7FA] mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Pending Disputes</h2>
          <div className="space-y-3">
            {pending.map((d) => {
              const paper = rejectedPapers.find((p) => p.paper_id === d.paper_id);
              return (
                <div key={d.paper_id} className="card flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <p className="text-xs font-mono text-[#94A3B8] mb-1">{d.paper_id}</p>
                    <p className="font-semibold text-[#F5F7FA]">{paper?.title ?? d.paper_id}</p>
                    <p className="text-sm text-[#94A3B8] mt-1">{d.additional_context}</p>
                    <span className="badge badge-review mt-2">PENDING</span>
                  </div>
                  <button onClick={() => handleResolve(d.paper_id)} disabled={resolving === d.paper_id}
                    className="btn-primary text-sm shrink-0">
                    {resolving === d.paper_id ? "Resolving…" : "Re-evaluate"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold text-[#F5F7FA] mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>File a Dispute</h2>
        <form onSubmit={handleDispute} className="card space-y-5">
          <div>
            <label className="block text-sm text-[#94A3B8] mb-1.5">Rejected Paper *</label>
            <select className="input" value={form.paper_id}
              onChange={(e) => setForm({ ...form, paper_id: e.target.value })} required>
              <option value="">— Select a rejected paper —</option>
              {rejectedPapers.filter((p) => p.status === "REJECT").map((p) => (
                <option key={p.paper_id} value={p.paper_id}>{p.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-[#94A3B8] mb-1.5">Additional Context *</label>
            <textarea className="input" rows={4}
              placeholder="Explain why the rejection was incorrect. Provide clarification that validators may have missed."
              value={form.additional_context}
              onChange={(e) => setForm({ ...form, additional_context: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm text-[#94A3B8] mb-1.5">Corrected Methodology (optional)</label>
            <textarea className="input" rows={3}
              placeholder="Provide a clearer description of the research method if the original was unclear."
              value={form.corrected_methodology}
              onChange={(e) => setForm({ ...form, corrected_methodology: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm text-[#94A3B8] mb-1.5">Note to Reviewer (optional)</label>
            <textarea className="input" rows={2}
              placeholder="Any message you want to include for the validator review."
              value={form.reviewer_note}
              onChange={(e) => setForm({ ...form, reviewer_note: e.target.value })} />
          </div>
          <div className="p-3 rounded-lg" style={{ background: "#3B82F60D", border: "1px solid #3B82F633" }}>
            <p className="text-xs text-[#3B82F6]">⚠ Filing a dispute triggers a new GenLayer validator consensus on Studio. The on-chain decision will be updated.</p>
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? "Filing…" : "File Dispute"}
            </button>
          </div>
        </form>
      </div>

      {resolved.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-[#F5F7FA] mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Resolved Disputes</h2>
          <div className="space-y-3">
            {resolved.map((d) => (
              <div key={d.paper_id} className="card flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-xs font-mono text-[#94A3B8] mb-1">{d.paper_id}</p>
                  <p className="text-sm text-[#94A3B8]">{d.additional_context}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {d.outcome && <DecisionBadge decision={d.outcome} />}
                  <Link href={`/paper/${d.paper_id}`} className="text-xs text-[#3B82F6] hover:opacity-80">View →</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function DisputesPage() {
  return (
    <WalletRequired>
      <Suspense fallback={<div className="py-20 text-center text-[#94A3B8]">Loading…</div>}>
        <DisputesContent />
      </Suspense>
    </WalletRequired>
  );
}
