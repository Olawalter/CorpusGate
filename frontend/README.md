# CorpusGate — Frontend

This is the Next.js frontend for CorpusGate. See the [root README](../README.md) for the full project overview.

## Getting Started

### Install dependencies

```bash
npm install
```

### Set environment variables

Create a `.env.local` file in this directory:

```env
NEXT_PUBLIC_GENLAYER_CHAIN_ID=61999
NEXT_PUBLIC_GENLAYER_RPC=https://studio.genlayer.com/api
NEXT_PUBLIC_GENLAYER_EXPLORER=http://explorer-studio.genlayer.com/
NEXT_PUBLIC_CONTRACT_ADDRESS=0xBA57A120b9aDAE578A0E8393964A86b33128f4ad
```

### Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

Deployed on Vercel with **Root Directory** set to `frontend/`. All four `NEXT_PUBLIC_*` variables must be set in Vercel's environment variable settings before deploying.
