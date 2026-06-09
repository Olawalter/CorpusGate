"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWallet } from "@/lib/wallet";

const NAV = [
  { href: "/dashboard",     label: "Dashboard"    },
  { href: "/corpus/create", label: "New Corpus"   },
  { href: "/paper/submit",  label: "Submit Paper" },
  { href: "/library",       label: "Library"      },
  { href: "/disputes",      label: "Disputes"     },
];

export default function Navbar() {
  const pathname = usePathname();
  const { address, connecting, connect, disconnect } = useWallet();

  const short = address ? `${address.slice(0, 6)}…${address.slice(-4)}` : null;

  return (
    <nav className="sticky top-0 z-50 border-b border-[#1E2D42] bg-[#07111F]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <span className="w-6 h-6 rounded bg-[#3B82F6] flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="1" width="5" height="5" rx="1" fill="#07111F" />
              <rect x="8" y="1" width="5" height="5" rx="1" fill="#07111F" opacity="0.6" />
              <rect x="1" y="8" width="5" height="5" rx="1" fill="#07111F" opacity="0.6" />
              <rect x="8" y="8" width="5" height="5" rx="1" fill="#07111F" />
            </svg>
          </span>
          <span className="font-semibold text-[#F5F7FA] tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            CorpusGate
          </span>
        </Link>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-1 flex-1">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                pathname.startsWith(n.href)
                  ? "bg-[#3B82F6]/10 text-[#3B82F6]"
                  : "text-[#94A3B8] hover:text-[#F5F7FA]"
              }`}
              style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 500 }}
            >
              {n.label}
            </Link>
          ))}
        </div>

        {/* Wallet */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#4CAF7D]" />
            <span className="text-xs text-[#94A3B8] font-mono hidden sm:inline">Studio</span>
          </div>

          {address ? (
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-xs font-mono px-2.5 py-1.5 rounded-lg bg-[#1E2D42] text-[#94A3B8]">
                {short}
              </span>
              <button
                onClick={disconnect}
                className="text-xs text-[#94A3B8] hover:text-[#D65A5A] transition-colors"
                title="Disconnect wallet"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={connect}
              disabled={connecting}
              className="btn-primary text-sm"
              style={{ padding: "6px 14px" }}
            >
              {connecting ? "Connecting…" : "Connect Wallet"}
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
