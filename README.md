<div align="center">

# 🌱 Baby-GPT

**Self-Evolving Autonomous Language Intelligence — TypeScript Edition**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-22-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.x-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](package.json)
[![Status](https://img.shields.io/badge/status-active-brightgreen.svg)]()

> *A minimal, self-contained seed that grows into a language intelligence system — learning vocabulary, building semantic memory, and evolving its own architecture over time.*

---

```
  ██████╗  █████╗ ██████╗ ██╗   ██╗     ██████╗ ██████╗ ████████╗
  ██╔══██╗██╔══██╗██╔══██╗╚██╗ ██╔╝    ██╔════╝ ██╔══██╗╚══██╔══╝
  ██████╔╝███████║██████╔╝ ╚████╔╝     ██║  ███╗██████╔╝   ██║
  ██╔══██╗██╔══██║██╔══██╗  ╚██╔╝      ██║   ██║██╔═══╝    ██║
  ██████╔╝██║  ██║██████╔╝   ██║       ╚██████╔╝██║        ██║
  ╚═════╝ ╚═╝  ╚═╝╚═════╝    ╚═╝        ╚═════╝ ╚═╝        ╚═╝
```

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Architecture](#-architecture)
- [Quick Start](#-quick-start)
- [REST API Reference](#-rest-api-reference)
- [Configuration](#-configuration)
- [Dashboard](#-dashboard)
- [Upgrade Paths](#-upgrade-paths)
- [Documentation](#-documentation)
- [Project Structure](#-project-structure)
- [Contributing](#-contributing)

---

## 🔭 Overview

**Baby-GPT** is a production-grade, self-evolving autonomous language intelligence seed written entirely in TypeScript. It demonstrates how a minimal system can bootstrap itself from scratch — growing its vocabulary, building semantic vector memory, synthesising new code modules, and triggering architectural evolution events entirely on its own.

The system operates as a **continuous autonomous loop** that:

1. **Explores** the web (vocabulary APIs, Wikipedia) to learn new words and concepts
2. **Reinforces** learning through a Hangman game with a reward/punishment engine
3. **Stores** knowledge in a dual-store: a vocab `Map` and a cosine-similarity `VectorStore`
4. **Synthesises** new TypeScript modules as its memory grows past thresholds
5. **Evolves** its own capabilities by unlocking new skills at score milestones
6. **Serves** a live REST API and HTML dashboard so you can observe and interact in real time

> Baby-GPT is not a fine-tuned LLM — it is an **architecture seed** showing how a self-improving AI agent can be built from first principles, with clear upgrade paths to production-grade components (OpenAI embeddings, pgvector, isolated-vm).

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🧠 **MemoryStore** | Vocab `Map`, grammar rules, action history, module counter, persistent JSON state |
| 🔢 **Embedding Engine** | Deterministic character-hash embeddings — pluggable to OpenAI / Transformers |
| 🗄️ **VectorStore** | Cosine-similarity semantic search — pgvector/Supabase-ready interface |
| 🏆 **Reward / Punishment** | Score-gated skill unlocks and growth event triggers |
| 🎯 **Hangman Game** | MIT 10k-word list + fully automated reinforcement-learning play loop |
| 🌐 **URL Explorer** | Safe domain-gated web scraper (dictionary API, Datamuse, Wikipedia) |
| 🔄 **Self-Learning Loop** | Autonomous tick engine — explore / hangman / learn / codegen tasks |
| 📦 **Module Expansion** | Auto-mints `.ts` modules to disk as vocabulary crosses thresholds |
| ⚗️ **Code Synthesis** | Generates new TypeScript modules as growth artefacts |
| 📡 **Evolution Event Bus** | Pub/sub hooks for skill unlocks and self-transformer events |
| 🌍 **Express Web App** | REST API + Server-Sent Events live feed + interactive HTML dashboard |
| 💾 **Persistence** | JSON file-backed memory and vector store with auto-save |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        BabyGPT System                           │
│                                                                 │
│  ┌──────────┐    ┌──────────────┐    ┌──────────────────────┐  │
│  │  Planner  │───▶│  BabyGPT     │───▶│   EvolutionBus       │  │
│  │ (Task     │    │  Core Loop   │    │  (Pub/Sub Hooks)     │  │
│  │  Selector)│    │  tick()      │    └──────────────────────┘  │
│  └──────────┘    └──────┬───────┘                               │
│                         │                                       │
│           ┌─────────────┼──────────────┐                        │
│           ▼             ▼              ▼                        │
│  ┌──────────────┐ ┌──────────┐ ┌────────────┐                  │
│  │ URLExplorer  │ │ Hangman  │ │ SearchEng. │                  │
│  │ (web scrape) │ │ (game +  │ │ (memory →  │                  │
│  │              │ │ rewards) │ │ vector →   │                  │
│  └──────┬───────┘ └────┬─────┘ │ internet)  │                  │
│         │              │       └─────┬──────┘                  │
│         └──────────────┴─────────────┘                          │
│                         │                                       │
│         ┌───────────────▼───────────────┐                       │
│         │         MemoryStore           │                       │
│         │  vocab Map + grammar rules    │                       │
│         │  action history + score       │                       │
│         │  JSON persistence             │                       │
│         └───────────────┬───────────────┘                       │
│                         │                                       │
│         ┌───────────────▼───────────────┐                       │
│         │         VectorStore           │                       │
│         │  cosine-similarity search     │                       │
│         │  Embedding engine (pluggable) │                       │
│         └───────────────────────────────┘                       │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │               Express Web Layer                          │   │
│  │  GET /status  GET /search  POST /learn  GET /stream      │   │
│  │  POST /hangman  POST /sandbox  GET /vocab  GET /          │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Core Components

```
baby_gpt_seed.ts
│
├── CONFIG                    # Central configuration object
├── Embedding                 # Character-hash embedding engine (pluggable)
├── VectorStore               # In-memory cosine-similarity store
├── MemoryStore               # Vocab, grammar, history, persistence
├── EvolutionBus              # Event pub/sub for self-transformation hooks
├── CodeSynthesis             # Auto-generates .ts modules on growth events
├── URLExplorer               # Safe web scraper (allow-list gated)
├── SearchEngine              # 3-tier search: memory → vector → internet
├── Hangman                   # Automated word game with reward loop
├── Sandbox                   # Restricted code execution (new Function guard)
├── Planner                   # Task selector (explore/hangman/learn/codegen)
├── BabyGPT                   # Core autonomous loop controller
└── Express app               # REST API + SSE + HTML dashboard
```

---

## 🚀 Quick Start

### Prerequisites

| Requirement | Version |
|---|---|
| Node.js | ≥ 18 (LTS recommended) |
| npm | ≥ 9 |
| TypeScript | ≥ 5.8 (included as devDep) |

### Installation

```bash
# Clone the repository
git clone https://github.com/aipulsed/Baby-GPT.git
cd Baby-GPT

# Install dependencies
npm install
```

### Run in Development Mode

```bash
npm run dev
```

> Opens at **http://localhost:3000** — the system starts learning immediately.

### Build and Run Production

```bash
# Compile TypeScript → dist/
npm run build

# Run compiled output
npm start
```

### Custom Port

```bash
PORT=8080 npm run dev
```

---

## 🌐 REST API Reference

All endpoints are served from `http://localhost:3000` (configurable via `PORT` env var).

### `GET /`

Interactive HTML dashboard with live stats, search, and SSE log feed.

---

### `GET /status`

Returns a live statistics snapshot of the system.

**Response**

```json
{
  "vocabSize": 1247,
  "grammarRules": 14,
  "historyLength": 300,
  "moduleCount": 3,
  "knowledgeSize": 89,
  "vectorCount": 2104,
  "score": 142.0,
  "discoveries": 142,
  "filesCreated": 3,
  "skills": {
    "hangman": true,
    "search": true
  }
}
```

---

### `GET /search?q=<query>`

Hybrid knowledge search: exact → vector → internet.

**Parameters**

| Name | Type | Required | Description |
|---|---|---|---|
| `q` | string | ✅ | Search query |

**Example**

```bash
curl "http://localhost:3000/search?q=intelligence"
```

**Response**

```json
{
  "query": "intelligence",
  "result": ["intelligence system network", "artificial intelligence learning"]
}
```

---

### `POST /learn`

Manually inject a word into the vocabulary.

**Body**

```json
{ "word": "transformer" }
```

**Response**

```json
{ "ok": true, "vocabSize": 1248 }
```

---

### `POST /hangman`

Trigger one fully automated Hangman game round.

**Response**

```json
{ "result": "WIN", "score": 147.0 }
```

---

### `POST /sandbox`

Execute code in the restricted sandbox.

> ⚠️ **Warning:** For development/research use only. The sandbox runs `new Function()` within the host process. See [Upgrade Paths](#-upgrade-paths) for production isolation.

**Body**

```json
{ "code": "console.log('hello from sandbox')" }
```

**Response**

```json
{ "success": true }
```

---

### `GET /vocab?limit=50`

Peek at the most recently learned vocabulary words.

**Parameters**

| Name | Type | Default | Max |
|---|---|---|---|
| `limit` | integer | 50 | 500 |

**Response**

```json
{
  "count": 1247,
  "sample": ["apple", "banana", "intelligence", "network", "learning"]
}
```

---

### `GET /logs`

Returns the most recent log lines (rolling window of 300).

**Response**

```json
[
  "[2026-01-01T00:00:00.000Z] [Boot] BabyGPT Growth-Tree Seed starting…",
  "[2026-01-01T00:00:02.000Z] [Hangman] WIN ✔  score=5"
]
```

---

### `GET /stream`

**Server-Sent Events** live feed. Connect with `EventSource` in the browser or `curl`.

```bash
curl -N http://localhost:3000/stream
```

```
data: "[Explore] apple vocab=42"
data: "[Status] score=5 vocab=42 vec=89 modules=0 task=explore"
```

---

## ⚙️ Configuration

All tunable parameters live in the `CONFIG` object at the top of `baby_gpt_seed.ts`:

| Key | Default | Description |
|---|---|---|
| `safeURLs` | 3 API endpoints | Allowed URL bases for web exploration |
| `safeDomains` | 4 domains | Domain allow-list for `safeGet()` |
| `minWordLength` | `2` | Minimum characters for a word to be indexed |
| `maxVectorSize` | `128` | Embedding vector dimensions |
| `selfLearningIntervalMs` | `2000` | Milliseconds between autonomous ticks |
| `rewardFactor` | `1.0` | Multiplier applied to all reward/punishment scores |
| `hangmanWordsURL` | MIT 10k list | URL to fetch the Hangman word list |
| `moduleMemoryThreshold` | `100` | Vocab size multiple that triggers a new module |
| `maxModules` | `1000` | Maximum number of auto-generated modules |
| `similarityThreshold` | `0.60` | Minimum cosine similarity for vector search hits |
| `skillUnlockScore` | `25` | Score required to unlock the `search` skill |
| `evolutionTriggerScore` | `75` | Score required to trigger self-transformer evolution |
| `shardThreshold` | `500` | Knowledge entries before memory sharding |
| `port` | `3000` | HTTP server port (overridable via `PORT` env var) |
| `logFile` | `activity.log` | Path for log file output |
| `memoryFile` | `memory.json` | Path for persisted memory state |
| `vectorFile` | `vectors.json` | Path for persisted vector store |

---

## 🖥️ Dashboard

The HTML dashboard is served at `GET /` and provides:

- **Live metric cards** — score, vocab size, vector count, modules, discoveries, files created
- **Skill badges** — dynamically rendered as skills are unlocked
- **Search box** — query the hybrid knowledge base in real time
- **Hangman trigger** — fire a game round from the UI
- **Live SSE log feed** — streaming activity log with auto-scroll
- **Auto-refresh** — stats update every 5 seconds and on every SSE event

---

## 🔧 Upgrade Paths

Baby-GPT is deliberately engineered with clean swap points. Each component has a designated upgrade:

| Component | Current (Seed) | Production Upgrade |
|---|---|---|
| **Embedding Engine** | Character-hash (`Embedding.embed()`) | `@xenova/transformers`, OpenAI `text-embedding-ada-002` |
| **Vector Store** | In-memory `VectorStore` | pgvector + Supabase, Weaviate, Pinecone |
| **Planner** | Random task selector | Goal-tree / MCTS / LLM-driven planning |
| **Sandbox** | `new Function()` with keyword guard | `isolated-vm`, `vm2`, Deno subprocess |
| **Web Scraper** | Direct HTTP fetch | Headless browser (Playwright), Firecrawl |
| **Persistence** | JSON flat files | PostgreSQL, Redis, Supabase |
| **Auth** | None | JWT / OAuth2 middleware |

See [`docs/engineering/upgrade-paths.md`](docs/engineering/upgrade-paths.md) for detailed migration guides.

---

## 📚 Documentation

Full enterprise documentation is available in the [`docs/`](docs/) directory:

| Document | Description |
|---|---|
| [`docs/index.md`](docs/index.md) | Documentation home and navigation index |
| [`docs/architecture/overview.md`](docs/architecture/overview.md) | High-level system architecture |
| [`docs/architecture/system-design.md`](docs/architecture/system-design.md) | Detailed system design and data flows |
| [`docs/architecture/components.md`](docs/architecture/components.md) | Component-by-component reference |
| [`docs/api/rest-api.md`](docs/api/rest-api.md) | Complete REST API specification |
| [`docs/engineering/development-guide.md`](docs/engineering/development-guide.md) | Developer setup and workflow |
| [`docs/engineering/build-and-deploy.md`](docs/engineering/build-and-deploy.md) | Build, deploy, and operations guide |
| [`docs/engineering/upgrade-paths.md`](docs/engineering/upgrade-paths.md) | Component upgrade and extension guide |
| [`docs/concepts/self-evolution.md`](docs/concepts/self-evolution.md) | AI self-evolution concepts and design |

---

## 📁 Project Structure

```
Baby-GPT/
│
├── baby_gpt_seed.ts          # 🧬 Core application — all logic lives here
├── package.json              # npm project manifest
├── tsconfig.json             # TypeScript compiler configuration
│
├── docs/                     # 📚 Enterprise documentation
│   ├── index.md              #   Documentation home
│   ├── architecture/
│   │   ├── overview.md       #   High-level architecture
│   │   ├── system-design.md  #   Detailed system design
│   │   └── components.md     #   Component reference
│   ├── api/
│   │   └── rest-api.md       #   REST API specification
│   ├── engineering/
│   │   ├── development-guide.md
│   │   ├── build-and-deploy.md
│   │   └── upgrade-paths.md
│   └── concepts/
│       └── self-evolution.md #   AI concepts and design philosophy
│
├── ENGINEERING.md            # 📐 Engineering history and design notes
├── History-Origin-Ai.md      # 🕰️ AI history reference and origin story
├── CHANGELOG.md              # 📝 Version history
│
├── dist/                     # 🏗️ TypeScript compiled output (git-ignored)
├── activity.log              # 📋 Runtime activity log (git-ignored)
├── memory.json               # 💾 Persisted memory state (git-ignored)
└── vectors.json              # 🔢 Persisted vector store (git-ignored)
```

---

## �� Contributing

Contributions are welcome. Please read the [Development Guide](docs/engineering/development-guide.md) before opening a pull request.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m "feat: add my feature"`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License**.

---

<div align="center">

**Built with ❤️ by Ascended AI Engineering — 2026**

*Autonomy. Curiosity. Growth.*

</div>
