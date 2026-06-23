# CorpusGate

**CorpusGate** is a decentralized research paper curation platform built on [GenLayer](https://genlayer.com) — a blockchain that runs intelligent smart contracts powered by LLMs. Instead of relying on centralized gatekeepers or manual editorial boards, CorpusGate lets anyone create a curated corpus, submit research papers to it, and have those papers reviewed automatically by an on-chain AI validator network that reaches consensus before any decision is finalized.

Live app: **[https://corpus-gate.vercel.app](https://corpus-gate.vercel.app)**

---

## What It Does

Anyone with a MetaMask wallet connected to GenLayer Studio can:

- **Create a corpus** — define the topic, description, inclusion/exclusion rules, and minimum quality thresholds
- **Submit a paper** — provide a title, abstract, authors, keywords, methodology, and conclusion excerpt
- **Trigger a review** — the intelligent contract sends the paper to GenLayer's validator network, where multiple LLM nodes independently evaluate it and must reach consensus before a result is committed on-chain
- **Dispute a rejection** — submitters can file a dispute with additional context; the contract re-evaluates under the same consensus mechanism
- **Track reputation** — every action (creating a corpus, getting accepted, getting rejected) affects the submitter's on-chain reputation score

Every review decision is one of five outcomes: `ACCEPT`, `REJECT`, `NEEDS_HUMAN_REVIEW`, `ACCEPT_WITH_LOW_CONFIDENCE`, or `DUPLICATE_OR_ALREADY_INDEXED`. Each decision comes with a relevance score, quality score, confidence level, primary reason, identified weaknesses, and recommended tags — all produced and agreed upon by the validator network.

---

## How It Works

### The Intelligent Contract

The core logic lives in `contract/corpus_gate.py` — a GenLayer intelligent contract written in Python. It stores all corpora, papers, reviews, disputes, and reputation scores on-chain using `TreeMap` storage.

The key part is how the LLM review is implemented. GenLayer requires that any non-deterministic operation (like calling an LLM) be wrapped in a specific pattern so validators can independently run it and compare their results before anything is written to state:

```python
def _run_review() -> str:
    return gl.nondet.exec_prompt(prompt)

raw = gl.eq_principle.prompt_comparative(
    _run_review,
    principle=(
        "The JSON responses are equivalent if they agree on: "
        "decision field exactly, relevance_score within 10 points, "
        "quality_score within 10 points, and confidence level exactly."
    ),
)
```

`gl.nondet.exec_prompt` runs the LLM call inside a leader function that each validator node executes independently. `gl.eq_principle.prompt_comparative` defines the equivalence rule — what "agreement" means across validators. For paper review, validators must agree exactly on the `decision` and `confidence` fields, and their scores must be within 10 points of each other. Only when consensus is reached does the result get committed to state.

This means no single node can manipulate a review outcome. Multiple independent LLM validators must agree, and the equivalence principle defines the tolerance for natural variance between LLM responses.

The contract exposes the following public methods:

| Method | Type | Description |
|---|---|---|
| `create_corpus` | write | Create a new research corpus with rules and thresholds |
| `update_corpus_rules` | write | Update an existing corpus (owner only) |
| `pause_corpus` | write | Pause a corpus from accepting new papers |
| `submit_paper` | write | Submit a paper for review into a corpus |
| `review_paper` | write | Trigger AI validator consensus review |
| `dispute_decision` | write | File a dispute on a rejected paper |
| `resolve_dispute` | write | Re-run consensus review on a disputed paper |
| `archive_paper` | write | Archive a paper (corpus owner only) |
| `get_corpus` | view | Fetch corpus data by ID |
| `get_paper` | view | Fetch paper data by ID |
| `get_review_result` | view | Fetch the review result for a paper |
| `get_corpus_papers` | view | List all accepted paper IDs in a corpus |
| `get_submitter_reputation` | view | Get reputation score for an address |
| `get_dispute` | view | Fetch dispute data for a paper |
| `get_all_corpora_ids` | view | List all corpus IDs |

### The Frontend

The frontend is a Next.js 15 app (App Router) with Tailwind CSS v4. It connects to GenLayer Studio via `genlayer-js` (v1.1.7) and uses MetaMask as the transaction signer.

One non-obvious implementation detail: `genlayer-js` has internal routing logic (`getCustomTransportConfig`) that checks whether the `account` passed to `createClient` is an object or a raw string. If it's an object, the SDK routes `eth_sendTransaction` directly to the RPC — which doesn't support it for intelligent contracts. The correct pattern is to omit `account` from `createClient` entirely and pass it only to `writeContract` as `{ address, type: "json-rpc" }`. This keeps MetaMask in the signing path while still allowing the SDK to resolve `senderAccount.address` internally.

```typescript
const client = createClient({
  chain: studionet,   // official chain from genlayer-js/chains
  provider: eth,      // window.ethereum (MetaMask)
  // account omitted intentionally
});

await client.writeContract({
  address: CONTRACT_ADDRESS,
  functionName: "create_corpus",
  args: [...],
  account: { address: checksummedAddress, type: "json-rpc" },
});
```

All address validation uses `viem`'s `isAddress` and `getAddress` before any SDK call to ensure checksummed, valid addresses throughout.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Intelligent contract | Python (GenLayer) |
| Blockchain | GenLayer Studio (chain ID 61999) |
| Frontend framework | Next.js 15 (App Router) |
| Styling | Tailwind CSS v4 |
| Wallet integration | MetaMask via EIP-1193 |
| GenLayer SDK | genlayer-js v1.1.7 |
| Address validation | viem |
| Deployment | Vercel |

---

## Project Structure

```
CorpusGate/
├── contract/
│   └── corpus_gate.py          # GenLayer intelligent contract
└── frontend/
    ├── app/
    │   ├── page.tsx             # Landing page
    │   └── (app)/
    │       ├── layout.tsx       # App shell with navbar + contract banner
    │       ├── dashboard/       # Overview stats and activity
    │       ├── corpus/
    │       │   ├── create/      # Create a new corpus
    │       │   └── [id]/        # Corpus detail + paper list
    │       ├── paper/
    │       │   ├── submit/      # Submit a paper to a corpus
    │       │   └── [id]/        # Paper detail + review result
    │       ├── library/         # All accepted papers across corpora
    │       └── disputes/        # Active and resolved disputes
    ├── components/
    │   ├── Navbar.tsx           # Top navigation with wallet connect
    │   └── WalletRequired.tsx   # Guard component for wallet-gated actions
    └── lib/
        ├── config.ts            # Chain config, contract address validation
        ├── wallet.tsx           # WalletProvider context, writeContract
        └── reader.ts            # Read-only contract client (no wallet needed)
```

---

## Getting Started Locally

### Prerequisites

- Node.js 18+
- MetaMask browser extension
- A GenLayer Studio account with testnet GEN tokens

### 1. Clone the repo

```bash
git clone https://github.com/Olawalter/CorpusGate.git
cd CorpusGate/frontend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set environment variables

Create a `.env.local` file inside the `frontend/` directory:

```env
NEXT_PUBLIC_GENLAYER_CHAIN_ID=61999
NEXT_PUBLIC_GENLAYER_RPC=https://studio.genlayer.com/api
NEXT_PUBLIC_GENLAYER_EXPLORER=http://explorer-studio.genlayer.com/
NEXT_PUBLIC_CONTRACT_ADDRESS=0xBA57A120b9aDAE578A0E8393964A86b33128f4ad
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Connect MetaMask

Click **Connect Wallet** in the navbar. The app will prompt MetaMask to add and switch to the GenLayer Studio network automatically. You'll need testnet GEN tokens to submit transactions.

---

## Deploying the Contract

The contract source is in `contract/corpus_gate.py`.

1. Go to [GenLayer Studio](https://studio.genlayer.com)
2. Upload or paste the contract file and deploy it
3. Copy the deployed contract address
4. Update `NEXT_PUBLIC_CONTRACT_ADDRESS` in your Vercel environment settings and trigger a redeploy

---

## Deploying the Frontend

The frontend is deployed on Vercel. When setting up the Vercel project, set the **Root Directory** to `frontend/`.

Required environment variables:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_GENLAYER_CHAIN_ID` | `61999` |
| `NEXT_PUBLIC_GENLAYER_RPC` | `https://studio.genlayer.com/api` |
| `NEXT_PUBLIC_GENLAYER_EXPLORER` | `http://explorer-studio.genlayer.com/` |
| `NEXT_PUBLIC_CONTRACT_ADDRESS` | your deployed contract address |

---

## Contract Address

Current deployment on GenLayer Studio:

```
0xBA57A120b9aDAE578A0E8393964A86b33128f4ad
```

---

## License

MIT
