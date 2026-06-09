import type { Decision } from "@/lib/types";

const MAP: Record<string, { cls: string; label: string }> = {
  ACCEPT: { cls: "badge badge-accept", label: "ACCEPT" },
  REJECT: { cls: "badge badge-reject", label: "REJECT" },
  NEEDS_HUMAN_REVIEW: { cls: "badge badge-review", label: "NEEDS REVIEW" },
  ACCEPT_WITH_LOW_CONFIDENCE: { cls: "badge badge-low", label: "LOW CONFIDENCE" },
  DUPLICATE_OR_ALREADY_INDEXED: { cls: "badge badge-duplicate", label: "DUPLICATE" },
  SUBMITTED: { cls: "badge badge-submitted", label: "SUBMITTED" },
  DISPUTED: { cls: "badge badge-review", label: "DISPUTED" },
  ARCHIVED: { cls: "badge badge-submitted", label: "ARCHIVED" },
};

export default function DecisionBadge({ decision }: { decision: string }) {
  const cfg = MAP[decision] ?? { cls: "badge badge-submitted", label: decision };
  return <span className={cfg.cls}>{cfg.label}</span>;
}
