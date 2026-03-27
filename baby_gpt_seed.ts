/**
 * =============================================================================
 * BabyGPT Growth-Tree Seed v2.0
 * Fully engineered self-evolving system — TypeScript Web App
 * =============================================================================
 *
 * Features:
 *   ✔ MemoryStore  — vocab Map, grammar rules, action history, module counter
 *   ✔ Embeddings   — deterministic (pluggable → sentence-transformers / OpenAI)
 *   ✔ VectorStore  — cosine-similarity semantic search, pgvector-ready
 *   ✔ Reward / Punishment — score-gated skill unlocks & growth triggers
 *   ✔ Hangman      — MIT 10k word list + auto-play reinforcement loop
 *   ✔ URL Explorer — safe scrape: dictionary.com / thesaurus.com / Wikipedia
 *   ✔ Self-learning loop — hangman OR exploration, continuous autonomous cycle
 *   ✔ Module expansion — threshold-triggered in-memory & file auto-growth
 *   ✔ Code synthesis hook — generates new .ts modules on evolution triggers
 *   ✔ Self-transformer hook — evolution event bus for future model upgrades
 *   ✔ Express web app — REST API + SSE live feed + HTML dashboard
 *
 * Upgrade path:
 *   • Swap Embedding.embed()  → @xenova/transformers / OpenAI Ada-002
 *   • Swap VectorStore        → pgvector / Supabase / Weaviate
 *   • Swap Planner.decide()   → goal-tree / multi-step reasoning
 *   • Swap Sandbox.run()      → isolated-vm / vm2 for true isolation
 *
 * Author: Ascended AI Engineering 2026
 * =============================================================================
 */

import * as fs from "fs";
import * as http from "http";
import express, { Request, Response } from "express";

// =============================================================================
// CONFIG
// =============================================================================

const CONFIG = {
  // Safe domains for URL exploration (scraping kept inside this list)
  safeURLs: [
    "https://api.dictionaryapi.dev/api/v2/entries/en/",
    "https://api.datamuse.com/words?ml=",
    "https://en.wikipedia.org/api/rest_v1/page/summary/",
  ] as string[],
  safeDomains: [
    "api.dictionaryapi.dev",
    "api.datamuse.com",
    "en.wikipedia.org",
    "www.mit.edu",
  ] as string[],

  minWordLength: 2,
  maxVectorSize: 128,
  selfLearningIntervalMs: 2000,
  rewardFactor: 1.0,

  hangmanWordsURL: "https://www.mit.edu/~ecprice/wordlist.10000",
  hangmanFallback: ["apple", "banana", "cherry", "intelligence", "learning",
                    "system", "network", "code", "knowledge", "language"],

  moduleMemoryThreshold: 100, // words before a new module is minted
  maxModules: 1000,

  similarityThreshold: 0.60,
  skillUnlockScore: 25,
  evolutionTriggerScore: 75,
  shardThreshold: 500,

  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  logFile: "activity.log",
  memoryFile: "memory.json",
  vectorFile: "vectors.json",
};

// =============================================================================
// UTILITIES
// =============================================================================

function log(msg: string): void {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  try { fs.appendFileSync(CONFIG.logFile, line + "\n"); } catch { /* non-fatal */ }
}

/** Only fetches URLs whose hostname is in safeDomains. */
async function safeGet(url: string): Promise<string | null> {
  try {
    const hostname = new URL(url).hostname;
    if (!CONFIG.safeDomains.some((d) => hostname.endsWith(d))) {
      log(`[SAFE] Blocked: ${url}`);
      return null;
    }
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    return res.ok ? await res.text() : null;
  } catch {
    return null;
  }
}

// =============================================================================
// EMBEDDING ENGINE  (seed-level — pluggable)
// =============================================================================
//
//  CURRENT:  Deterministic character-hash embedding → stable for cosine search.
//  UPGRADE:  Replace embed() with a real model — nothing else changes.
//
class Embedding {
  embed(text: string): number[] {
    const vec = new Array<number>(CONFIG.maxVectorSize).fill(0);
    for (let i = 0; i < Math.min(text.length, CONFIG.maxVectorSize); i++) {
      vec[i] = (text.charCodeAt(i) % 26) / 26.0;
    }
    const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
    return norm > 0 ? vec.map((v) => v / norm) : vec;
  }
}

const EMBED = new Embedding();

