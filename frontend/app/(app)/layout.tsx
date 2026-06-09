import Navbar from "@/components/Navbar";
import { WalletProvider } from "@/lib/wallet";
import { isContractConfigured } from "@/lib/config";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const contractOk = isContractConfigured();
  return (
    <WalletProvider>
      <div className="min-h-screen flex flex-col bg-[#0B0D10]">
        <Navbar />
        {!contractOk && (
          <div className="bg-[#D65A5A]/10 border-b border-[#D65A5A]/30 px-6 py-3 text-center">
            <p className="text-sm text-[#D65A5A] font-mono">
              ⚠ <strong>NEXT_PUBLIC_CONTRACT_ADDRESS</strong> is not set.
              Go to Vercel → Settings → Environment Variables and add it, then redeploy.
            </p>
          </div>
        )}
        <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">{children}</main>
        <footer className="border-t border-[#2E3338] py-4">
          <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
            <span className="text-xs text-[#4a5568] font-mono">CorpusGate · Powered by GenLayer</span>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#4CAF7D]" />
              <span className="text-xs text-[#4a5568] font-mono">Studio network</span>
            </div>
          </div>
        </footer>
      </div>
    </WalletProvider>
  );
}
