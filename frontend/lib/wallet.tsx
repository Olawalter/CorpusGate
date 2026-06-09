"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { createClient } from "genlayer-js";
import { TransactionStatus } from "genlayer-js/types";
import { isAddress, getAddress } from "viem";
import { CONTRACT_ADDRESS, studioChain, isContractConfigured, CHAIN_ID, RPC_URL, EXPLORER } from "./config";

interface WalletCtx {
  address: string | null;
  connecting: boolean;
  contractOk: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  writeContract: (method: string, args?: unknown[]) => Promise<unknown>;
}

const Ctx = createContext<WalletCtx | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress]       = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const contractOk = isContractConfigured();

  // Restore persisted wallet address — validate format before trusting
  useEffect(() => {
    const saved = sessionStorage.getItem("cg_wallet");
    if (saved && isAddress(saved)) {
      setAddress(getAddress(saved)); // store in checksum form
    } else {
      sessionStorage.removeItem("cg_wallet");
    }

    const eth = (window as any).ethereum;
    if (!eth) return;

    // Sync live MetaMask account
    eth.request({ method: "eth_accounts" })
      .then((accounts: string[]) => {
        if (accounts[0] && isAddress(accounts[0])) {
          const checksummed = getAddress(accounts[0]);
          setAddress(checksummed);
          sessionStorage.setItem("cg_wallet", checksummed);
        }
      })
      .catch(() => {/* ignore */});

    const handler = (accounts: string[]) => {
      if (accounts.length === 0) {
        setAddress(null);
        sessionStorage.removeItem("cg_wallet");
      } else if (isAddress(accounts[0])) {
        const checksummed = getAddress(accounts[0]);
        setAddress(checksummed);
        sessionStorage.setItem("cg_wallet", checksummed);
      }
    };
    eth.on("accountsChanged", handler);
    return () => eth.removeListener("accountsChanged", handler);
  }, []);

  const connect = useCallback(async () => {
    const eth = (window as any).ethereum;
    if (!eth) {
      alert("No wallet detected. Please install MetaMask.");
      return;
    }
    setConnecting(true);
    try {
      const accounts: string[] = await eth.request({ method: "eth_requestAccounts" });
      if (accounts[0] && isAddress(accounts[0])) {
        const checksummed = getAddress(accounts[0]);
        setAddress(checksummed);
        sessionStorage.setItem("cg_wallet", checksummed);
      }
      // Add / switch to GenLayer Studio
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

  const writeContract = useCallback(async (method: string, args: unknown[] = []) => {
    // Guard: wallet
    if (!address || !isAddress(address)) {
      throw new Error("Wallet not connected. Please connect MetaMask first.");
    }
    // Guard: contract
    if (!contractOk || !isAddress(CONTRACT_ADDRESS)) {
      throw new Error(
        "Contract address is not configured. Set NEXT_PUBLIC_CONTRACT_ADDRESS in Vercel environment variables."
      );
    }

    const checksumAccount  = getAddress(address);
    const checksumContract = getAddress(CONTRACT_ADDRESS);

    const eth = (window as any).ethereum;
    const client = createClient({ chain: studioChain, provider: eth } as any);

    const hash = await (client as any).writeContract({
      address: checksumContract,
      functionName: method,
      args,
      account: checksumAccount,
    });

    return (client as any).waitForTransactionReceipt({
      hash,
      status: TransactionStatus.FINALIZED,
      retries: 100,
      interval: 3000,
    });
  }, [address, contractOk]);

  return (
    <Ctx.Provider value={{ address, connecting, contractOk, connect, disconnect, writeContract }}>
      {children}
    </Ctx.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useWallet must be used inside WalletProvider");
  return ctx;
}