// =============================================================================
// VECTOR STORE  (local — pgvector-ready)
// =============================================================================

interface VectorEntry {
  text: string;
  vec: number[];
  meta: Record<string, string>;
}

class VectorStore {
  data: VectorEntry[] = [];

  constructor() { this.data = this._load(); }

  private _load(): VectorEntry[] {
    try {
      if (fs.existsSync(CONFIG.vectorFile))
        return JSON.parse(fs.readFileSync(CONFIG.vectorFile, "utf8")) as VectorEntry[];
    } catch { /* start fresh */ }
    return [];
  }

  save(): void {
    try { fs.writeFileSync(CONFIG.vectorFile, JSON.stringify(this.data)); } catch { /* non-fatal */ }
  }

  add(text: string, meta: Record<string, string> = {}): void {
    this.data.push({ text, vec: EMBED.embed(text), meta });
  }

  private _cosine(a: number[], b: number[]): number {
    let dot = 0, na = 0, nb = 0;
    for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] ** 2; nb += b[i] ** 2; }
    const d = Math.sqrt(na) * Math.sqrt(nb);
    return d === 0 ? 0 : dot / d;
  }

  search(query: string, topK = 5): Array<[number, VectorEntry]> {
    const q = EMBED.embed(query);
    return this.data
      .map((item): [number, VectorEntry] => [this._cosine(q, item.vec), item])
      .filter(([sim]) => sim > CONFIG.similarityThreshold)
      .sort((a, b) => b[0] - a[0])
      .slice(0, topK);
  }
}

const VECTOR = new VectorStore();

// =============================================================================
// MEMORY STORE  (vocab + grammar + history + module tracking)
// =============================================================================

interface PersistedMemory {
  knowledge: Record<string, unknown>;
  skills: Record<string, boolean>;
  score: number;
  discoveries: number;
  filesCreated: number;
}

class MemoryStore {
  /** Word → embedding vector (growth-tree vocabulary) */
  vocab: Map<string, number[]> = new Map();
  /** Observed grammar/syntax patterns */
  grammarRules: string[] = [];
  /** Full action history log */
  history: Array<Record<string, unknown>> = [];
  /** Number of auto-generated modules so far */
  moduleCount = 0;

  /** Persistent stats (score, discoveries, knowledge base) */
  persisted: PersistedMemory;

  constructor() {
    this.persisted = this._loadPersisted();
    // Re-hydrate vocab from persisted knowledge
    for (const [topic, content] of Object.entries(this.persisted.knowledge)) {
      this._indexWord(topic);
      VECTOR.add(`${topic} ${String(content)}`, { t: topic });
    }
  }

  private _loadPersisted(): PersistedMemory {
    try {
      if (fs.existsSync(CONFIG.memoryFile))
        return JSON.parse(fs.readFileSync(CONFIG.memoryFile, "utf8")) as PersistedMemory;
    } catch { /* start fresh */ }
    return { knowledge: {}, skills: { hangman: true }, score: 0, discoveries: 0, filesCreated: 0 };
  }

  private _indexWord(word: string): void {
    if (!this.vocab.has(word) && word.length >= CONFIG.minWordLength) {
      this.vocab.set(word, EMBED.embed(word));
    }
  }

  /** Add a word to vocab and trigger module-growth check. */
  addWord(word: string): void {
    const w = word.toLowerCase().trim();
    if (!w || w.length < CONFIG.minWordLength) return;
    if (!this.vocab.has(w)) {
      this.vocab.set(w, EMBED.embed(w));
      VECTOR.add(w, { src: "word" });
      this._checkModuleGrowth();
    }
  }

  /** Persist a topic → content knowledge entry. */
  addKnowledge(topic: string, content: unknown): void {
    this.persisted.knowledge[topic] = content;
    this._indexWord(topic);
    VECTOR.add(`${topic} ${String(content)}`, { t: topic });
    this.reward("knowledge");
  }

  addGrammarRule(rule: string): void {
    if (!this.grammarRules.includes(rule)) {
      this.grammarRules.push(rule);
      log(`[Grammar] Rule added: ${rule}`);
    }
  }

  logAction(action: Record<string, unknown>): void {
    this.history.push({ ...action, ts: new Date().toISOString() });
    if (this.history.length > 2000) this.history.shift(); // rolling window
  }

