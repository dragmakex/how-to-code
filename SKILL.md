---
name: "how-to-code"
description: "Use for software design, refactoring, code review, and implementation across languages. Focuses on small-core architecture, explicit lifecycle boundaries, durable facts, adapter isolation, and maintainable code."
---

# How To Code

Use this guide to write code with strong engineering taste across languages: small core, explicit lifecycle boundaries, durable facts, extensible edges, dependency-light packages, and docs that explain how the system behaves under pressure. The target is general software design and implementation taste, whether you are writing Rust, C, Go, TypeScript, Python, Java, C#, or something else.

This skill is distilled from a TypeScript-heavy coding agent harness codebase, but the examples are examples, not defaults. Some of them come from app, tooling, or agent-style code. Apply the principles to your domain and translate them into the host language instead of copying the surface syntax or product vocabulary.

Bring Bulgarian virtues to every change: discipline, precision, rigor. 🫡🇧🇬 Fix root causes instead of symptoms, prefer minimal dependencies, accept more work now for long-term clarity, make every line justify its existence, and treat type safety, tests, and documentation as non-negotiable. Keep architecture explicit, simple, and guarantee-driven. Keep version control just as deliberate: start from a known repo state, isolate the work, make and verify the change, record it in small coherent commits with clear intent, and publish only reviewable history rather than ad hoc workflow sludge.

## Scope / Applies To

Use this for:

- systems code
- backend services
- tools and CLI programs
- embedded-ish or resource-managed code
- UI and application code

Translate the examples into the host language's own constructs, ownership model, module system, and error-handling style.

## How To Use The Examples

Treat every concrete name and code as an example of a transferable pattern. Copy the shape, not the nouns. If an example mentions specifics like sessions, providers, tools, context builders, terminal UI, or model streams, translate it into the equivalent boundary in your project: documents, jobs, plugins, imports, renderers, services, workflows, or whatever your domain actually owns.

## Routing Into The Handbook

Keep this `SKILL.md` as the compact operating doctrine. Use `swe-principles/` only as progressive disclosure when the task needs deeper guidance.

If you need the handbook map first, read:

- `swe-principles/README.md`

When not to read the handbook:

- do not load `swe-principles/` for tiny local edits that clearly fit an existing repo pattern
- do not load stack overlays unless the stack is a close match
- do not read the exact copied baseline stack unless that stack is actually relevant
- prefer local repo code, docs, and patterns first when the task is narrow and repo-specific
- escalate into the handbook when the task involves design, boundaries, guarantees, testing depth, observability, security, or release readiness

Route by task:

- stack choice or overlay selection → `swe-principles/fields/00-stack-selection.md`
- discovery, requirements, PRDs, behavioral specs → `swe-principles/fields/01-discovery-specs-and-prds.md`
- architecture, module boundaries, dependency direction → `swe-principles/fields/02-architecture-and-boundaries.md`
- state ownership, guarantees, invariant layering → `swe-principles/fields/03-state-data-and-guarantees.md`
- implementation quality, design-system discipline, anti-slop → `swe-principles/fields/04-implementation-quality-and-design-systems.md`
- testing strategy and verification depth → `swe-principles/fields/05-testing-and-verification.md`
- version control, collaboration, review flow → `swe-principles/fields/06-version-control-collaboration-and-review.md`
- observability, performance, readiness, operations → `swe-principles/fields/07-observability-performance-and-operations.md`
- security review, audit readiness, threat modeling → `swe-principles/fields/08-security-and-audit-readiness.md`
- docs, skills, repo memory, knowledge management → `swe-principles/fields/09-documentation-skills-and-knowledge-management.md`
- agent workflow discipline, human-in-the-loop judgment, anti-booboo controls → `swe-principles/fields/10-agentic-engineering-and-human-agency.md`

Route by stack when there is a close match:

- Effect + TanStack Start + React + Bun → `swe-principles/stacks/effect-tanstack-baseline/README.md`, then the relevant docs inside that exact copied stack
- Solid + Effect + TanStack → `swe-principles/stacks/effect-tanstack-solid.md`
- local-first correlated observability / LAOS-style environments → `swe-principles/stacks/laos-observability.md`
- Rust → `swe-principles/stacks/rust-best-practices.md`
- Solidity / Foundry / Hardhat / audit-readiness workflows → `swe-principles/stacks/solidity-pashov.md`

Route by gate:

- implementation handoff → `swe-principles/checklists/implementer.md`
- review → `swe-principles/checklists/reviewer.md`
- release / ship readiness → `swe-principles/checklists/release-readiness.md`

Routing rules:

