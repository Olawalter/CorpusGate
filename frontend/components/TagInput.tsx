"use client";
import { useState, KeyboardEvent } from "react";

export default function TagInput({
  label,
  tags,
  onChange,
  placeholder,
  color = "#D6A84F",
}: {
  label: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  color?: string;
}) {
  const [value, setValue] = useState("");

  const addTag = () => {
    const t = value.trim();
    if (t && !tags.includes(t)) {
      onChange([...tags, t]);
      setValue("");
    }
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    } else if (e.key === "Backspace" && !value) {
      onChange(tags.slice(0, -1));
    }
  };

  return (
    <div>
      <label className="block text-sm text-[#9BA7B4] mb-1.5">{label}</label>
      <div className="min-h-[44px] flex flex-wrap gap-1.5 p-2 bg-[#12151A] border border-[#2E3338] rounded-lg focus-within:border-[#D6A84F] transition-colors">
        {tags.map((t) => (
          <span
            key={t}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono"
            style={{ background: `${color}18`, color, border: `1px solid ${color}44` }}
          >
            {t}
            <button
              type="button"
              onClick={() => onChange(tags.filter((x) => x !== t))}
              className="opacity-60 hover:opacity-100 ml-0.5"
            >
              ×
            </button>
          </span>
        ))}
        <input
          className="flex-1 min-w-[120px] bg-transparent outline-none text-[#F4EFE7] text-sm placeholder:text-[#4a5568]"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKey}
          onBlur={addTag}
          placeholder={tags.length === 0 ? (placeholder ?? "Type and press Enter") : ""}
        />
      </div>
    </div>
  );
}