  reward(action: string, pts = 1): void {
    this.persisted.score += pts * CONFIG.rewardFactor;
    this.persisted.discoveries += 1;
    log(`[Reward ✔] "${action}" +${pts}  score=${this.persisted.score}`);
    this.logAction({ type: "reward", action, pts });
    this._checkEvolution();
  }

  punish(action: string, pts = 1): void {
    this.persisted.score = Math.max(0, this.persisted.score - pts * CONFIG.rewardFactor);
    log(`[Punish ✘] "${action}" -${pts}  score=${this.persisted.score}`);
    this.logAction({ type: "punish", action, pts });
  }

  save(): void {
    try {
      fs.writeFileSync(CONFIG.memoryFile, JSON.stringify(this.persisted, null, 2));
      VECTOR.save();
    } catch (err) {
      log(`[Memory] Save failed: ${String(err)}`);
    }
  }

  // ---------------------------------------------------------------------------
  // Module growth — triggered when vocab crosses a threshold multiple
  // ---------------------------------------------------------------------------
  private _checkModuleGrowth(): void {
    const nextThreshold = (this.moduleCount + 1) * CONFIG.moduleMemoryThreshold;
    if (this.vocab.size >= nextThreshold && this.moduleCount < CONFIG.maxModules) {
      this.moduleCount++;
      this._createModule(this.moduleCount);
    }
  }

  private _createModule(id: number): void {
    log(`[Module] Auto-expansion: module ${id} minted (vocab=${this.vocab.size})`);
    this.logAction({ type: "module_created", id, vocabSize: this.vocab.size });
    EVOLUTION_BUS.emit("module_created", { id, vocabSize: this.vocab.size });

    // Write a generated .ts module to disk as a concrete artefact
    CODE_SYNTH.createModule(id);
  }

  // ---------------------------------------------------------------------------
  // Evolution — triggered by score milestones
  // ---------------------------------------------------------------------------
  private _checkEvolution(): void {
    const score = this.persisted.score;
    if (score > CONFIG.skillUnlockScore && !this.persisted.skills["search"]) {
      this.persisted.skills["search"] = true;
      log("[Evolution] Skill unlocked: search");
      EVOLUTION_BUS.emit("skill_unlocked", { skill: "search", score });
    }
    if (score > CONFIG.evolutionTriggerScore && !this.persisted.skills["self_transform"]) {
      this.persisted.skills["self_transform"] = true;
      log("[Evolution] Self-transformer evolution triggered!");
      EVOLUTION_BUS.emit("self_transform", { score });
    }
    // Memory sharding
    if (Object.keys(this.persisted.knowledge).length > CONFIG.shardThreshold) {
      const fname = `shard_${this.persisted.filesCreated}.json`;
      try {
        fs.writeFileSync(fname, JSON.stringify(this.persisted));
        this.persisted.knowledge = {};
        this.persisted.filesCreated++;
        log(`[Shard] Written → ${fname}`);
      } catch (err) {
        log(`[Shard] Write failed: ${String(err)}`);
      }
    }
  }

  getStats() {
    return {
      vocabSize: this.vocab.size,
      grammarRules: this.grammarRules.length,
      historyLength: this.history.length,
      moduleCount: this.moduleCount,
      knowledgeSize: Object.keys(this.persisted.knowledge).length,
      vectorCount: VECTOR.data.length,
      score: this.persisted.score,
      discoveries: this.persisted.discoveries,
      filesCreated: this.persisted.filesCreated,
      skills: this.persisted.skills,
    };
  }
}

// =============================================================================
// EVOLUTION EVENT BUS  (self-transformer hooks)
// =============================================================================
//
//  Lightweight publish/subscribe bus.  Listeners here are the "DNA hooks" that
//  future components (real transformer, pgvector, crawl agent) attach to.
//
type EvtPayload = Record<string, unknown>;
type EvtListener = (payload: EvtPayload) => void;

class EvolutionBus {
  private listeners: Map<string, EvtListener[]> = new Map();

  on(event: string, fn: EvtListener): void {
    const list = this.listeners.get(event) ?? [];
    list.push(fn);
    this.listeners.set(event, list);
  }

  emit(event: string, payload: EvtPayload = {}): void {
    log(`[EvoBus] event="${event}" payload=${JSON.stringify(payload)}`);
    for (const fn of this.listeners.get(event) ?? []) {
      try { fn(payload); } catch (err) { log(`[EvoBus] listener error: ${String(err)}`); }
    }
    broadcast(`[EvoBus] ${event}`);
  }
}

