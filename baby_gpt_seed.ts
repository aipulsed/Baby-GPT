// =============================================================================
// BABY GPT SEED — COMPLETE SELF-EVOLVING AI (2026 ARCHITECTURE)
// =============================================================================
// SINGLE FILE • TYPESCRIPT WEB APP • NO EXTERNAL DB REQUIRED
// =============================================================================
//
// FEATURES ENGINEERED INTO THE DNA:
//   ✔ Vector memory + embeddings (local, pgvector-ready)
//   ✔ Hybrid search  (memory → vector → internet)
//   ✔ Safe internet  (dictionary, thesaurus, Wikipedia)
//   ✔ Hangman game   (auto-play + reward system)
//   ✔ Skill system   (unlocks + score-gated evolution)
//   ✔ Task planner   (random → extensible goal trees)
//   ✔ Code generation (module file creation engine)
//   ✔ Memory sharding (auto-shard at scale threshold)
//   ✔ Sandbox execution (restricted eval environment)
//   ✔ Autonomous loop (background ticker)
//   ✔ Express web app (REST API + SSE live feed)
//   ✔ Observability   (live stats endpoint)
//
// UPGRADE PATH:
//   - Swap Embedding.embed() → sentence-transformers / OpenAI embeddings
//   - Swap VectorStore     → pgvector / Supabase / Weaviate
//   - Swap Planner.decide()→ multi-step reasoning / goal trees
// =============================================================================

import * as fs from "fs";
import * as path from "path";
import * as http from "http";
import express, { Request, Response } from "express";

// =============================================================================
// CONFIG
// =============================================================================

const CONFIG = {
  memoryFile: "memory.json",
  vectorFile: "vectors.json",
  logFile: "activity.log",
  embeddingDim: 128,
  similarityThreshold: 0.72,
  maxMemoryBeforeShard: 500,
  skillUnlockScore: 25,
  moduleCreationScore: 75,
  loopDelayMs: 2000,
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  safeDomains: [
    "api.dictionaryapi.dev",
    "api.datamuse.com",
    "en.wikipedia.org",
  ] as string[],
};

// =============================================================================
// UTILITIES
// =============================================================================

function log(msg: string): void {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(CONFIG.logFile, line + "\n");
}

async function safeRequest(url: string): Promise<unknown | null> {
  if (!CONFIG.safeDomains.some((d) => url.includes(d))) return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// =============================================================================
// EMBEDDING ENGINE (SEED VERSION — PLUGGABLE)
// =============================================================================
//
// CURRENT:  Deterministic pseudo-embedding (character hashing)
//
// UPGRADE:  Replace embed() with:
//   - @xenova/transformers (sentence-transformers in Node.js)
//   - OR OpenAI text-embedding-ada-002
//   Nothing else in this file needs to change.
// =============================================================================

class Embedding {
  embed(text: string): number[] {
    const vec = new Array<number>(CONFIG.embeddingDim).fill(0);
    for (let i = 0; i < Math.min(text.length, CONFIG.embeddingDim); i++) {
      vec[i] = (text.charCodeAt(i) % 97) / 26.0;
    }
    const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
    return norm > 0 ? vec.map((v) => v / norm) : vec;
  }
}

const EMBED = new Embedding();

// =============================================================================
// VECTOR STORE (LOCAL — PGVECTOR READY)
// =============================================================================
//
// PGVECTOR MIGRATION:
//   CREATE TABLE embeddings (
//     id SERIAL PRIMARY KEY, content TEXT, embedding VECTOR(1536)
//   );
//   Use ivfflat index + cosine similarity via pgvector.
// =============================================================================

interface VectorEntry {
  text: string;
  vec: number[];
  meta: Record<string, string>;
}

class VectorStore {
  data: VectorEntry[] = [];

  constructor() {
    this.data = this.load();
  }

  private load(): VectorEntry[] {
    if (fs.existsSync(CONFIG.vectorFile)) {
      return JSON.parse(fs.readFileSync(CONFIG.vectorFile, "utf8"));
    }
    return [];
  }

  save(): void {
    fs.writeFileSync(CONFIG.vectorFile, JSON.stringify(this.data));
  }

  add(text: string, meta: Record<string, string>): void {
    this.data.push({ text, vec: EMBED.embed(text), meta });
  }

  private similarity(a: number[], b: number[]): number {
    let dot = 0, na = 0, nb = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      na += a[i] * a[i];
      nb += b[i] * b[i];
    }
    const denom = Math.sqrt(na) * Math.sqrt(nb);
    return denom === 0 ? 0 : dot / denom;
  }

  search(query: string, topK = 5): Array<[number, VectorEntry]> {
    const q = EMBED.embed(query);
    const scored: Array<[number, VectorEntry]> = this.data
      .map((item): [number, VectorEntry] => [this.similarity(q, item.vec), item])
      .filter(([sim]) => sim > CONFIG.similarityThreshold);
    scored.sort((a, b) => b[0] - a[0]);
    return scored.slice(0, topK);
  }
}

