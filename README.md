# CorpusGate

Research paper relevance and quality gate powered by GenLayer.

## Structure

```
CorpusGate/
├── contract/
│   └── corpus_gate.py      # GenLayer intelligent contract — deploy via Studio
├── frontend/               # Next.js 16 app (genlayer-js 1.1.7)
│   ├── app/
│   │   ├── page.tsx                  # Landing page
│   │   └── (app)/
│   │       ├── dashboard/            # Overview + stats
│   │       ├── corpus/create/        # Create a corpus
│   │       ├── corpus/[id]/          # Corpus detail + accepted papers
│   │       ├── paper/submit/         # Submit + auto-review a paper
│   │       ├── paper/[id]/           # Review receipt
│   │       ├── library/              # Search accepted papers
│   │       └── disputes/             # File and resolve disputes
│   ├── lib/
│   │   ├── genlayer.ts     # GenLayer JS client (studionet)
│   │   ├── contract.ts     # Contract call wrappers
│   │   └── types.ts        # TypeScript types
│   └── components/         # Shared UI components
```

## Setup

### 1. Deploy the Contract

Upload `contract/corpus_gate.py` to [GenLayer Studio](https://studio.genlayer.com) and copy the deployed contract address.

### 2. Configure Environment

```bash
cd frontend
cp .env.local.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_GENLAYER_CHAIN_ID=61999
NEXT_PUBLIC_GENLAYER_RPC=https://studio.genlayer.com/api
NEXT_PUBLIC_GENLAYER_EXPLORER=http://explorer-studio.genlayer.com/
NEXT_PUBLIC_CONTRACT_ADDRESS=0x<your_deployed_address>
```

### 3. Run

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000

## Network

- **Chain**: GenLayer Studio (id: 61999)
- **RPC**: https://studio.genlayer.com/api
- **SDK**: genlayer-js 1.1.7