const EVOLUTION_BUS = new EvolutionBus();

// =============================================================================
// CODE SYNTHESIS ENGINE  (generates .ts modules as growth artefacts)
// =============================================================================

class CodeSynthesis {
  createModule(id: number): void {
    const isoTimestamp = new Date().toISOString().replace(/[^0-9TZ:.+-]/g, "");
    const name = `module_${id}.ts`;
    const lines = [
      `// BabyGPT auto-synthesized module ${id} — ${isoTimestamp}`,
      `// Upgrade: replace stub with real learned behaviour`,
      `export const MODULE_ID = ${id};`,
      `export const CREATED_AT = "${isoTimestamp}";`,
      `export function activate(): string {`,
      `  return \`module ${id} active since ${isoTimestamp}\`;`,
      `}`,
      ``,
    ];
    try {
      fs.writeFileSync(name, lines.join("\n"));
      MEM.persisted.filesCreated++;
      log(`[CodeSynth] Created ${name}`);
    } catch (err) {
      log(`[CodeSynth] Write failed: ${String(err)}`);
    }
  }
}

// Forward-declared — instantiated after MEM
let CODE_SYNTH: CodeSynthesis;

// =============================================================================
// MEMORY — instantiate now that classes are defined
// =============================================================================

const MEM = new MemoryStore();
CODE_SYNTH = new CodeSynthesis();

// =============================================================================
// REWARD & PUNISHMENT  (module-level helpers for ergonomic call sites)
// =============================================================================

const reward  = (action: string, pts = 1) => MEM.reward(action, pts);
const punish  = (action: string, pts = 1) => MEM.punish(action, pts);

// =============================================================================
// SAFE URL EXPLORER  (dictionary / thesaurus / Wikipedia scrape)
// =============================================================================

class URLExplorer {
  async explore(word: string): Promise<boolean> {
    const base = CONFIG.safeURLs[Math.floor(Math.random() * CONFIG.safeURLs.length)];
    const url = base + encodeURIComponent(word);
    const body = await safeGet(url);
    if (!body) { punish("exploreURL"); return false; }

    // Extract lowercase alpha tokens ≥ minWordLength
    const words = (body.match(/\b[a-z]{2,}\b/gi) ?? [])
      .map((w) => w.toLowerCase())
      .filter((w) => w.length >= CONFIG.minWordLength);

    let added = 0;
    for (const w of words) {
      if (!MEM.vocab.has(w)) { MEM.addWord(w); added++; }
    }

    // Persist first meaningful sentence-like extract as knowledge
    const extract = body.slice(0, 300).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    if (extract.length > 20) MEM.addKnowledge(word, extract);

    MEM.logAction({ type: "exploreURL", url, wordsAdded: added });
    reward("exploreURL", Math.max(1, Math.floor(added / 10)));
    log(`[Explorer] ${url} → +${added} words`);
    return true;
  }
}

const EXPLORER = new URLExplorer();

// =============================================================================
// SEARCH ENGINE  (memory → vector → internet)
// =============================================================================

class SearchEngine {
  async run(query: string): Promise<unknown | null> {
    // 1. Exact knowledge hit
    if (query in MEM.persisted.knowledge) return MEM.persisted.knowledge[query];

    // 2. Vector similarity
    const hits = VECTOR.search(query);
    if (hits.length > 0) return hits.map(([, item]) => item.text);

    // 3. Internet fallback (try each safe URL base)
    for (const base of CONFIG.safeURLs) {
      const url = base + encodeURIComponent(query);
      const body = await safeGet(url);
      if (body) {
        const extract = body.slice(0, 500).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
        if (extract.length > 20) {
          MEM.addKnowledge(query, extract);
          return extract;
        }
      }
    }
    return null;
  }
}

const SEARCH = new SearchEngine();

// =============================================================================
// HANGMAN  (MIT 10k word list + auto-play reinforcement)
// =============================================================================

let hangmanWordList: string[] = [...CONFIG.hangmanFallback];

async function fetchHangmanWords(): Promise<void> {
  const body = await safeGet(CONFIG.hangmanWordsURL);
  if (body) {
    const words = body.split("\n").map((w) => w.trim().toLowerCase()).filter((w) => w.length >= 3);
    if (words.length > 10) {
      hangmanWordList = words;
      log(`[Hangman] Word list loaded: ${words.length} words`);
    }
  } else {
    log("[Hangman] Using fallback word list");
  }
}