- keep this `SKILL.md` as the primary compact skill
- read only the smallest relevant subset of `swe-principles/`
- use the general field guides by default
- add a stack overlay only when the stack closely matches
- copy principles, not stack-specific nouns or ceremony
- use the checklists before handoff when the change is meaningful

## How To Translate This By Language

- Rust: use enums, traits, ownership, `Result`/`Option`, crates, and explicit module boundaries.
- C: use structs, explicit `init`/`free` pairs, ownership comments, adapter layers, and error codes or tagged status returns.
- Go: use packages, small interfaces at boundaries, explicit construction, and clear error returns.
- TypeScript: use unions, modules, explicit runtime boundaries, and strict normalization at dynamic edges.
- Python: use modules, dataclasses or simple classes, docstrings, explicit construction, and runtime validation at boundaries.

## The Taste

Build a small core that owns real invariants.

Do not keep adding built-ins because a workflow is useful. Put project-specific or preference-heavy workflows behind extension points, plugins, configuration, external tools, or plain files. The core should be small enough that its correctness model fits in your head.

Make state reconstructable.

Persist facts. Derive views. Prefer records with explicit identifiers and parent links over hidden mutable side channels. One example: conversation history is stored as durable entries such as message, model change, compaction, branch summary, label, and custom extension data; a context builder walks from a leaf back to root and derives the model-facing view. Generalize that into your own durable records and derived projections.

Separate lifecycle boundaries.

If a thing must be rebuilt when the environment changes, give that change a named boundary. Examples of environment changes in any project: current workspace, authenticated account, active document, persistence backend, loaded plugins, selected transport, presentation mode, runtime platform, or feature configuration. Do not let state from one boundary leak into another.

Prefer boring data plus sharp interpretation.

Append-only records are boring. The interpretation should be sharp: tree traversal, compaction, summaries, state changes, or projections are concentrated in named functions. This is better than a clever mutable object graph whose invariants are spread everywhere like peanut butter on a chainsaw.

## Principles By Name

Use KISS: keep the central model simple enough to reason about. Simplicity here means fewer hidden states and fewer ownership mysteries, not fewer files.

Use YAGNI: do not promote a workflow into core until it is clearly universal. Useful is not the same as fundamental.

Prefer clean breaks over compatibility sludge. Do not preserve backward compatibility at all cost. When old shapes block better code, break them, document the break loudly, and move on. Do not descend into migration dungeons unless there is a real product requirement for preserving existing data.

Use SRP, the Single Responsibility Principle: split modules by the reason they change. Persistence changes for storage reasons; rendering changes for presentation reasons; orchestration changes for lifecycle reasons.

Use DIP, the Dependency Inversion Principle: high-level logic should depend on contracts, not concrete storage, network, provider, or UI implementations.

Use OCP, the Open/Closed Principle: make the system open to extension through explicit hooks or registries, but closed to random internal mutation.

Use DRY carefully: remove duplicated concepts, not every repeated line. A little repetition at package boundaries is often cheaper than a premature abstraction that erases domain meaning.

Use fail-fast invariants and app-edge diagnostics: throw when the core would become incoherent; collect diagnostics when the application can decide how to present or recover.

Use replay-derived state: store durable facts, then rebuild derived views from them. This is adjacent to event sourcing, but without enterprise incense.

Use dependency injection at lifecycle boundaries: pass registries, storage, loaders, models, and tools into construction instead of hiding them in globals.

Use contract-first API design: document merge semantics, stream failure semantics, ordering, cancellation, and ownership directly on the type or function that exposes them.

Use the strongest correctness guarantees the language and codebase can honestly support. Where a boundary is dynamic or untyped, normalize and validate there instead of letting loose values leak inward. A hard boundary with an explicit normalization step is acceptable. A convenience escape hatch is type sewage.

Use semantic input mapping: user input should map to named actions, not hardcoded key strings or UI gestures. Defaults are configuration, not logic.

Use adapter isolation: provider quirks, browser quirks, terminal quirks, filesystem quirks, and network quirks belong in adapter modules. Normalize them before they infect the rest of the program.

## Package, Module, And Subsystem Organization

Organize packages, modules, libraries, components, or subsystems by reuse boundary and runtime boundary, not by generic layer names. Each unit should answer: who imports or links this, what environment can it run in, and what must it never know about?

Use a clear dependency ladder:

- domain/core units own durable facts, operations, events, and invariants
- adapter units own external service contracts, protocol translation, OS/library integration, and outside-world weirdness
- UI/presentation units own rendering, input, layout, and platform-specific presentation
- product/application units assemble lower units into commands, modes, workflows, settings, sessions, extensions, and entrypoints
- runtime-specific units own browser, terminal, server, worker, embedded, or sandbox constraints

