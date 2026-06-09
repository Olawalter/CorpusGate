export default function ScoreBar({
  label,
  score,
  color,
}: {
  label: string;
  score: number;
  color: string;
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-[#9BA7B4]">{label}</span>
        <span className="text-xs font-mono text-[#F4EFE7]">{score}/100</span>
      </div>
      <div className="score-bar">
        <div
          className="score-fill"
          style={{ width: `${score}%`, background: color }}
        />
      </div>
    </div>
  );
}