class Hangman {
  private word: string;
  private guessed = new Set<string>();
  private wrongGuesses = 0;
  private maxWrong = 6;

  constructor() {
    this.word = hangmanWordList[Math.floor(Math.random() * hangmanWordList.length)];
  }

  /** Fully automated play — returns true on win. */
  auto(): boolean {
    // Fisher-Yates shuffle for uniform letter ordering
    const letters = "abcdefghijklmnopqrstuvwxyz".split("");
    for (let i = letters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [letters[i], letters[j]] = [letters[j], letters[i]];
    }
    for (const g of letters) {
      if (this.wrongGuesses >= this.maxWrong) break;
      this.guessed.add(g);
      if (!this.word.includes(g)) this.wrongGuesses++;
      if ([...this.word].every((c) => this.guessed.has(c))) {
        // Learn every letter of the solved word
        this.word.split("").filter((c, i, a) => a.indexOf(c) === i).forEach((c) => MEM.addWord(c));
        MEM.addWord(this.word);
        reward("hangman_win", 5);
        MEM.logAction({ type: "hangman", word: this.word, result: "WIN" });
        return true;
      }
    }
    punish("hangman_lose");
    MEM.logAction({ type: "hangman", word: this.word, result: "LOSE" });
    return false;
  }
}

// =============================================================================
// SANDBOX EXECUTION  (safe restricted eval — seed level)
// =============================================================================
//
//  PRODUCTION UPGRADE: replace new Function() with isolated-vm or vm2.
//  WARNING: new Function() executes arbitrary JS within the current process.
//  Only call Sandbox.run() with code you control or have validated externally.
//
class Sandbox {
  run(code: string): boolean {
    // Basic guard: reject code containing obvious escape attempts
    const blocked = ["require", "process", "globalThis", "__proto__", "constructor"];
    if (blocked.some((kw) => code.includes(kw))) {
      log("[Sandbox] Rejected: blocked keyword detected");
      return false;
    }
    try {
      const fn = new Function("console", code);
      fn({ log: (m: unknown) => log(`[Sandbox] ${String(m)}`) });
      return true;
    } catch {
      return false;
    }
  }
}

const SANDBOX = new Sandbox();

// =============================================================================
// PLANNER  (task selection — extensible to goal trees)
// =============================================================================

type Task = "explore" | "hangman" | "learn" | "codegen";

class Planner {
  private tasks: Task[] = ["explore", "hangman", "learn", "codegen"];
  decide(): Task { return this.tasks[Math.floor(Math.random() * this.tasks.length)]; }
}

const PLANNER = new Planner();

// =============================================================================
// SSE BROADCASTER  (live log feed)
// =============================================================================

const sseClients = new Set<Response>();

function broadcast(line: string): void {
  const msg = `data: ${JSON.stringify(line)}\n\n`;
  for (const res of sseClients) { try { res.write(msg); } catch { sseClients.delete(res); } }
}

// =============================================================================
// BABY GPT CORE LOOP
// =============================================================================

class BabyGPT {
  private recentLogs: string[] = [];

  private emit(msg: string): void {
    log(msg);
    this.recentLogs.push(msg);
    if (this.recentLogs.length > 300) this.recentLogs.shift();
    broadcast(msg);
  }

  private think(): string {
    const keys = Array.from(MEM.vocab.keys());
    if (keys.length > 0) return keys[Math.floor(Math.random() * keys.length)];
    return CONFIG.hangmanFallback[Math.floor(Math.random() * CONFIG.hangmanFallback.length)];
  }

  private async explore(): Promise<void> {
    const word = this.think();
    await EXPLORER.explore(word);
    this.emit(`[Explore] ${word} vocab=${MEM.vocab.size}`);
  }

  private playHangman(): void {
    const win = new Hangman().auto();
    this.emit(`[Hangman] ${win ? "WIN ✔" : "LOSE ✘"}  score=${MEM.persisted.score}`);
  }

  private async learn(): Promise<void> {
    const word = this.think();
    const result = await SEARCH.run(word);
    this.emit(`[Learn] "${word}" → ${String(result).slice(0, 80)}`);
  }

  private codegen(): void {
    CODE_SYNTH.createModule(MEM.persisted.filesCreated);
    this.emit(`[CodeGen] Module ${MEM.persisted.filesCreated} synthesised`);
  }