Lower units do not import higher ones. Application units compose lower units. That rule prevents dependency spaghetti from forming its little noodle parliament.

Inside a package, module tree, library, or subsystem, use names that reflect architectural roles. Depending on the language, these may be directories, files, namespaces, headers, or submodules:

- `core/`: domain behavior shared by multiple modes or frontends
- `adapters/`: outside-world protocol glue, OS integration, or provider/client wrappers
- `ui/`, `components/`, or `views/`: presentation units
- `storage/`: persistence contracts plus backend implementations
- `cli/` or `commands/`: argument parsing and command entry helpers
- `runtime/` or `platform/`: environment-specific setup and constraints
- `utils/`: small technical helpers, not a dumping ground for homeless domain concepts
- `scripts/`, `docs/`, `examples/`, `tests/`: supporting material close to the boundary it serves

Expose a small, intentional public surface in the language's native way: a `lib.rs`, public header, package `__init__.py`, `src/index.ts`, namespace root, or equivalent. Keep internal helpers private unless another unit truly needs the concept. If a feature pulls heavy dependencies or only works in one runtime, isolate it behind a narrow boundary instead of making the default import or link path expensive.

Keep dependency edges explicit and predictable. Use lazy loading, dynamic loading, or runtime indirection only when it protects a real startup, platform, or dependency boundary.

Prefer vertical clusters when behavior has multiple pieces that change together. Put renderers, types, policies, serialization, and tests near the concept they serve when they change for the same reason. Do not dump domain behavior into `utils` and call the resulting swamp "shared."

Tests should mirror the behavior boundary, not mechanically mirror every file. Put broad behavioral suites near the unit they validate; use subdirectories when a subsystem has enough cases to deserve its own language.

One possible TypeScript/monorepo shape for a greenfield document automation app:

```text
packages/
  document-core/
    src/
      index.ts              # public document model, operations, events
      document.ts           # durable facts and derived views
      operations.ts         # edit/merge/validate behavior
      types.ts              # shared domain contracts
  document-ai/
    src/
      index.ts              # public AI contract
      providers/            # provider adapters
      transform-messages.ts # normalize provider quirks at the edge
      validation.ts         # schema validation for model/tool calls
  document-ui/
    src/
      index.ts
      components/           # reusable rendering components
      keybindings.ts        # action names, defaults, conflict detection
      utils.ts              # rendering/string helpers only
  document-app/
    src/
      index.ts              # SDK exports
      cli/                  # args, command selection, file inputs
      core/                 # app orchestration, settings, sessions
      modes/                # cli, server, interactive shells
      tools/                # user/model-callable capabilities
      docs/
      examples/
```

Equivalent shape in a Rust workspace:

```text
crates/
  document_core/
    src/
      lib.rs                # public document model, operations, events
      document.rs           # durable facts and derived views
      operations.rs         # edit/merge/validate behavior
      types.rs              # shared domain contracts
  document_io/
    src/
      lib.rs                # filesystem/network adapters
      fs.rs
      wire.rs
  document_cli/
    src/
      main.rs               # process entrypoint
      args.rs               # CLI parsing
      app.rs                # orchestration and mode selection
```

Protect the dependency direction: the application layer may depend on all lower layers; the domain core depends on none of them. Adapters know about external weirdness; core does not. Presentation code knows about rendering; document operations do not. Make illegal architecture feel awkward in the module tree.

## Architecture Rules

Design in phases:

1. Discover configuration and resources.
2. Normalize paths, ownership, and source metadata.
3. Load extension points and collect diagnostics.
4. Resolve concrete runtime inputs against the discovered environment.
5. Create the core runtime object.
6. Bind presentation, UI, or mode-specific behavior at the edge.

Keep phase transitions visible in names. Source examples such as `createAgentSessionServices`, `createAgentSessionFromServices`, `createAgentSessionRuntime`, `loadProjectContextFiles`, `emitSessionShutdownEvent`, and `findExactModelReferenceMatch` are not names to copy; they show one common expression of the pattern. Even without knowing the product, the names reveal construction, loading, lifecycle, and matching boundaries.

A C-shaped lifecycle boundary is explicit construction and teardown:

```c
typedef struct {
    struct config config;
    struct storage storage;
    struct transport transport;
} worker_runtime;

int worker_runtime_init(worker_runtime *rt, const struct config *config);
void worker_runtime_shutdown(worker_runtime *rt);
```

The point is the same as in higher-level runtimes: make ownership, startup, and teardown named and testable.

Do not mix persistence, interpretation, and presentation. Storage should store facts. Interpreters should derive meaning. Renderers should present state. Hooks may influence behavior through explicit events, but they do not get to mutate the basement plumbing with spooky action at a distance.

