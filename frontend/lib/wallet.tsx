"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { createClient } from "genlayer-js";
import { TransactionStatus } from "genlayer-js/types";

const CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_GENLAYER_CHAIN_ID ?? "61999", 10);
const RPC_URL  = process.env.NEXT_PUBLIC_GENLAYER_RPC ?? "https://studio.genlayer.com/api";
const EXPLORER = process.env.NEXT_PUBLIC_GENLAYER_EXPLORER ?? "http://explorer-studio.genlayer.com/";

export const CONTRACT_ADDRESS =
  (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`) ||
  "0x0000000000000000000000000000000000000000";

const studioChain = {
  id: CHAIN_ID,
  name: "GenLayer Studio",
  rpcUrls: { default: { http: [RPC_URL] as readonly string[] } },
  nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
  blockExplorers: { default: { name: "GenLayer Explorer", url: EXPLORER } },
};

interface WalletCtx {
  address: string | null;
  connecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  readContract: (method: string, args?: unknown[]) => Promise<unknown>;
  writeContract: (method: string, args?: unknown[]) => Promise<unknown>;
}

const Ctx = createContext<WalletCtx | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress]     = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  // Restore from session
  useEffect(() => {
    const saved = sessionStorage.getItem("cg_wallet");
    if (saved) setAddress(saved);
    // Listen for account changes
    const eth = (window as any).ethereum;
    if (!eth) return;
    const handler = (accounts: string[]) => {
      if (accounts.length === 0) { setAddress(null); sessionStorage.removeItem("cg_wallet"); }
      else { setAddress(accounts[0]); sessionStorage.setItem("cg_wallet", accounts[0]); }
    };
    eth.on("accountsChanged", handler);
    return () => eth.removeListener("accountsChanged", handler);
  }, []);

  const connect = useCallback(async () => {
    const eth = (window as any).ethereum;
    if (!eth) {
      alert("No wallet detected. Please install MetaMask or a compatible wallet extension.");
      return;
    }
    setConnecting(true);
    try {
      const accounts: string[] = await eth.request({ method: "eth_requestAccounts" });
      if (accounts[0]) {
        setAddress(accounts[0]);
        sessionStorage.setItem("cg_wallet", accounts[0]);
      }
      // Add GenLayer Studio network if not present
      try {
        await eth.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: `0x${CHAIN_ID.toString(16)}`,
            chainName: "GenLayer Studio",
            rpcUrls: [RPC_URL],
            nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
            blockExplorerUrls: [EXPLORER],
          }],
        });
      } catch {
        // Chain may already exist — switch to it
        await eth.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: `0x${CHAIN_ID.toString(16)}` }],
        });
      }
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    sessionStorage.removeItem("cg_wallet");
  }, []);

  function getClient() {
    const eth = (window as any).ethereum;
    return createClient({
      chain: studioChain,
      ...(eth ? { provider: eth } : {}),
    } as any);
  }

  const readContract = useCallback(async (method: string, args: unknown[] = []) => {
    const client = getClient();
    return (client as any).readContract({
      address: CONTRACT_ADDRESS,
      functionName: method,
      args,
    });
  }, []);

  const writeContract = useCallback(async (method: string, args: unknown[] = []) => {
    if (!address) throw new Error("Wallet not connected");
    const client = getClient();
    await client.initializeConsensusSmartContract();
    const hash = await (client as any).writeContract({
      address: CONTRACT_ADDRESS,
      functionName: method,
      args,
      value: BigInt(0),
    });
    return (client as any).waitForTransactionReceipt({
      hash,
      status: TransactionStatus.FINALIZED,
      retries: 100,
      interval: 3000,
    });
  }, [address]);

  return (
    <Ctx.Provider value={{ address, connecting, connect, disconnect, readContract, writeContract }}>
      {children}
    </Ctx.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useWallet must be used inside WalletProvider");
  return ctx;
}
