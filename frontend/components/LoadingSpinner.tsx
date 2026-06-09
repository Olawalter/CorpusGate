export default function LoadingSpinner({ text = "Processing..." }: { text?: string }) {
  return (
    <div className="flex flex-col items-center gap-4 py-12">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-2 border-[#2E3338]" />
        <div className="absolute inset-0 rounded-full border-2 border-t-[#D6A84F] border-r-transparent border-b-transparent border-l-transparent animate-spin" />
      </div>
      <p className="text-sm text-[#9BA7B4] font-mono">{text}</p>
    </div>
  );
}