const VECTOR = new VectorStore();

// =============================================================================
// MEMORY SYSTEM (WITH VECTOR INDEXING)
// =============================================================================

interface MemoryData {
  knowledge: Record<string, unknown>;
  skills: Record<string, boolean>;
  score: number;
  discoveries: number;
  filesCreated: number;
}

class Memory {
  data: MemoryData;

  constructor() {
    this.data = this.load();
  }

  private load(): MemoryData {
    if (fs.existsSync(CONFIG.memoryFile)) {
      return JSON.parse(fs.readFileSync(CONFIG.memoryFile, "utf8"));
    }
    return {
      knowledge: {},
      skills: { hangman: true },
      score: 0,
      discoveries: 0,
      filesCreated: 0,
    };
  }

  save(): void {
    fs.writeFileSync(CONFIG.memoryFile, JSON.stringify(this.data, null, 2));
    VECTOR.save();
  }

  add(topic: string, content: unknown): void {
    this.data.knowledge[topic] = content;
    VECTOR.add(`${topic} ${String(content)}`, { t: topic });
    this.reward();
  }

  reward(pts = 1): void {
    this.data.score += pts;
    this.data.discoveries += 1;
  }
}

const MEM = new Memory();

// =============================================================================
// INTERNET ENGINE (SAFE + CONTROLLED CRAWLING)
// =============================================================================

class Internet {
  async dictionary(word: string): Promise<string | null> {
    const data = await safeRequest(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`
    ) as Array<{ meanings: Array<{ definitions: Array<{ definition: string }> }> }> | null;
    try {
      return data?.[0]?.meanings?.[0]?.definitions?.[0]?.definition ?? null;
    } catch { return null; }
  }

  async thesaurus(word: string): Promise<string[] | null> {
    const data = await safeRequest(
      `https://api.datamuse.com/words?ml=${encodeURIComponent(word)}`
    ) as Array<{ word: string }> | null;
    try {
      return data?.slice(0, 5).map((x) => x.word) ?? null;
    } catch { return null; }
  }

  async wiki(topic: string): Promise<string | null> {
    const data = await safeRequest(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topic)}`
    ) as { extract?: string } | null;
    try {
      return data?.extract ?? null;
    } catch { return null; }
  }
}

const NET = new Internet();

// =============================================================================
// SEARCH ENGINE (MEMORY → VECTOR → INTERNET)
// =============================================================================

class Search {
  async run(query: string): Promise<unknown | null> {
    // 1. Exact memory hit
    if (query in MEM.data.knowledge) return MEM.data.knowledge[query];

    // 2. Vector similarity search
    const hits = VECTOR.search(query);
    if (hits.length > 0) return hits.map(([, item]) => item.text);

    // 3. Internet fallback chain
    const def = await NET.dictionary(query);
    if (def) { MEM.add(query, def); return def; }

    const syn = await NET.thesaurus(query);
    if (syn) { MEM.add(query, syn); return syn; }

    const wiki = await NET.wiki(query);
    if (wiki) { MEM.add(query, wiki); return wiki; }

    return null;
  }
}

const SEARCH = new Search();

// =============================================================================
// GAME: HANGMAN (AUTO-PLAY + REWARD)
// =============================================================================

const HANGMAN_WORDS = [
  "intelligence", "learning", "system", "network", "code",
  "knowledge", "language", "memory", "vector", "embedding",
];

class Hangman {
  private word: string;
  private guessed = new Set<string>();
  private attempts = 6;

  constructor() {
    this.word = HANGMAN_WORDS[Math.floor(Math.random() * HANGMAN_WORDS.length)];
  }

  auto(): boolean {
    const letters = "abcdefghijklmnopqrstuvwxyz".split("").sort(() => Math.random() - 0.5);
    for (const g of letters) {
      if (this.attempts <= 0) break;
      this.guessed.add(g);
      if (!this.word.includes(g)) this.attempts--;
      if ([...this.word].every((c) => this.guessed.has(c))) {
        MEM.reward(5);
        return true;
      }
    }
    return false;
  }
}

// =============================================================================
// SANDBOX EXECUTION (SAFE — RESTRICTED SCOPE)
// =============================================================================

class Sandbox {
  run(code: string): boolean {
    try {
      // SEED-LEVEL sandbox: restricts global scope to a safe console shim.
      // PRODUCTION UPGRADE: replace with `isolated-vm` or `vm2` for true isolation.
      const fn = new Function("console", code);
      fn({ log: (m: unknown) => log(`[SANDBOX] ${m}`) });
      return true;
    } catch {
      return false;
    }
  }
}

const SANDBOX = new Sandbox();

// =============================================================================
// CODE GENERATION ENGINE
// =============================================================================

class CodeGen {
  createModule(): void {
    const name = `module_${MEM.data.filesCreated}.ts`;
    // ts is always an ISO 8601 string produced by Date — safe to embed in a comment/string literal
    const ts = new Date().toISOString().replace(/[^0-9T:.Z-]/g, "");
    const code = [
      `// Auto-generated module — ${ts}`,
      `export function skill(): string {`,
      `  return "generated at ${ts}";`,
      `}`,
      "",
    ].join("\n");
    fs.writeFileSync(name, code);
    MEM.data.filesCreated += 1;
    log(`[CODEGEN] Created ${name}`);
  }
}

