/**
 * Central config — validates all addresses at module load time so
 * every consumer gets a guaranteed-valid value or a clear error.
 */
import { isAddress, getAddress } from "viem";
import { studionet } from "genlayer-js/chains";

function resolveAddress(envKey: string, raw: string | undefined): `0x${string}` {
  if (!raw || !isAddress(raw)) {
    console.error(
      `[CorpusGate] env var ${envKey} is missing or invalid (got: ${JSON.stringify(raw)}). ` +
      `Set it in Vercel → Settings → Environment Variables.`
    );
    // Return a sentinel that isAddress() will reject — callers must guard before using
    return "" as `0x${string}`;
  }
  return getAddress(raw); // normalise to EIP-55 checksum form
}

export const CONTRACT_ADDRESS = resolveAddress(
  "NEXT_PUBLIC_CONTRACT_ADDRESS",
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS
);

export const CHAIN_ID  = parseInt(process.env.NEXT_PUBLIC_GENLAYER_CHAIN_ID ?? "61999", 10);
export const RPC_URL   = process.env.NEXT_PUBLIC_GENLAYER_RPC   ?? "https://studio.genlayer.com/api";
export const EXPLORER  = process.env.NEXT_PUBLIC_GENLAYER_EXPLORER ?? "http://explorer-studio.genlayer.com/";

// Use the official studionet chain from genlayer-js — it includes
// consensusMainContract and other fields that genlayer-js requires internally.
export { studionet as studioChain };

/** Returns true if the contract address was resolved from env correctly. */
export function isContractConfigured(): boolean {
  return isAddress(CONTRACT_ADDRESS);
}
