# Effect TanStack Start

A modern, full-stack TypeScript application built with **Effect-TS**, **TanStack Start**, and **Bun**, featuring comprehensive testing, monitoring, and analytics out of the box.

## ✨ Features

### Core Stack

- 🚀 **[Bun](https://bun.sh)** - Fast JavaScript runtime and package manager
- ⚡ **[Effect-TS](https://effect.website)** - Powerful functional effect system
- 🎯 **[TanStack Start](https://tanstack.com/router/latest/docs/framework/react/start/getting-started)** - Full-stack React framework with SSR
- 🎨 **[Tailwind CSS 4](https://tailwindcss.com)** - Utility-first CSS framework
- 📦 **effect/unstable/reactivity + @effect/atom-react** - Atomic state management
- 🔄 **[effect/unstable/rpc](https://effect.website/docs/guides/rpc/overview)** - Type-safe client-server communication

### Testing & Quality

- 🧪 **[Vitest 4](https://vitest.dev)** - Fast unit testing with browser mode
- 🎭 **[@effect/vitest](https://effect.website/docs/guides/testing/vitest)** - Effect-based testing with TestContext
- 🌐 **Multi-Browser Testing** - Chromium, Firefox, WebKit via Playwright
- 📸 **Visual Regression Testing** - Screenshot comparison across browsers
- 🔍 **Component Testing** - Real browser testing for React components

### Observability & Analytics

- 📊 **[Grafana Stack](https://grafana.com)** - Complete monitoring solution
  - **Loki** - Log aggregation
  - **Tempo** - Distributed tracing
  - **Prometheus** - Metrics collection
  - **Grafana** - Unified dashboards
- 🐛 **[Sentry](https://sentry.io)** - Error tracking and performance monitoring (self-hosted)
- 📈 **[PostHog](https://posthog.com)** - Product analytics and feature flags (self-hosted)
- 🔭 **OpenTelemetry** - Distributed tracing and observability

### Infrastructure

- 🐳 **Docker Compose** - Complete local development stack
- 🔄 **Hot Reload** - Fast development with HMR
- 🏗️ **Production Ready** - Optimized builds and deployment configs

---

## 🚀 Quick Start

### Option 1: Local Development

```bash
# Install dependencies
bun install

# Install Playwright browsers for testing
bunx playwright install --with-deps

# Copy environment template
cp .env.example .env

# Start development server
bun run dev
```

Visit http://localhost:3000

### Optional: Nix Dev Shell

```bash
nix develop
```

### Option 2: Full Stack with LAOS (Recommended)

```bash
# Clone LAOS stack (keep it outside this repo)
git clone https://github.com/dtechvision/laos.git ../laos
cd ../laos

# Start observability stack
docker compose up -d

# Configure app env (add DSN/API keys from LAOS UIs)
cd -
cp .env.example .env
echo "SENTRY_DSN=http://...@localhost:9000/1" >> .env
echo "VITE_SENTRY_DSN=http://...@localhost:9000/1" >> .env
echo "VITE_POSTHOG_KEY=phc_..." >> .env
echo "VITE_POSTHOG_HOST=http://localhost:8001" >> .env
```

**Access Services:**

- 🌐 **Application**: http://localhost:3000
- 📊 **Grafana** (Logs, Traces, Metrics): http://localhost:3010 (admin/admin)
- 🐛 **Sentry** (Errors): http://localhost:9000
- 📈 **PostHog** (Analytics): http://localhost:8001
- 📉 **Prometheus** (Metrics): http://localhost:9090

📚 **See [Observability Setup](./docs/guides/observability-setup.md) for full LAOS + telemetry instructions**

---

## 📦 Project Structure

```
effect-tanstack-start/
├── docs/                          # Documentation
│   ├── architecture/              # Architecture and patterns
│   │   ├── effect-native-atoms.md # State management pattern (START HERE)
│   │   ├── effect-simple-made-easy-mapping.md # Feature patterns
│   │   └── overview.md            # System architecture
│   ├── guides/                    # How-to guides
│   │   ├── adding-new-features.md # Copy-paste feature guide
│   │   ├── getting-started.md     # Setup guide
│   │   ├── observability-setup.md # Full observability + LAOS setup
│   │   ├── testing.md             # Testing guide
│   │   └── telemetry.md           # Observability guide
│   └── reference/                 # Reference implementations
│       └── todo/                  # Todo app reference (symlinked)
├── src/
│   ├── api/                       # API schemas and clients
│   ├── features/                  # Domain features (todos/)
│   ├── lib/                       # Shared utilities
│   ├── routes/                    # File-based routing
│   │   └── -index/                → symlink to docs/reference/todo/
│   └── *.test.ts                  # Unit tests
├── AGENTS.md                      # Agent instructions (START HERE)
├── CONTRIBUTING.md                # Contribution guidelines
└── TESTING_AND_TELEMETRY.md       # Testing & observability
```

---

## 🧪 Testing

```bash
# Run all tests
bun run test

# Run specific test suites
bun run test:unit        # Effect-based unit tests
bun run test:component   # Component tests (3 browsers)
bun run test:visual      # Visual regression tests

# Update visual regression baselines
bun run test:visual:update

# Watch mode
bun run test:watch

# Type checking
bun run typecheck
```

**Test Types:**

- **Unit Tests** - Effect-based tests with @effect/vitest
- **Component Tests** - Real browser testing with Playwright
- **Visual Regression** - Screenshot comparison across browsers

📚 **See [Testing Guide](./docs/guides/testing.md) for complete documentation**

---

## 🏗️ Building

```bash
# Build for production
bun run build

# Preview production build
bun run preview
```

---

## 📘 Observability Setup

📚 **See [Observability Setup](./docs/guides/observability-setup.md) for full LAOS + telemetry instructions**

---

## 📊 Monitoring & Observability

### Logs (Grafana Loki)

```typescript
import { Effect } from "effect"

const program = Effect.gen(function*() {
  yield* Effect.log("Application started")
  // Logs automatically sent to Loki
})
```

### Traces (OpenTelemetry + Tempo)

```typescript
import { Effect } from "effect"

const program = Effect
  .gen(function*() {
    // Your code here
  })
  .pipe(
    Effect.withSpan("operationName", {
      attributes: { userId: "123" },
    }),
  )
```

### Error Tracking (Sentry)

```typescript
import { captureException } from "./lib/telemetry-client"

try {
  // Your code
} catch (error) {
  captureException(error)
}
```

📚 **See [Telemetry Guide](./docs/guides/telemetry.md) for complete documentation**

---

## 📈 Analytics (PostHog)

### Client-Side

```typescript
import { identifyUser, trackEvent } from "./lib/posthog-client"

// Track events
trackEvent("button_clicked", {
  button_id: "signup",
  page: "/landing",
})

// Identify users
identifyUser({
  userId: "user-123",
  email: "user@example.com",
})

// Feature flags
if (isFeatureFlagEnabled("new_dashboard")) {
  // Show new dashboard
}
```

### Server-Side

```typescript
import { Effect } from "effect"
import { trackServerEvent } from "./lib/posthog-server"

const program = Effect.gen(function*() {
  yield* trackServerEvent("user_signup", {
    distinctId: "user-123",
    plan: "premium",
  })
})
```

📚 **See [PostHog Guide](./docs/guides/posthog.md) for complete documentation**

---

## 🎯 Effect-TS Integration

This project leverages Effect-TS for:

- Type-safe error handling
- Composable business logic
- Resource management with scopes
- Built-in observability (tracing, logging)
- Dependency injection

**Example:**

```typescript
import { Effect } from "effect"

const fetchUser = (userId: string) =>
  Effect
    .gen(function*() {
      yield* Effect.log(`Fetching user: ${userId}`)

      const response = yield* Effect.tryPromise(() =>
        fetch(`/api/users/${userId}`)
      )

      const user = yield* Effect.tryPromise(() => response.json())

      return user
    })
    .pipe(
      Effect.withSpan("fetchUser", { attributes: { userId } }),
    )
```

---

## 📚 Documentation

### For Agents & Contributors

👉 **Start with [AGENTS.md](./AGENTS.md)** - Progressive disclosure guide for the codebase

### Quick Reference

| Task                                | Document                                                                                 |
| ----------------------------------- | ---------------------------------------------------------------------------------------- |
| State management (atoms, mutations) | [`docs/architecture/effect-native-atoms.md`](./docs/architecture/effect-native-atoms.md) |
| Adding new features                 | [`docs/guides/adding-new-features.md`](./docs/guides/adding-new-features.md)             |
| UI components                       | [`docs/design-system/rules.md`](./docs/design-system/rules.md)                           |
| Setup & installation                | [`docs/guides/getting-started.md`](./docs/guides/getting-started.md)                     |

### Guides

- 🏗️ [Adding New Features](./docs/guides/adding-new-features.md) - Copy-paste pattern guide
- 🚀 [Getting Started](./docs/guides/getting-started.md) - Setup and installation
- 🧪 [Testing Guide](./docs/guides/testing.md) - Writing and running tests
- 📊 [Telemetry Guide](./docs/guides/telemetry.md) - Monitoring and observability
- 🧭 [Observability Setup](./docs/guides/observability-setup.md) - LAOS stack setup
- 🐳 [App Docker Guide](./docs/guides/app-docker.md) - Containerize the app only
- 🗄️ [PostgreSQL Guide](./docs/guides/database-postgresql.md) - PostgreSQL with Drizzle ORM
- 💾 [PGlite Guide](./docs/guides/database-pglite.md) - Local embedded Postgres with Drizzle ORM
- ✨ [Code Quality Guide](./docs/guides/code-quality.md) - Linting and formatting
- ⚡ [Performance Monitoring](./docs/guides/performance-monitoring.md) - Bundle size & Web Vitals

### Architecture

- ⚡ [Effect-Native Atoms](./docs/architecture/effect-native-atoms.md) - State management pattern
- 🏗️ [Architecture Overview](./docs/architecture/overview.md) - System design
- 🧵 [Simple Made Easy](./docs/architecture/simple-made-easy.md) - Simplicity as explicit design policy
- 🗺️ [Effect-Simple-Made-Easy Mapping](./docs/architecture/effect-simple-made-easy-mapping.md) - Feature patterns

### Complete Documentation

- 🤖 [AGENTS.md](./AGENTS.md) - Agent instructions (START HERE)
- 📖 [CONTRIBUTING.md](./CONTRIBUTING.md) - Contribution guidelines
- 🧪 [TESTING_AND_TELEMETRY.md](./TESTING_AND_TELEMETRY.md) - Testing & observability

---

## 🔧 Available Scripts

```bash
# Development
bun run dev              # Start dev server with hot reload

# Testing
bun run test             # Run all tests
bun run test:unit        # Run Effect-based unit tests
bun run test:component   # Run component tests
bun run test:visual      # Run visual regression tests
bun run test:watch       # Run tests in watch mode

# Building
bun run build            # Build for production
bun run preview          # Preview production build

# Code Quality
bun run typecheck        # TypeScript type checking
bun run lint             # Run Oxlint
bun run lint:fix         # Fix Oxlint issues automatically
bun run format           # Format code with Dprint
bun run format:check     # Check code formatting
```

---

## 🌟 Key Highlights

### Type Safety

- **End-to-end type safety** with TypeScript and Effect-TS
- **Type-safe RPC** with effect/unstable/rpc
- **Type-safe routing** with TanStack Router

### Developer Experience

- **Hot Module Replacement** - Instant feedback
- **Browser DevTools** - Debug tests in real browsers
- **Comprehensive Testing** - Unit, component, and visual regression
- **Built-in Monitoring** - Pre-configured observability stack

### Production Ready

- **Self-hosted monitoring** - Full control over data
- **Error tracking** - Automatic error capture and reporting
- **Analytics** - Product analytics and feature flags
- **Distributed tracing** - Track requests across services
- **Docker deployment** - Complete containerized stack

---

## Subagent Ready

### Structure

```
## 🤖 Subagent Coordination - Delegation Protocol
├── When to Delegate (use cases + anti-patterns)
├── Prompt Quality Standards (✅ good / ❌ bad)
├── Task Specification Template (complete XML)
├── Task Templates by Type
│   ├── Feature Implementation
│   ├── Test Writing
│   └── Refactor
├── Subagent Report Format (full XML spec)
├── Status Definitions (table)
├── Handoff Document Template
├── Parallel Execution Pattern (Mermaid diagram)
└── Common Pitfalls to Avoid
```

### Key Features

Report Format - Compliant with our spec:

```
<agent_report>
  <task_id>...</task_id>
  <status>complete | partial | blocked | failed</status>
  <work_completed>...</work_completed>
  <files_changed>...</files_changed>
  <verification>...</verification>
  <outcomes>...</outcomes>
  <incomplete_tasks>...</incomplete_tasks>
  <blockers>...</blockers>
  <decisions_made>...</decisions_made>
  <follow_up_tasks>...</follow_up_tasks>
  <notes>...</notes>
</agent_report>
```

Prompt Quality Standards - From our style guide:

- ✅ Specific, Complete, Constrained, Structured, Example-driven
- ❌ Vague, Context-free, Unconstrained, Wall-of-text

Task Templates - Ready-to-copy XML specs for features, tests, and refactors with success criteria and constraints.

## 🤝 Contributing

We welcome contributions! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on:

- Setting up your development environment
- Project architecture and patterns
- Testing requirements
- Code style and conventions
- Pull request process

---

## 📄 License

[Your License Here]

---

## 🙏 Acknowledgments

Built with amazing open-source technologies:

- [Effect-TS](https://effect.website)
- [TanStack](https://tanstack.com)
- [Bun](https://bun.sh)
- [Vitest](https://vitest.dev)
- [Grafana](https://grafana.com)
- [Sentry](https://sentry.io)
- [PostHog](https://posthog.com)
- [Playwright](https://playwright.dev)

---

**Ready to build?** 🚀

```bash
bun install
bun run dev
```

For the full observability stack (outside this repo):

```bash
git clone https://github.com/dtechvision/laos.git ../laos
cd ../laos
docker compose up -d
```

Build the app docker image (Nix helper):

```bash
nix run .#build-docker
```