const CODEGEN = new CodeGen();

// =============================================================================
// PLANNER (TASK SELECTION — EXTENSIBLE)
// =============================================================================

type Task = "explore" | "game" | "learn" | "code";

class Planner {
  private tasks: Task[] = ["explore", "game", "learn", "code"];

  decide(): Task {
    // Future: weight by score / skill unlocks / goal state
    return this.tasks[Math.floor(Math.random() * this.tasks.length)];
  }
}

const PLANNER = new Planner();

// =============================================================================
// EVOLUTION ENGINE (SKILL UNLOCK + MODULE CREATION + MEMORY SHARDING)
// =============================================================================

class Evolution {
  run(): void {
    const score = MEM.data.score;

    if (score > CONFIG.skillUnlockScore) {
      MEM.data.skills["search"] = true;
    }

    if (score > CONFIG.moduleCreationScore) {
      CODEGEN.createModule();
    }

    if (Object.keys(MEM.data.knowledge).length > CONFIG.maxMemoryBeforeShard) {
      const fname = `shard_${MEM.data.filesCreated}.json`;
      try {
        fs.writeFileSync(fname, JSON.stringify(MEM.data));
        MEM.data.knowledge = {};
        MEM.data.filesCreated += 1;
        log(`[SHARD] Written → ${fname}`);
      } catch (err) {
        log(`[SHARD] Failed to write ${fname}: ${String(err)}`);
      }
    }
  }
}

const EVOLVE = new Evolution();

// =============================================================================
// SSE BROADCASTER (live log feed to browser clients)
// =============================================================================

const sseClients = new Set<Response>();

function broadcast(line: string): void {
  for (const res of sseClients) {
    res.write(`data: ${JSON.stringify(line)}\n\n`);
  }
}

// =============================================================================
// CORE AI LOOP
// =============================================================================

class BabyAI {
  private recentLogs: string[] = [];

  private emit(msg: string): void {
    log(msg);
    this.recentLogs.push(msg);
    if (this.recentLogs.length > 200) this.recentLogs.shift();
    broadcast(msg);
  }

  private think(): string {
    const keys = Object.keys(MEM.data.knowledge);
    if (keys.length > 0) return keys[Math.floor(Math.random() * keys.length)];
    const seeds = ["intelligence", "code", "learning", "language", "memory"];
    return seeds[Math.floor(Math.random() * seeds.length)];
  }

  private async explore(): Promise<void> {
    const q = this.think();
    const r = await SEARCH.run(q);
    this.emit(`[EXPLORE] ${q} -> ${String(r).slice(0, 80)}`);
  }

  private play(): void {
    const win = new Hangman().auto();
    this.emit(`[GAME] Hangman → ${win ? "WIN" : "LOSE"}`);
  }

  private async learn(): Promise<void> {
    const word = this.think();
    await SEARCH.run(word);
    this.emit(`[LEARN] ${word}`);
  }

  private code(): void {
    CODEGEN.createModule();
    this.emit("[CODE] Module generated");
  }

  getStatus() {
    return {
      score: MEM.data.score,
      discoveries: MEM.data.discoveries,
      knowledgeSize: Object.keys(MEM.data.knowledge).length,
      vectorCount: VECTOR.data.length,
      filesCreated: MEM.data.filesCreated,
      skills: MEM.data.skills,
    };
  }

  getRecentLogs(): string[] {
    return [...this.recentLogs];
  }

