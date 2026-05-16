# Rust Best Practices

This file is the Rust-specific stack overlay.

Read this **after** the general field guides when your stack is:

- Rust
- Cargo workspaces or crates
- library and binary code with explicit ownership
- typed domain logic where compile-time guarantees matter

## Why this stack matters

Rust changes how you should encode guarantees.

Its real leverage is not novelty syntax.
Its leverage is that ownership, error handling, dispatch choice, and type modeling can move whole bug classes earlier in the lifecycle.

The generalized lessons from `rust-best-practices` are:

1. **borrowing should be the default**
2. **errors should be explicit, typed, and propagated**
3. **clippy and linting are architecture pressure, not optional polish**
4. **performance work starts with ownership and allocation discipline**
5. **tests and docs should read like behavior contracts**
6. **the type system should encode valid state when the state matters**

## Primary source material to study

If you have the source material available, read these first:

- `rust-best-practices/SKILL.md`
- `references/chapter_01.md` — coding styles and idioms
- `references/chapter_02.md` — clippy and linting discipline
- `references/chapter_03.md` — performance mindset
- `references/chapter_04.md` — error handling
- `references/chapter_05.md` — automated testing
- `references/chapter_06.md` — generics and dispatch
- `references/chapter_07.md` — type state pattern
- `references/chapter_08.md` — comments vs documentation
- `references/chapter_09.md` — understanding pointers

## Rust-specific rules worth carrying forward

## 1. Borrow first, clone only with a reason

Treat every clone as a cost and a design decision.

Prefer:

- `&T` over `T` when ownership transfer is not needed
- `&str` over `String` in parameters
- `&[T]` over `Vec<T>` in parameters
- iterator access over building throwaway owned collections

Use `.clone()` only when you can explain the ownership boundary it serves.

## 2. Pass small `Copy` values by value, not by ritual reference

For small `Copy` types, passing by value is usually clearer.

The point is not to maximize references everywhere.
The point is to model ownership honestly and cheaply.

Do not wrap tiny values in needless borrowing ceremony.
Do not mark large data structures `Copy` just to dodge design choices.

## 3. `Result` is the default failure model

In production Rust code:

- return `Result<T, E>` for fallible operations
- avoid `panic!` for recoverable failures
- avoid `unwrap()` and `expect()` outside tests and extremely narrow one-off startup paths
- use `?` for propagation instead of repetitive match ladders

Use:

- `thiserror` for library/crate error types
- `anyhow` at binary/application edges only when erased context is acceptable

The error model should explain what failed, not just that something failed.

## 4. Lints are part of the engineering contract

Run clippy regularly and treat it as a serious gate.

Strong defaults:

- `cargo clippy --all-targets --all-features --locked -- -D warnings`
- prefer `#[expect(clippy::...)]` with justification over broad `#[allow(...)]`

Pay particular attention to lints around:

- redundant cloning
- needless collection
- large enum variants
- avoidable allocations

A healthy Rust codebase lets the toolchain keep pressure on drift.

## 5. Performance begins with data movement

Rust performance work starts with very ordinary questions:

- are we cloning in loops?
- are we collecting intermediate structures unnecessarily?
- are we allocating on the heap without need?
- are we erasing types and paying dynamic dispatch costs in hot paths?

Profile in `--release`.
Benchmark before claiming a win.
Prefer static dispatch by default, then use `dyn Trait` when heterogeneous behavior or boundary ergonomics actually require it.

## 6. Use iterators deliberately, not dogmatically

Iterators are often expressive and zero-cost.

But the real principle is clarity plus no wasted work.

Prefer iterators when they:

- express a transformation pipeline clearly
- avoid needless temporary allocations
- make ownership/borrowing cleaner

Prefer `for` loops when they make mutation, control flow, or readability better.

This is not a religion.
It is about honest cost and maintainable intent.

## 7. Encode state safety in types when it materially reduces bugs

Rust gives you unusual leverage through type-state and other type-driven modeling.

Use it when invalid transitions are expensive or dangerous.

Examples:

- connection before/after authentication
- builder values that must be set before `build`
- protocol/session lifecycle states
- resource handles that become usable only after initialization

Do not force type-state into every toy problem.
Use it when compile-time exclusion of invalid behavior is worth the extra shape.

## 8. Pick the smallest correct pointer and sharing tool

Do not reach for `Arc<Mutex<T>>` as a reflex.

Choose deliberately among:

- `&T` / `&mut T`
- `Box<T>`
- `Rc<T>` / `Arc<T>`
- `Cell<T>` / `RefCell<T>`
- `Mutex<T>` / `RwLock<T>`
- `OnceCell` / `OnceLock` / lazy variants

The rule is simple:

- use the least powerful mechanism that satisfies ownership, mutability, and thread-safety needs
- make `Send` / `Sync` boundaries explicit
- avoid hidden shared mutable state

## 9. Tests should read like executable behavior documentation

Carry forward these habits:

- descriptive test names
- one behavior per test where possible
- very few assertions per test
- unit tests for local logic
- integration tests for boundary behavior
- doc tests for public API examples
- snapshot tests only when output shape is truly the contract

Also test error paths deliberately.
A Rust suite that only proves happy-path ownership is not strong enough.

## 10. Comments explain why; docs explain what and how

Use:

- `//` comments for rationale, safety notes, workarounds, and non-obvious design context
- `///` doc comments for public API behavior and examples
- `//!` for module/crate-level documentation when structure matters

Do not narrate obvious code.
Do not leave vague TODOs with no issue or follow-up path.

## 11. Rust done-means-verified is stricter than “it compiles”

A good Rust verification baseline usually includes:

- `cargo fmt`
- `cargo clippy --all-targets --all-features --locked -- -D warnings`
- `cargo test`
- doc tests where public APIs expose examples
- targeted benchmarks or profiling for performance-sensitive work

If the change affects ownership, concurrency, or state safety, review those explicitly.
The compiler helps, but it does not replace design review.

## If the stack only partially matches

Steal these ideas even outside Rust:

- ownership boundaries should be explicit
- errors should be typed and intentional
- allocation and copying should be conscious
- linting should enforce discipline
- tests should read as behavior contracts
- valid state should be encoded structurally when possible

Those are the durable lessons.