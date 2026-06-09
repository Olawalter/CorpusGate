/**
 * Read-only GenLayer client — no wallet needed.
 * Used for all contract reads so pages load without a connected wallet.
 */
import { createClient } from "genlayer-js";
import { isAddress } from "viem";
import { CONTRACT_ADDRESS, studioChain } from "./config";

// Re-create client if chain changes (hot reload safety)


let _client: ReturnType<typeof createClient> | null = null;

function getReadClient() {
  if (!_client) {
    _client = createClient({ chain: studioChain } as any);
  }
  return _client;
}

export async function readContract(method: string, args: unknown[] = []): Promise<unknown> {
  if (!isAddress(CONTRACT_ADDRESS)) {
    throw new Error(
      "Contract address is not configured. Set NEXT_PUBLIC_CONTRACT_ADDRESS in your environment variables."
    );
  }
  const client = getReadClient();
  return (client as any).readContract({
    address: CONTRACT_ADDRESS,
    functionName: method,
    args,
  });
}