  async tick(): Promise<void> {
    const task = PLANNER.decide();
    try {
      if      (task === "explore")  await this.explore();
      else if (task === "hangman")  this.playHangman();
      else if (task === "learn")    await this.learn();
      else if (task === "codegen")  this.codegen();

      MEM.save();
      this.emit(
        `[Status] score=${MEM.persisted.score} ` +
        `vocab=${MEM.vocab.size} vec=${VECTOR.data.length} ` +
        `modules=${MEM.moduleCount} task=${task}`
      );
    } catch (err) {
      this.emit(`[Error] ${String(err)}`);
    }
  }

  getRecentLogs(): string[] { return [...this.recentLogs]; }

  /** Kick off the autonomous self-learning loop. */
  start(): void {
    this.emit("[Boot] BabyGPT Growth-Tree Seed starting…");
    const tick = () => { this.tick().finally(() => setTimeout(tick, CONFIG.selfLearningIntervalMs)); };
    fetchHangmanWords().then(() => setTimeout(tick, CONFIG.selfLearningIntervalMs));
  }
}

const AI = new BabyGPT();

// =============================================================================
// WIRING EVOLUTION BUS HOOKS
// =============================================================================

EVOLUTION_BUS.on("skill_unlocked",  (p) => log(`[Hook] skill_unlocked: ${JSON.stringify(p)}`));
EVOLUTION_BUS.on("self_transform",  (p) => {
  log(`[Hook] *** SELF-TRANSFORMER TRIGGERED *** score=${p["score"]}`);
  // FUTURE: swap embedding engine, attach real model, trigger pgvector migration
});
EVOLUTION_BUS.on("module_created",  (p) => log(`[Hook] module_created id=${p["id"]}`));

// =============================================================================
// EXPRESS WEB APP
// =============================================================================

const app = express();
app.use(express.json());

/** GET /status — live stats snapshot */
app.get("/status", (_req: Request, res: Response) => {
  res.json(MEM.getStats());
});

/** GET /search?q=<query> — hybrid knowledge search */
app.get("/search", async (req: Request, res: Response) => {
  const q = String(req.query["q"] ?? "").trim();
  if (!q) { res.status(400).json({ error: "q param required" }); return; }
  const result = await SEARCH.run(q);
  res.json({ query: q, result: result ?? null });
});

/** POST /learn  { "word": "..." } — inject knowledge manually */
app.post("/learn", (req: Request, res: Response) => {
  const { word } = req.body as { word?: string };
  if (!word) { res.status(400).json({ error: "word required" }); return; }
  MEM.addWord(word.toLowerCase());
  MEM.save();
  res.json({ ok: true, vocabSize: MEM.vocab.size });
});

/** POST /hangman — trigger one Hangman round */
app.post("/hangman", (_req: Request, res: Response) => {
  const win = new Hangman().auto();
  MEM.save();
  res.json({ result: win ? "WIN" : "LOSE", score: MEM.persisted.score });
});

/** POST /sandbox  { "code": "..." } — run code in restricted sandbox */
app.post("/sandbox", (req: Request, res: Response) => {
  const { code } = req.body as { code?: string };
  if (!code) { res.status(400).json({ error: "code required" }); return; }
  res.json({ success: SANDBOX.run(code) });
});

/** GET /vocab?limit=50 — peek at learned vocabulary */
app.get("/vocab", (req: Request, res: Response) => {
  const limit = Math.min(parseInt(String(req.query["limit"] ?? "50"), 10), 500);
  const words = Array.from(MEM.vocab.keys()).slice(-limit);
  res.json({ count: MEM.vocab.size, sample: words });
});

/** GET /logs — recent log lines */
app.get("/logs", (_req: Request, res: Response) => {
  res.json(AI.getRecentLogs());
});

/** GET /stream — SSE live feed */
app.get("/stream", (req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();
  sseClients.add(res);
  req.on("close", () => sseClients.delete(res));
});

