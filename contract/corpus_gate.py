# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *
import json


VALID_DECISIONS = {
    "ACCEPT",
    "REJECT",
    "NEEDS_HUMAN_REVIEW",
    "ACCEPT_WITH_LOW_CONFIDENCE",
    "DUPLICATE_OR_ALREADY_INDEXED",
}
VALID_CONFIDENCE = {"LOW", "MEDIUM", "HIGH"}


class CorpusGate(gl.Contract):
    # TreeMap[corpus_id -> corpus_json_str]
    corpora: TreeMap[str, str]
    # TreeMap[paper_id -> paper_json_str]
    papers: TreeMap[str, str]
    # TreeMap[paper_id -> review_json_str]
    reviews: TreeMap[str, str]
    # TreeMap[paper_id -> dispute_json_str]
    disputes: TreeMap[str, str]
    # TreeMap[address -> reputation_score int stored as str]
    reputation: TreeMap[str, str]
    # TreeMap[corpus_id -> DynArray of paper_ids as json list]
    corpus_papers: TreeMap[str, str]

    def __init__(self) -> None:
        self.corpora = TreeMap()
        self.papers = TreeMap()
        self.reviews = TreeMap()
        self.disputes = TreeMap()
        self.reputation = TreeMap()
        self.corpus_papers = TreeMap()

    # ──────────────────────────────────────────────
    # Write functions
    # ──────────────────────────────────────────────

    @gl.public.write
    def create_corpus(self, corpus_id: str, corpus_json: str) -> None:
        assert corpus_id not in self.corpora, "Corpus already exists"
        data = json.loads(corpus_json)
        assert "name" in data, "Missing name"
        assert "description" in data, "Missing description"
        data["owner"] = str(gl.message.sender_address)
        data["corpus_id"] = corpus_id
        data["status"] = "ACTIVE"
        data.setdefault("min_relevance_score", 70)
        data.setdefault("min_quality_score", 65)
        data.setdefault("include_topics", [])
        data.setdefault("exclude_topics", [])
        self.corpora[corpus_id] = json.dumps(data)
        self.corpus_papers[corpus_id] = json.dumps([])
        self._add_reputation(str(gl.message.sender_address), 5)

    @gl.public.write
    def update_corpus_rules(self, corpus_id: str, updated_rules_json: str) -> None:
        assert corpus_id in self.corpora, "Corpus not found"
        corpus = json.loads(self.corpora[corpus_id])
        assert corpus["owner"] == str(gl.message.sender_address), "Not corpus owner"
        updates = json.loads(updated_rules_json)
        for k, v in updates.items():
            if k not in ("corpus_id", "owner"):
                corpus[k] = v
        self.corpora[corpus_id] = json.dumps(corpus)

    @gl.public.write
    def pause_corpus(self, corpus_id: str) -> None:
        assert corpus_id in self.corpora, "Corpus not found"
        corpus = json.loads(self.corpora[corpus_id])
        assert corpus["owner"] == str(gl.message.sender_address), "Not corpus owner"
        corpus["status"] = "PAUSED"
        self.corpora[corpus_id] = json.dumps(corpus)

    @gl.public.write
    def submit_paper(self, paper_id: str, corpus_id: str, paper_json: str) -> None:
        assert paper_id not in self.papers, "Paper already submitted"
        assert corpus_id in self.corpora, "Corpus not found"
        corpus = json.loads(self.corpora[corpus_id])
        assert corpus["status"] == "ACTIVE", "Corpus is not active"
        data = json.loads(paper_json)
        assert "title" in data, "Missing title"
        assert "abstract" in data, "Missing abstract"
        data["paper_id"] = paper_id
        data["corpus_id"] = corpus_id
        data["submitter"] = str(gl.message.sender_address)
        data["status"] = "SUBMITTED"
        self.papers[paper_id] = json.dumps(data)

    @gl.public.write
    def review_paper(self, paper_id: str) -> None:
        assert paper_id in self.papers, "Paper not found"
        paper = json.loads(self.papers[paper_id])
        assert paper["status"] == "SUBMITTED", "Paper not in SUBMITTED state"

        corpus = json.loads(self.corpora[paper["corpus_id"]])

        include_topics = ", ".join(corpus.get("include_topics", []))
        exclude_topics = ", ".join(corpus.get("exclude_topics", []))
        min_relevance = corpus.get("min_relevance_score", 70)
        min_quality = corpus.get("min_quality_score", 65)

        prompt = f"""You are an expert academic reviewer evaluating whether a research paper qualifies for admission into a curated research corpus.

CORPUS DEFINITION
Name: {corpus['name']}
Description: {corpus['description']}
Include topics: {include_topics or 'Any relevant academic topic'}
Exclude topics: {exclude_topics or 'None specified'}
Minimum relevance score required: {min_relevance}/100
Minimum quality score required: {min_quality}/100

PAPER SUBMITTED FOR REVIEW
Title: {paper.get('title', 'N/A')}
Authors: {paper.get('authors', 'N/A')}
Abstract: {paper.get('abstract', 'N/A')}
Keywords: {', '.join(paper.get('keywords', []))}
Methodology excerpt: {paper.get('methodology', 'Not provided')}
Conclusion excerpt: {paper.get('conclusion', 'Not provided')}

EVALUATION CRITERIA
1. Semantic relevance — Does the paper's core content match the corpus topic?
2. Methodology quality — Is the research method clearly described and rigorous?
3. Evidence strength — Are claims supported by data, experiments, or references?
4. Topic fit — Is the paper within included topics and outside excluded topics?
5. Quality signals — Flag if vague, promotional, spam, or lacking academic substance.
6. Novelty — Does the paper contribute something beyond what is already known?

DECISION OPTIONS
- ACCEPT: Paper clearly belongs and meets both score thresholds.
- REJECT: Paper is irrelevant, too weak, misleading, or excluded.
- NEEDS_HUMAN_REVIEW: Borderline case requiring expert judgement.
- ACCEPT_WITH_LOW_CONFIDENCE: Relevant but uncertain — admit with a flag.
- DUPLICATE_OR_ALREADY_INDEXED: Appears to duplicate an existing entry.

Return ONLY valid JSON with no additional text, no markdown, no explanation:
{{
  "decision": "<one of the five options above>",
  "relevance_score": <integer 0-100>,
  "quality_score": <integer 0-100>,
  "confidence": "<LOW | MEDIUM | HIGH>",
  "primary_reason": "<one clear sentence explaining the decision>",
  "weaknesses": ["<weakness 1>", "<weakness 2>"],
  "recommended_tags": ["<tag1>", "<tag2>"]
}}"""

        # Non-deterministic LLM call must be run via gl.nondet.exec_prompt
        # inside a leader function and wrapped with an Equivalence Principle
        # so validators can reach consensus on the result.
        def _run_review() -> str:
            return gl.nondet.exec_prompt(prompt)

        raw = gl.eq_principle.prompt_comparative(
            _run_review,
            principle=(
                "The JSON responses are equivalent if they agree on: "
                "decision field exactly, relevance_score within 10 points, "
                "quality_score within 10 points, and confidence level exactly."
            ),
        )

        # Parse and validate
        try:
            result = json.loads(raw.strip())
        except Exception:
            start = raw.find("{")
            end = raw.rfind("}") + 1
            result = json.loads(raw[start:end])

        assert result.get("decision") in VALID_DECISIONS, f"Invalid decision: {result.get('decision')}"
        assert result.get("confidence") in VALID_CONFIDENCE, f"Invalid confidence: {result.get('confidence')}"
        assert isinstance(result.get("relevance_score"), (int, float)), "Invalid relevance_score"
        assert isinstance(result.get("quality_score"), (int, float)), "Invalid quality_score"
        assert 0 <= result["relevance_score"] <= 100, "relevance_score out of range"
        assert 0 <= result["quality_score"] <= 100, "quality_score out of range"

        result["paper_id"] = paper_id
        result["timestamp"] = gl.message.timestamp_ms // 1000 if hasattr(gl.message, 'timestamp_ms') else 0
        result["relevance_score"] = int(result["relevance_score"])
        result["quality_score"] = int(result["quality_score"])
        if not isinstance(result.get("weaknesses"), list):
            result["weaknesses"] = []
        if not isinstance(result.get("recommended_tags"), list):
            result["recommended_tags"] = []

        self.reviews[paper_id] = json.dumps(result)

        paper["status"] = result["decision"]
        self.papers[paper_id] = json.dumps(paper)

        if result["decision"] in ("ACCEPT", "ACCEPT_WITH_LOW_CONFIDENCE"):
            papers_list = json.loads(self.corpus_papers.get(paper["corpus_id"], "[]"))
            if paper_id not in papers_list:
                papers_list.append(paper_id)
            self.corpus_papers[paper["corpus_id"]] = json.dumps(papers_list)
            self._add_reputation(paper["submitter"], 10)
        elif result["decision"] == "REJECT":
            self._add_reputation(paper["submitter"], -3)

    @gl.public.write
    def dispute_decision(self, paper_id: str, dispute_json: str) -> None:
        assert paper_id in self.papers, "Paper not found"
        paper = json.loads(self.papers[paper_id])
        assert paper["submitter"] == str(gl.message.sender_address), "Not paper submitter"
        assert paper["status"] == "REJECT", "Can only dispute rejected papers"
        data = json.loads(dispute_json)
        data["paper_id"] = paper_id
        data["submitter"] = str(gl.message.sender_address)
        data["status"] = "PENDING"
        self.disputes[paper_id] = json.dumps(data)
        paper["status"] = "DISPUTED"
        self.papers[paper_id] = json.dumps(paper)

    @gl.public.write
    def resolve_dispute(self, paper_id: str) -> None:
        assert paper_id in self.disputes, "No dispute found"
        dispute = json.loads(self.disputes[paper_id])
        paper = json.loads(self.papers[paper_id])
        corpus = json.loads(self.corpora[paper["corpus_id"]])

        additional_context = dispute.get("additional_context", "")
        corrected_methodology = dispute.get("corrected_methodology", "")
        reviewer_note = dispute.get("reviewer_note", "")

        prompt = f"""You are re-evaluating a research paper that was previously REJECTED and the author has filed a dispute.

CORPUS DEFINITION
Name: {corpus['name']}
Description: {corpus['description']}

PAPER
Title: {paper.get('title', 'N/A')}
Abstract: {paper.get('abstract', 'N/A')}

ORIGINAL REJECTION REASON
{json.loads(self.reviews.get(paper_id, '{}')).get('primary_reason', 'Not available')}

DISPUTE CONTEXT FROM AUTHOR
Additional context: {additional_context}
Corrected methodology: {corrected_methodology}
Reviewer note: {reviewer_note}

Re-evaluate fairly. The author has provided additional clarification.
Return ONLY valid JSON:
{{
  "decision": "<ACCEPT | REJECT | NEEDS_HUMAN_REVIEW | ACCEPT_WITH_LOW_CONFIDENCE>",
  "relevance_score": <integer 0-100>,
  "quality_score": <integer 0-100>,
  "confidence": "<LOW | MEDIUM | HIGH>",
  "primary_reason": "<one clear sentence>",
  "weaknesses": [],
  "recommended_tags": []
}}"""

        # Non-deterministic LLM call wrapped in Equivalence Principle
        def _run_dispute_review() -> str:
            return gl.nondet.exec_prompt(prompt)

        raw = gl.eq_principle.prompt_comparative(
            _run_dispute_review,
            principle=(
                "The JSON responses are equivalent if they agree on: "
                "decision field exactly and confidence level exactly."
            ),
        )

        try:
            result = json.loads(raw.strip())
        except Exception:
            start = raw.find("{")
            end = raw.rfind("}") + 1
            result = json.loads(raw[start:end])

        assert result.get("decision") in VALID_DECISIONS, "Invalid decision"
        assert result.get("confidence") in VALID_CONFIDENCE, "Invalid confidence"

        result["paper_id"] = paper_id
        result["relevance_score"] = int(result.get("relevance_score", 0))
        result["quality_score"] = int(result.get("quality_score", 0))
        if not isinstance(result.get("weaknesses"), list):
            result["weaknesses"] = []
        if not isinstance(result.get("recommended_tags"), list):
            result["recommended_tags"] = []

        self.reviews[paper_id] = json.dumps(result)
        paper["status"] = result["decision"]
        self.papers[paper_id] = json.dumps(paper)

        dispute["status"] = "RESOLVED"
        dispute["outcome"] = result["decision"]
        self.disputes[paper_id] = json.dumps(dispute)

        if result["decision"] in ("ACCEPT", "ACCEPT_WITH_LOW_CONFIDENCE"):
            papers_list = json.loads(self.corpus_papers.get(paper["corpus_id"], "[]"))
            if paper_id not in papers_list:
                papers_list.append(paper_id)
            self.corpus_papers[paper["corpus_id"]] = json.dumps(papers_list)

    @gl.public.write
    def archive_paper(self, paper_id: str) -> None:
        assert paper_id in self.papers, "Paper not found"
        paper = json.loads(self.papers[paper_id])
        corpus = json.loads(self.corpora[paper["corpus_id"]])
        assert corpus["owner"] == str(gl.message.sender_address), "Not corpus owner"
        paper["status"] = "ARCHIVED"
        self.papers[paper_id] = json.dumps(paper)

    # ──────────────────────────────────────────────
    # View functions
    # ──────────────────────────────────────────────

    @gl.public.view
    def get_corpus(self, corpus_id: str) -> str:
        return self.corpora.get(corpus_id, "{}")

    @gl.public.view
    def get_paper(self, paper_id: str) -> str:
        return self.papers.get(paper_id, "{}")

    @gl.public.view
    def get_review_result(self, paper_id: str) -> str:
        return self.reviews.get(paper_id, "{}")

    @gl.public.view
    def get_corpus_papers(self, corpus_id: str) -> str:
        return self.corpus_papers.get(corpus_id, "[]")

    @gl.public.view
    def get_submitter_reputation(self, address: str) -> str:
        return self.reputation.get(address, "0")

    @gl.public.view
    def get_dispute(self, paper_id: str) -> str:
        return self.disputes.get(paper_id, "{}")

    @gl.public.view
    def get_all_corpora_ids(self) -> str:
        ids = []
        for k in self.corpora:
            ids.append(k)
        return json.dumps(ids)

    # ──────────────────────────────────────────────
    # Internal helpers
    # ──────────────────────────────────────────────

    def _add_reputation(self, address: str, delta: int) -> None:
        current = int(self.reputation.get(address, "0"))
        new_val = max(0, current + delta)
        self.reputation[address] = str(new_val)
