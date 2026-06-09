/**
 * Read-only GenLayer client — no wallet needed.
 * Used for all contract reads so pages load without a connected wallet.
 */
import { createClient } from "genlayer-js";

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

let _client: ReturnType<typeof createClient> | null = null;

function getReadClient() {
  if (!_client) {
    _client = createClient({ chain: studioChain } as any);
  }
  return _client;
}

export async function readContract(method: string, args: unknown[] = []): Promise<unknown> {
  const client = getReadClient();
  return (client as any).readContract({
    address: CONTRACT_ADDRESS,
    functionName: method,
    args,
  });
}