/** GET / — HTML dashboard */
app.get("/", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>BabyGPT Growth-Tree</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:monospace;background:#080c10;color:#c5f5c5;padding:1rem}
  h1{color:#00eaff;margin-bottom:.75rem}
  .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:.5rem;margin-bottom:1rem}
  .card{background:#0d1a0d;border:1px solid #1a3a1a;border-radius:4px;padding:.6rem}
  .card .val{font-size:1.4rem;color:#39ff14}
  .card .lbl{font-size:.7rem;color:#6a9a6a;margin-top:.2rem}
  .row{display:flex;gap:.5rem;margin-bottom:.75rem;flex-wrap:wrap}
  input{flex:1;min-width:160px;background:#0d1a0d;border:1px solid #2a4a2a;color:#c5f5c5;padding:.4rem .6rem;border-radius:3px}
  button{background:#00331a;border:1px solid #00eaff;color:#00eaff;padding:.4rem .9rem;border-radius:3px;cursor:pointer}
  button:hover{background:#004d27}
  #result{background:#0d1a0d;border:1px solid #1a3a1a;border-radius:4px;padding:.6rem;margin-bottom:.75rem;min-height:2rem;white-space:pre-wrap;max-height:120px;overflow-y:auto}
  #feed{background:#050c05;border:1px solid #1a3a1a;border-radius:4px;padding:.6rem;height:380px;overflow-y:auto;white-space:pre-wrap;font-size:.8rem;color:#7fc87f}
  .tag{display:inline-block;background:#00331a;border:1px solid #005522;color:#00eaff;padding:.1rem .4rem;border-radius:2px;font-size:.7rem;margin:.1rem}
</style>
</head>
<body>
<h1>🌱 BabyGPT Growth-Tree Seed v2.0</h1>
<div class="grid" id="cards">
  <div class="card"><div class="val" id="s-score">–</div><div class="lbl">Score</div></div>
  <div class="card"><div class="val" id="s-vocab">–</div><div class="lbl">Vocab words</div></div>
  <div class="card"><div class="val" id="s-vec">–</div><div class="lbl">Vectors</div></div>
  <div class="card"><div class="val" id="s-mod">–</div><div class="lbl">Modules</div></div>
  <div class="card"><div class="val" id="s-disc">–</div><div class="lbl">Discoveries</div></div>
  <div class="card"><div class="val" id="s-files">–</div><div class="lbl">Files created</div></div>
</div>
<div id="skills"></div>
<div class="row" style="margin-top:.75rem">
  <input id="q" placeholder="Search knowledge base…">
  <button onclick="doSearch()">Search</button>
  <button onclick="doHangman()">▶ Hangman</button>
</div>
<div id="result">Results appear here…</div>
<div id="feed">Connecting to live feed…\n</div>
<script>
  const qs=s=>document.querySelector(s);
  async function refresh(){
    const s=await fetch('/status').then(r=>r.json());
    qs('#s-score').textContent=s.score;
    qs('#s-vocab').textContent=s.vocabSize;
    qs('#s-vec').textContent=s.vectorCount;
    qs('#s-mod').textContent=s.moduleCount;
    qs('#s-disc').textContent=s.discoveries;
    qs('#s-files').textContent=s.filesCreated;
    qs('#skills').innerHTML=Object.keys(s.skills||{}).map(k=>'<span class="tag">'+k+'</span>').join('');
  }
  async function doSearch(){
    const q=qs('#q').value.trim(); if(!q)return;
    const r=await fetch('/search?q='+encodeURIComponent(q)).then(x=>x.json());
    qs('#result').textContent=JSON.stringify(r.result,null,2);
  }
  async function doHangman(){
    const r=await fetch('/hangman',{method:'POST'}).then(x=>x.json());
    qs('#result').textContent='Hangman: '+r.result+'  score='+r.score;
    refresh();
  }
  const feed=qs('#feed');
  const es=new EventSource('/stream');
  es.onmessage=e=>{
    feed.textContent+=JSON.parse(e.data)+'\\n';
    feed.scrollTop=feed.scrollHeight;
    refresh();
  };
  refresh();
  setInterval(refresh,5000);
</script>
</body>
</html>`);
});

// =============================================================================
// ENTRY POINT
// =============================================================================

const server = http.createServer(app);
server.listen(CONFIG.port, () => {
  log(`[Web] BabyGPT running → http://localhost:${CONFIG.port}`);
  AI.start();
});

// =============================================================================
// EXPORTS  (for testing / external composition)
// =============================================================================

export {
  AI, MEM, VECTOR, SEARCH, EXPLORER, EMBED, SANDBOX,
  CODE_SYNTH, EVOLUTION_BUS, PLANNER, CONFIG,
  reward, punish,
};