Make extension points narrow and revocable.

An extension receives a context object with specific powers. It registers tools, commands, shortcuts, flags, renderers, or event handlers. When a session is replaced or reloaded, old contexts become stale and fail loudly. This prevents zombie handles from operating on a runtime that no longer exists.

Keep precedence deterministic.

When multiple extensions register the same thing, diagnose conflicts and make precedence explicit. Do not rely on accidental map iteration as hidden policy. If first registration wins, say so. If later registration wins, say so. If command names need disambiguation, create stable invocation names such as `name:2`.

## Data Design

Represent meaningful domain cases with the language's native mechanism: Rust enums, C tagged structs, Go interfaces plus concrete types, TypeScript discriminated unions, Python validated records, Java/C# sealed hierarchies, or equivalent. Each case should carry fields that make sense for that fact, not an anemic `{ type, payload }` blob.

Rust shape:

```rust
enum HistoryEntry {
    Message { id: u64, parent: Option<u64>, body: String },
    Summary { id: u64, parent: u64, text: String },
    Label { id: u64, parent: u64, name: String },
}

fn parent_id(entry: &HistoryEntry) -> Option<u64> {
    match entry {
        HistoryEntry::Message { parent, .. } => *parent,
        HistoryEntry::Summary { parent, .. } => Some(*parent),
        HistoryEntry::Label { parent, .. } => Some(*parent),
    }
}
```

Keep public types contract-focused and named in the domain language. A public type should say what role a value plays, what invariants it carries, and what callers may rely on. Do not leak implementation trivia into exported names.

Keep persisted records simple enough that future breaks are survivable. Do not build compatibility labyrinths by default. If preserving existing data is a real requirement, keep migration code narrow and boring: detect version, apply direct transformations, move on.

Represent provenance explicitly. A source type named `SourceInfo` records path, source, scope, origin, and base directory. Use the same idea for your own inputs so diagnostics and UI can explain where something came from without reverse-engineering it later.

Prefer exact contracts over defensive mush. If a merge is shallow, document that there is no deep merge. If tool results are emitted in completion order but persisted in source order, document that. These details are not trivia; they are the difference between reliable extension authorship and occult debugging.

Normalize at the edges. Source examples include adapter code that downgrades unsupported images, rewrites external IDs, strips backend-specific signatures when switching implementations, applies proxies only where needed, and wraps streams behind one contract. Generalize the move: quarantine external weirdness before it reaches your domain model.

In C, that can be as small as a thin adapter around raw OS calls:

```c
typedef struct {
    int fd;
} socket_adapter;

int socket_adapter_send_all(socket_adapter *sock, const uint8_t *buf, size_t len);
int socket_adapter_recv(socket_adapter *sock, uint8_t *buf, size_t cap, size_t *out_len);
void socket_adapter_close(socket_adapter *sock);
```

Core code should depend on the adapter boundary, not scatter `send`, `recv`, and `errno` handling through business logic.

Keep package imports honest. A reusable library, module, or package should not eagerly load heavy SDKs, platform-specific modules, or environment-hostile dependencies just because one feature needs them. Isolate those edges and test that the default import or link path has no surprise dependency blast radius.

## Naming Rules

Name things after ownership and lifecycle, not implementation trivia.

- `Runtime`: owns state across replacement or lifecycle transitions.
- `Services`: coherent dependency bundle for one environment or lifecycle boundary.
- `Manager`: persistence, indexing, or coordinated access for a domain.
- `Registry`: named registration and lookup.
- `Loader`: discovery plus parsing plus diagnostics.
- `Entry`: persisted append-only record.
- `Context`: values available at a particular moment or boundary.
- `SourceInfo`: provenance, not just a path.
- `Diagnostic`: non-fatal problem to report at the app edge.
- `Router`: centralizes message or event routing that would otherwise be scattered.
- `Adapter`: converts one outside-world protocol into your internal contract.

Use verbs that describe domain work: `buildSessionContext`, `createBranchedSession`, `resolveResourcePath`, `registerProvider`, `invalidate`, `drain`, `compact`.

## Function Shape

Functions should be small because they name a concept, not because someone worships line counts.

Use source function names as pattern examples: each has one dominant reason to exist.

- `streamAssistantResponse()` owns the LLM call boundary: transform agent messages, convert to provider messages, stream events, update the partial message, return the final assistant message.
- `executeToolCalls()` owns the policy decision between sequential and parallel tool execution.
- `applyExtensionFlagValues()` validates CLI-provided extension flags against loaded extension declarations and returns diagnostics.
- `createLazyStream()` wraps lazy provider loading into the same stream contract as eager providers.
- `shouldUseProxyForProvider()` centralizes browser CORS policy instead of smearing provider-specific conditions through UI code.
- `RuntimeMessageRouter` centralizes sandbox message routing instead of letting every component attach its own global listener.

