"use client";
import { readContract } from "./reader";
import type { Corpus, Paper, ReviewResult, Dispute } from "./types";

export type WriteFn = (method: string, args?: unknown[]) => Promise<unknown>;

function parseJson<T>(raw: unknown, fallback: T): T {
  if (typeof raw !== "string") return fallback;
  try { return JSON.parse(raw) as T; }
  catch { return fallback; }
}

// ── Corpora ───────────────────────────────────────────────────────────────────

export async function getAllCorporaIds(): Promise<string[]> {
  const raw = await readContract("get_all_corpora_ids");
  return parseJson<string[]>(raw, []);
}

export async function getCorpus(corpusId: string): Promise<Corpus | null> {
  const raw = await readContract("get_corpus", [corpusId]);
  const parsed = parseJson<Corpus>(raw, {} as Corpus);
  return parsed.corpus_id ? parsed : null;
}

export async function getCorpusPapers(corpusId: string): Promise<string[]> {
  const raw = await readContract("get_corpus_papers", [corpusId]);
  return parseJson<string[]>(raw, []);
}

export async function createCorpus(write: WriteFn, corpusId: string, data: Omit<Corpus, "corpus_id" | "owner" | "status">) {
  return write("create_corpus", [corpusId, JSON.stringify(data)]);
}

export async function updateCorpusRules(write: WriteFn, corpusId: string, rules: Partial<Corpus>) {
  return write("update_corpus_rules", [corpusId, JSON.stringify(rules)]);
}

export async function pauseCorpus(write: WriteFn, corpusId: string) {
  return write("pause_corpus", [corpusId]);
}

// ── Papers ────────────────────────────────────────────────────────────────────

export async function getPaper(paperId: string): Promise<Paper | null> {
  const raw = await readContract("get_paper", [paperId]);
  const parsed = parseJson<Paper>(raw, {} as Paper);
  return parsed.paper_id ? parsed : null;
}

export async function submitPaper(write: WriteFn, paperId: string, corpusId: string, data: Omit<Paper, "paper_id" | "corpus_id" | "submitter" | "status">) {
  return write("submit_paper", [paperId, corpusId, JSON.stringify(data)]);
}

export async function reviewPaper(write: WriteFn, paperId: string) {
  return write("review_paper", [paperId]);
}

export async function archivePaper(write: WriteFn, paperId: string) {
  return write("archive_paper", [paperId]);
}

// ── Reviews ───────────────────────────────────────────────────────────────────

export async function getReviewResult(paperId: string): Promise<ReviewResult | null> {
  const raw = await readContract("get_review_result", [paperId]);
  const parsed = parseJson<ReviewResult>(raw, {} as ReviewResult);
  return parsed.paper_id ? parsed : null;
}

// ── Disputes ──────────────────────────────────────────────────────────────────

export async function getDispute(paperId: string): Promise<Dispute | null> {
  const raw = await readContract("get_dispute", [paperId]);
  const parsed = parseJson<Dispute>(raw, {} as Dispute);
  return parsed.paper_id ? parsed : null;
}

export async function disputeDecision(write: WriteFn, paperId: string, data: Omit<Dispute, "paper_id" | "submitter" | "status">) {
  return write("dispute_decision", [paperId, JSON.stringify(data)]);
}

export async function resolveDispute(write: WriteFn, paperId: string) {
  return write("resolve_dispute", [paperId]);
}

// ── Reputation ─────────────────────────────────────────────────────────────────

export async function getReputation(address: string): Promise<number> {
  const raw = await readContract("get_submitter_reputation", [address]);
  return parseInt(raw as string, 10) || 0;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
