"use client";
import { useWallet } from "@/lib/wallet";

export default function WalletRequired({ children }: { children: React.ReactNode }) {
  const { address, connecting, connect } = useWallet();

  if (!address) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-6">
        <div className="w-14 h-14 rounded-full border border-[#D6A84F]/30 flex items-center justify-center text-2xl text-[#D6A84F]">
          ◈
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-[#F4EFE7] mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Wallet required
          </h2>
          <p className="text-sm text-[#9BA7B4] max-w-xs">
            Connect your wallet to interact with the GenLayer Studio contract.
          </p>
        </div>
        <button onClick={connect} disabled={connecting} className="btn-primary px-6 py-3">
          {connecting ? "Connecting…" : "Connect Wallet"}
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