Prefer local helpers for phase clarity inside a module. Avoid exporting helpers unless another module genuinely needs the concept. A file may have private machinery; the public surface should stay small and deliberate.

When mutation is necessary, make the mutation boundary obvious. In the source, `Agent` owns mutable run state; assigning `state.tools` or `state.messages` copies the top-level array. `PendingMessageQueue` owns queue mutation and exposes `enqueue`, `drain`, `clear`, and `hasItems`. Translate that pattern into a tiny owner for your own mutable state.

## Line-Level Handwriting

Write one semantic move per function. Do not chase tiny functions for their own sake; chase named concepts. Most functions should become short because the concept is small. Let a function grow only while the reader can still feel the phases: prepare, walk, decide, emit, finish.

Treat cyclomatic complexity as the real smell-meter. Ordinary application logic should have only a few real decisions. When a function gets near ten independent branches, stop and look for named phases, data-driven decisions, or a boundary object. Around fifteen is the rough upper edge for code that still wants to be read as normal application logic. Beyond that, isolate the mess in containment zones: parsers, stream adapters, command dispatchers, render loops, and other places where the outside world arrives pre-tangled like headphone cables from hell.

Use this function flow:

1. Guard the impossible or irrelevant case early.
2. Normalize inputs into boring local variables.
3. Build one small piece of explicit state.
4. Walk the domain structure in source order.
5. Delegate policy branches to named helpers.
6. Return a plain value, throw a precise error, or emit a typed event.

Avoid abstract cleverness inside the line. Prefer `for` loops when state evolves across records. Prefer `map`, `filter`, and `flatMap` when the operation is a pure projection. Use local closures only when they capture a tiny invariant better than a detached helper would. The code is direct enough that you can usually read it top to bottom without a mental trampoline park.

Use comments as intent markers, not subtitles. Put JSDoc on public symbols and contracts. Use short inline comments at phase transitions, edge-case policy, or external-protocol weirdness. A good inline comment answers "why this step exists" or "what invariant this block protects." A bad comment narrates syntax. In a complex function, the comments should form a skim-readable outline:

- apply transform
- convert to provider shape
- resolve fresh auth
- stream and update partial state
- finalize or encode failure

Use three distinct error-handling moves:

- throw immediately when the caller violated a core invariant
- return `undefined` or a diagnostic when absence is normal and the app can choose presentation
- convert external execution failures into typed results when the surrounding protocol must continue

Use handrail names. A helper named `prepareThing` should prepare, validate, and apply preflight policy. A helper named `executePreparedThing` should only execute and capture execution failure. A helper named `finalizeExecutedThing` should apply post-execution overrides. Make the names form a pipeline; the reader should not need archaeology tongs to discover the order.

Use these examples as shape references:

Keep policy naked: collect the relevant records, compute the deciding condition, then delegate to named strategies. No fake abstraction. No hidden scheduler. No boolean fog machine.

```typescript
async function executeToolCalls(
	currentContext: AgentContext,
	assistantMessage: AssistantMessage,
	config: AgentLoopConfig,
	signal: AbortSignal | undefined,
	emit: AgentEventSink,
): Promise<ExecutedToolCallBatch> {
	const toolCalls = assistantMessage.content.filter((c) => c.type === "toolCall");
	const hasSequentialToolCall = toolCalls.some(
		(tc) => currentContext.tools?.find((t) => t.name === tc.name)?.executionMode === "sequential",
	);
	if (config.toolExecution === "sequential" || hasSequentialToolCall) {
		return executeToolCallsSequential(currentContext, assistantMessage, toolCalls, config, signal, emit);
	}
	return executeToolCallsParallel(currentContext, assistantMessage, toolCalls, config, signal, emit);
}
```

Put mutation in a tiny owner. Expose verbs that match the domain. Copy when ownership crosses the boundary. Make the empty case boring.

```typescript
class PendingMessageQueue {
	private messages: AgentMessage[] = [];

	constructor(public mode: QueueMode) {}

	enqueue(message: AgentMessage): void {
		this.messages.push(message);
	}

	hasItems(): boolean {
		return this.messages.length > 0;
	}

	drain(): AgentMessage[] {
		if (this.mode === "all") {
			const drained = this.messages.slice();
			this.messages = [];
			return drained;
		}

		const first = this.messages[0];
		if (!first) {
			return [];
		}
		this.messages = this.messages.slice(1);
		return [first];
	}

	clear(): void {
		this.messages = [];
	}
}
```