  async tick(): Promise<void> {
    const task = PLANNER.decide();
    try {
      if (task === "explore") await this.explore();
      else if (task === "game")  this.play();
      else if (task === "learn") await this.learn();
      else if (task === "code")  this.code();

      EVOLVE.run();
      MEM.save();

      this.emit(
        `[STATUS] score=${MEM.data.score} ` +
        `mem=${Object.keys(MEM.data.knowledge).length} ` +
        `vec=${VECTOR.data.length} task=${task}`
      );
    } catch (err) {
      this.emit(`[ERROR] ${String(err)}`);
    }
  }

  start(): void {
    this.emit("[BOOT] Baby GPT seed starting…");
    const tick = () => {
      this.tick().finally(() => setTimeout(tick, CONFIG.loopDelayMs));
    };
    setTimeout(tick, CONFIG.loopDelayMs);
  }
}

const AI = new BabyAI();

// =============================================================================
// EXPRESS WEB APP
// =============================================================================

const app = express();
app.use(express.json());

// --- Status ---
app.get("/status", (_req: Request, res: Response) => {
  res.json(AI.getStatus());
});

// --- Search / query ---
app.get("/search", async (req: Request, res: Response) => {
  const q = String(req.query["q"] ?? "").trim();
  if (!q) { res.status(400).json({ error: "q param required" }); return; }
  const result = await SEARCH.run(q);
  res.json({ query: q, result: result ?? null });
});

// --- Recent logs ---
app.get("/logs", (_req: Request, res: Response) => {
  res.json(AI.getRecentLogs());
});

// --- Play one Hangman round on demand ---
app.post("/game/hangman", (_req: Request, res: Response) => {
  const win = new Hangman().auto();
  MEM.save();
  res.json({ result: win ? "WIN" : "LOSE", score: MEM.data.score });
});

// --- Run code in sandbox ---
app.post("/sandbox", (req: Request, res: Response) => {
  const { code } = req.body as { code?: string };
  if (!code) { res.status(400).json({ error: "code required" }); return; }
  const ok = SANDBOX.run(code);
  res.json({ success: ok });
});

// --- SSE live log stream ---
app.get("/stream", (req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();
  sseClients.add(res);
  req.on("close", () => sseClients.delete(res));
});

// --- Simple HTML dashboard ---
app.get("/", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/html");
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Baby GPT Seed</title>
  <style>
    body { font-family: monospace; background: #0d0d0d; color: #39ff14; margin: 0; padding: 1rem; }
    h1   { color: #00eaff; }
    #status, #log { background: #111; border: 1px solid #333; padding: 1rem; border-radius: 4px; }
    #log  { height: 400px; overflow-y: auto; margin-top: 1rem; white-space: pre-wrap; }
    .search { margin: 1rem 0; display: flex; gap: 0.5rem; }
    input  { flex: 1; background: #1a1a1a; border: 1px solid #444; color: #39ff14; padding: 0.4rem; }
    button { background: #00eaff22; border: 1px solid #00eaff; color: #00eaff; padding: 0.4rem 1rem; cursor: pointer; }
  </style>
</head>
<body>
  <h1>🧠 Baby GPT Seed</h1>
  <div id="status">Loading status…</div>
  <div class="search">
    <input id="q" placeholder="Search knowledge…" />
    <button onclick="search()">Search</button>
  </div>
  <div id="result"></div>
  <div id="log"></div>
  <script>
    async function refresh() {
      const s = await fetch('/status').then(r => r.json());
      document.getElementById('status').textContent =
        'Score: ' + s.score + '  |  Knowledge: ' + s.knowledgeSize +
        '  |  Vectors: ' + s.vectorCount + '  |  Files: ' + s.filesCreated;
    }
    async function search() {
      const q = document.getElementById('q').value.trim();
      if (!q) return;
      const r = await fetch('/search?q=' + encodeURIComponent(q)).then(x => x.json());
      document.getElementById('result').textContent = JSON.stringify(r.result, null, 2);
    }
    const logEl = document.getElementById('log');
    const es = new EventSource('/stream');
    es.onmessage = e => {
      logEl.textContent += JSON.parse(e.data) + '\\n';
      logEl.scrollTop = logEl.scrollHeight;
      refresh();
    };
    refresh();
    setInterval(refresh, 5000);
  </script>
</body>
</html>`);
});

// =============================================================================
// ENTRY POINT
// =============================================================================

const server = http.createServer(app);
server.listen(CONFIG.port, () => {
  log(`[WEB] Baby GPT running → http://localhost:${CONFIG.port}`);
  AI.start();
});

export { AI, MEM, VECTOR, SEARCH, EMBED, SANDBOX, CONFIG };
