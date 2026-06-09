export type Decision =
  | "ACCEPT"
  | "REJECT"
  | "NEEDS_HUMAN_REVIEW"
  | "ACCEPT_WITH_LOW_CONFIDENCE"
  | "DUPLICATE_OR_ALREADY_INDEXED"
  | "SUBMITTED"
  | "DISPUTED"
  | "ARCHIVED";

export type Confidence = "LOW" | "MEDIUM" | "HIGH";
export type CorpusStatus = "ACTIVE" | "PAUSED";

export interface Corpus {
  corpus_id: string;
  owner: string;
  name: string;
  description: string;
  include_topics: string[];
  exclude_topics: string[];
  min_relevance_score: number;
  min_quality_score: number;
  status: CorpusStatus;
}

export interface Paper {
  paper_id: string;
  corpus_id: string;
  submitter: string;
  title: string;
  authors: string;
  abstract: string;
  methodology: string;
  conclusion: string;
  keywords: string[];
  doi: string;
  paper_url: string;
  file_hash: string;
  status: Decision;
}

export interface ReviewResult {
  paper_id: string;
  decision: Decision;
  relevance_score: number;
  quality_score: number;
  confidence: Confidence;
  primary_reason: string;
  weaknesses: string[];
  recommended_tags: string[];
  timestamp: number;
}

export interface Dispute {
  paper_id: string;
  submitter: string;
  additional_context: string;
  corrected_methodology: string;
  reviewer_note: string;
  status: "PENDING" | "RESOLVED";
  outcome?: Decision;
}