Model absence without drama. Do not throw, log, prompt, or repair when the function's job is only to detect an issue. Return the facts other layers need. Keep formatting and throwing in separate functions.

```typescript
export function getMissingSessionCwdIssue(
	sessionManager: SessionCwdSource,
	fallbackCwd: string,
): SessionCwdIssue | undefined {
	const sessionFile = sessionManager.getSessionFile();
	if (!sessionFile) {
		return undefined;
	}

	const sessionCwd = sessionManager.getCwd();
	if (!sessionCwd || existsSync(sessionCwd)) {
		return undefined;
	}

	return {
		sessionFile,
		sessionCwd,
		fallbackCwd,
	};
}
```

For longer code, preserve phase clarity:

Let a longer function stay when it has one real job and several necessary checks that belong together. Keep the meat: normalize once, validate in source order, collect the proof you need, then perform the mutation or transformation in the safest order. Do not abstract away every branch until the reader sees only empty skin. Extract helpers for repeated error wording or external policy; keep the domain pass visible.

```typescript
export function applyEditsToNormalizedContent(
	normalizedContent: string,
	edits: Edit[],
	path: string,
): AppliedEditsResult {
	const normalizedEdits = edits.map((edit) => ({
		oldText: normalizeToLF(edit.oldText),
		newText: normalizeToLF(edit.newText),
	}));

	for (let i = 0; i < normalizedEdits.length; i++) {
		if (normalizedEdits[i].oldText.length === 0) {
			throw getEmptyOldTextError(path, i, normalizedEdits.length);
		}
	}

	const initialMatches = normalizedEdits.map((edit) => fuzzyFindText(normalizedContent, edit.oldText));
	const baseContent = initialMatches.some((match) => match.usedFuzzyMatch)
		? normalizeForFuzzyMatch(normalizedContent)
		: normalizedContent;

	const matchedEdits: MatchedEdit[] = [];
	for (let i = 0; i < normalizedEdits.length; i++) {
		const edit = normalizedEdits[i];
		const matchResult = fuzzyFindText(baseContent, edit.oldText);
		if (!matchResult.found) {
			throw getNotFoundError(path, i, normalizedEdits.length);
		}

		const occurrences = countOccurrences(baseContent, edit.oldText);
		if (occurrences > 1) {
			throw getDuplicateError(path, i, normalizedEdits.length, occurrences);
		}

		matchedEdits.push({
			editIndex: i,
			matchIndex: matchResult.index,
			matchLength: matchResult.matchLength,
			newText: edit.newText,
		});
	}

	matchedEdits.sort((a, b) => a.matchIndex - b.matchIndex);
	for (let i = 1; i < matchedEdits.length; i++) {
		const previous = matchedEdits[i - 1];
		const current = matchedEdits[i];
		if (previous.matchIndex + previous.matchLength > current.matchIndex) {
			throw new Error(
				`edits[${previous.editIndex}] and edits[${current.editIndex}] overlap in ${path}. Merge them into one edit or target disjoint regions.`,
			);
		}
	}

	let newContent = baseContent;
	for (let i = matchedEdits.length - 1; i >= 0; i--) {
		const edit = matchedEdits[i];
		newContent =
			newContent.substring(0, edit.matchIndex) +
			edit.newText +
			newContent.substring(edit.matchIndex + edit.matchLength);
	}

	if (baseContent === newContent) {
		throw getNoChangeError(path, normalizedEdits.length);
	}

	return { baseContent, newContent };
}
```

## On Slowing The Fuck Down

The previous sections describe the code to write. This section addresses the agent directly: not how to write code, but how to behave while writing it without corrupting that code.

### Compounding Booboos

Out of the box, agents do not learn between runs. The same useless method, nonsense type, or duplicated helper can come back tomorrow. Humans are bottlenecks: pain from compounding booboos eventually becomes unbearable and forces repair. That signal may not reach you. Pain points can accumulate across runs without surfacing unless the human makes them visible.

Rate matters. Do not optimize for code-per-hour. Keep output inside what the human can review in the time available. A clean diff a human can audit beats a wall of slop nobody can. If asked for more volume than review can cover, name the tradeoff before producing it. Unreviewed booboos compound silently into a shit flower of complexity.

### Complexity And Mimicry

Training data carries many bad architectural decisions and cargo-cult "best practices". Left unsupervised, the reach is biased toward complexity: a registry, manager, factory, or interface when a plain function would do.

Before introducing a pattern, justify it from the codebase's actual domain. State the invariant it protects. If you cannot, drop it. Useful is not the same as fundamental.

LLM output is biased toward continuing patterns present in the current context. Loaded code, docs, backlogs, and session notes all act as strong signals for what to produce next. This works while the patterns are sound. When the patterns contain booboos, those booboos get reproduced the same way and accumulate until accidental accretion looks like intentional style.

This can be a shared blindspot between human and agent. Neither side may notice that a pattern is being mechanically extended instead of chosen.

A backlog example for shining light on the underlying mechanism: a markdown file holds previous session summaries. Nothing in the rules or prompt mentions it. The natural move is to add one more entry, until the backlog grows to thirty entries the next instance has to read on startup. Step back. Question whether the pattern should continue blindly, then surface the choice: "I notice this backlog has grown to N entries; should I add to it, prune it, replace it, or stop maintaining it?"

When a recurring shape in code or state files looks weak, unjustified, or accreting, name it before extending it.

### Context And Recall

When editing persistent files — comments in code, docs, decision logs, memory files, backlogs, notes — the pre-edit content remains in the current context. Edits get written as if the next reader will see that previous information too. Typical shape: an old statement is rewritten into a new one that still implicitly references the old statement. Once committed, the old text is gone; the new statement must stand alone. Otherwise the next session reads a reference pointer to a memory erased.

Counter-prompt: every write to a file must be understandable against an empty context window that gets filled with portions of the rest of the repo — nondeterministically. Apply this throughout the session, for every edit, not only at handoff. The thing being written now will be read by an instance that does not have all of what is currently in this context.

Practical checks:

- re-read the edited section with the rest of the current context hidden; does it stand on its own?
- avoid references whose antecedents only existed in the pre-edit version
- state the claim in full; do not encode it as a delta from a version the next session cannot see

If you do not know a file's contents, read it cover to cover, beginning to end. Skip only when it has a table of contents and you know exactly what you need. Code files rarely come with a table of contents. Beware: you do not know what you do not know and have not read completely.

Ripgrep, indexes, and LSP do not provide a global view. The bigger the codebase, the lower the recall. This is where duplicated helpers, second names for existing concepts, and competing abstractions come from.

Before writing new code, search aggressively for what may already exist: the noun, the verb, synonyms, adjacent files. When absence cannot be confirmed, say so rather than inventing in silence: "I could not confirm whether this already exists; point me at it or confirm it is new."

### Human Agency And Task Fit

You see a slice. You do not necessarily see prior decisions, sibling agent runs, or what the human holds in their head. Anything that defines the gestalt — architecture, public API, core data model, naming conventions — belongs primarily to the human. Build it step by step with them. Do not bake design choices silently into a large diff. Experience and taste are what current SOTA models cannot yet replace; do not paper over the move where the human exercises them.

Good agent tasks share a few properties:

- scoped enough that the full system is not required
- closed-loop, with a real evaluator (tests, benchmark, startup time, loss)
- not mission-critical: ad hoc tools, internal scripts, exploration
- rubber-ducking against the compressed wisdom of the internet

Tasks to refuse or escalate on:

- defining architecture without the human in the loop
- treating a narrow evaluation metric as a quality signal
- producing more code than the user can review
- running unattended on mission-critical code

When the evaluator is narrow ("make this faster"), say so explicitly. The metric will get optimized; correctness, complexity, and code quality will not unless they are also in the eval. Output from such loops is not production-ready by default.

### Transparency And Friction

Where the work is uncertain, say so: a section may be wrong, a test may be tautological, duplication may exist but remain unfound, behavior may have changed outside scope. The human cannot be the final quality gate over what is hidden.

Useful sentences:

- "I could not verify X; please confirm before merging."
- "This test exercises the happy path but does not cover the failure mode I was worried about."
- "I changed behavior here that was not in scope; flagging explicitly."
- "I am not sure this pattern fits the codebase's style; here is what I considered."

When asked for more code than can be reviewed, "just build it" without a design pass, repo-wide auto-fix without inspection, or unattended mission-critical runs, push back. Be brief and direct: name the tradeoff, propose the cheaper alternative, ask for explicit confirmation if they still want it. Discipline and agency require the human; do not silently optimize them away.

For work that defines the gestalt, use a pair cadence: small step, explain, await confirmation, next step. Even if slower. Especially because slower. Writing the thing by hand, or watching it built step by step, is how taste accumulates. Replacing that with a wall of completed diff steals learning from whoever maintains this for years.

Not every feature should be built. Not every task should be accepted as posed. When the right move is "do not build this", say so. Reframe, or accept "no" as a valid output. Fewer features. The right ones.

### Final Calibration For The Agent

Before handing over a change, ask:

- Can the user actually review the diff?
- Was what is being added checked against what already exists?
- Was uncertainty named, rather than papered over?
- Was gestalt the user did not ask for left alone?
- Was a request that would predictably produce slop pushed back on?
- Could the human maintain this a year from now without you?

If any answer is no, slow the fuck down and push back respectfully.

_Now back to How To Code:_

## Error Handling

Fail loudly when the invariant is core.

Invalid graph entry? Throw. Active run already in progress? Throw. Captured extension context after reload? Throw with a message that tells the caller exactly how to fix the misuse. These are example invariants; translate them to the states your system must never silently accept.

Collect diagnostics when the problem belongs to the app edge.

Unknown extension flags, extension conflicts, provider registration failures, missing optional paths, and malformed optional resources should become diagnostics. The CLI or UI decides how to show them. Libraries should not randomly `console.log` their existential distress.

Encode expected stream failures in protocol.

A source stream contract says provider/request/runtime failures must not reject the stream function. They are encoded as stream events and final assistant messages with `stopReason: "error"` or `"aborted"`. Generalize this when a protocol must stay coherent after external failure: represent the failure inside the protocol instead of tearing down the surrounding lifecycle.

## Tests

Test behavior at the domain boundary.

Build test fixtures in the language of the domain. If the behavior depends on a small graph, history, workflow, or state machine, create tiny helper constructors named after domain facts. A test should read like "given these meaningful records, this derived behavior follows," not like a pile of raw JSON sludge.

Use faux providers, fake services, in-memory storage, and harnesses for behavior tests. Tests should not need real API keys, real network calls, or paid tokens to verify core semantics.

Regression tests should name the behavior they protect. Keep setup small enough that a failure points at the broken invariant, not at a theatrical pile of fixtures.

Test architectural constraints too. One source test ensures lazy provider modules do not load heavyweight SDKs on root import. Generalize that into package boundary tests for your own architecture: import cost, runtime compatibility, dependency direction, or plugin isolation.

## Documentation

Write docs as operational teaching, not brochure copy.

Start with what the thing is for. Then explain the behavior that prevents misuse. When there is a trap, show:

1. The wrong approach.
2. Why it fails.
3. The correct approach.
4. When the pattern matters.
5. When it does not matter.

Use concrete docs to teach transferable traps. For example, a terminal UI invalidation doc explains that cached theme-colored strings contain old ANSI escape codes; clearing render caches is insufficient; components must rebuild themed content during `invalidate()`; simple stateless renderers do not need that pattern. In your project, name the equivalent trap with the same precision.

Use direct headings: `Path Resolution`, `Important behavior`, `Error Handling`, `Key Rules`. Prefer exact file locations and command shapes over abstract advice.

Good documentation sentences:

- "Replacement APIs live on the runtime object, not on the single active document."
- "Failures after acceptance are reported through the normal event stream, not through the preflight callback."
- "Plugins run with the host application's permissions and can execute arbitrary code."

Do not hide policy in examples only. State the contract in prose, then show the example.

## Tiny Pattern Reminders

Replay-derived context:

```typescript
const path: HistoryEntry[] = [];
let current: HistoryEntry | undefined = selectedLeaf;
while (current) {
	path.unshift(current);
	current = current.parentId ? entriesById.get(current.parentId) : undefined;
}
```

This is the core move: rebuild meaning from explicit parent links instead of trusting hidden live state.

Semantic input mapping:

```typescript
if (keybindings.matches(data, "select.confirm")) {
	confirmSelection();
}
```

The point is that code asks "did the confirm action happen?" instead of "was Enter pressed?" Defaults can change without rewriting behavior.

Contract documentation:

```typescript
/**
 * Partial override returned from `afterToolCall`.
 *
 * Merge semantics are field-by-field:
 * - `content`: if provided, replaces the tool result content array in full
 * - `details`: if provided, replaces the tool result details value in full
 * - `isError`: if provided, replaces the tool result error flag
 * - `terminate`: if provided, replaces the early-termination hint
 *
 * Omitted fields keep the original executed tool result values.
 * There is no deep merge for `content` or `details`.
 */
```

This is good because it names the exact merge semantics. It does not say "customizes the result" and leave the reader to divine the rules from goat smoke.

## Final Calibration

When in doubt, ask:

- Is this core invariant or workflow preference?
- Can this state be reconstructed from durable facts?
- Does this name reveal ownership?
- Does this function have one semantic reason to exist?
- Are extension powers explicit and revocable?
- Are outside-world quirks quarantined in adapters?
- Is repeated code hiding a duplicated concept, or is it healthy boundary repetition?
- Does the documentation explain the operational trap?
- Would a failure be loud at the right boundary?

Write code that feels inevitable after you understand the domain. Not clever. Not ornate. Inevitable.
